import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {JwtService } from '@nestjs/jwt';
import {UnauthorizedException, Injectable, Inject, forwardRef} from '@nestjs/common';
import {JwtPayload} from 'src/auth/strategies/jwt.strategy';
import { RoomsService } from '../service/rooms.service';
import { Room } from '../entities/room.entity';
import { IGame } from 'src/game';
import { GameEventType } from 'src/game/action/event.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'rooms',
})
@Injectable()
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId
  private userRooms = new Map<string, string[]>();
  // TODO: add map for roomId -> Game instance
  private rooms = new Map<string, Room>();
  private games = new Map<string, IGame>(); // roomId -> Game instance

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService,
  ) {}


  handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string ||
      client.handshake.headers.authorization?.split(' ')[1];

      if(!token){
        throw new UnauthorizedException('Auth token not given');
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      if(!payload){
        throw new UnauthorizedException('Invalid token')

      }

      this.registerUser(client.id, payload.id);
      console.log(`Client authenticated and connected: ${client.id} (User: ${payload.username})`);
      
      client.emit('connection_established', {
        status: 'connected',
        userId: payload.id
      });
      
    } catch (error) {
      console.error(`Auth failed: ${error.message}`);
      client.disconnect(true);
    }


  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);

      // Remove user from all rooms they were in
      for (const [roomId, room] of this.rooms) {
        if (room.players.includes(userId)) {
          this.removePlayerFromRoom(roomId, userId);

          // Notify other users in the room
          this.server.to(`room_${roomId}`).emit('user_left_room', {
            socketId: client.id,
            userId: userId,
            roomId: roomId,
            reason: 'disconnected',
          });

          // Send updated room state to remaining users
          const updatedRoom = this.getRoom(roomId);
          if (updatedRoom) {
            this.server.to(`room_${roomId}`).emit('room_state', {
              roomId: roomId,
              room: updatedRoom,
            });
          }
        }
      }

      // Notify all users that this user disconnected
      this.server.emit('user_disconnected', { userId });
      this.userRooms.delete(userId);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if(!userId){
      client.emit('error', {message: 'Auth required'});
      return {success: false, message: 'Auth required'};
    }
    try {
      const isAuthorized = await this.roomsService.checkUserRoomAccess(userId, data.roomId);

      if (!isAuthorized){
        client.emit('error', {message: 'not Auth for room'});
        return({success: false, message: 'not Auth for room'});
      }
      await client.join(`room_${data.roomId}`);
      console.log(`Client ${client.id} joined room ${data.roomId}`);

      if(!this.userRooms.has(userId)){
        this.userRooms.set(userId, []);
      }
      this.userRooms.get(userId).push(data.roomId);
      client.to(`room_${data.roomId}`).emit('user_joined_room', {
        socketId: client.id,
        roomId: data.roomId,
      });
      return{success: true, message: 'Joined room sucessfully'};
    } catch(error){
      client.emit('error', {message: error.message });
      return({success: false, message: error.message });
    }
    
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    await client.leave(`room_${data.roomId}`);
    console.log(`Client ${client.id} left room ${data.roomId}`);
    // Remove room from user's list
    if (this.userRooms.has(userId)) {
      const rooms = this.userRooms.get(userId);
      this.userRooms.set(userId, rooms.filter(id => id !== data.roomId));
    }
    // Notify other users in the room
    client.to(`room_${data.roomId}`).emit('user_left_room', {
      socketId: client.id,
      userId: userId,
      roomId: data.roomId,
    });

    // Send updated room state to remaining users
    const updatedRoom = this.getRoom(data.roomId);
    if (updatedRoom) {
      this.server.to(`room_${data.roomId}`).emit('room_state', {
        roomId: data.roomId,
        room: updatedRoom,
      });
    }

    // Notify the leaving user of successful departure
    client.emit('room_left', { roomId: data.roomId, success: true });
  }

  @SubscribeMessage(GameEventType.GAME_STARTED)
  handleGameStarted(
    @MessageBody() data: { roomId: string; game?: IGame },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`GAME_STARTED from ${client.id}`, data);

    const { roomId, game } = data;

    // Store the game instance if provided
    if (game) {
      this.createGame(roomId, game);
    }

    // Notify all users in the room
    this.emitToRoom(roomId, GameEventType.GAME_STARTED, {
      roomId,
      message: 'Game has started!',
    });
  }

  @SubscribeMessage(GameEventType.GAME_ENDED)
  handleGameEnded(
    @MessageBody() data: { roomId: string; result?: any },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`GAME_ENDED from ${client.id}`, data);

    const { roomId, result } = data;

    // Clean up the game instance
    this.deleteGame(roomId);

    // Notify all users in the room
    this.emitToRoom(roomId, GameEventType.GAME_ENDED, {
      roomId,
      result,
      message: 'Game has ended!',
    });
  }

  @SubscribeMessage(GameEventType.PLAYER_INITIALIZED)
  handlePlayerInitialized(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`PLAYER_INITIALIZED from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.ROUND_STARTED)
  handleRoundStarted(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`ROUND_STARTED from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.ROUND_ENDED)
  handleRoundEnded(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`ROUND_ENDED from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.CLAIM_MADE)
  handleClaimMade(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`CLAIM_MADE from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.CHALLENGE_MADE)
  handleChallengeMade(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`CHALLENGE_MADE from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.CHALLENGE_RESULT)
  handleChallengeResult(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`CHALLENGE_RESULT from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.PLAYER_SHOT)
  handlePlayerShot(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`PLAYER_SHOT from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.PLAYER_ELIMINATED)
  handlePlayerEliminated(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`PLAYER_ELIMINATED from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.TURN_CHANGED)
  handleTurnChanged(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`TURN_CHANGED from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.ROOM_JOINED)
  handleRoomJoined(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`ROOM_JOINED from ${client.id}`, data);
  }

  // Emit to all users in a specific room
  emitToRoom(roomId: string, event: string, data: any) {
    this.server.to(`room_${roomId}`).emit(event, data);
  }

  // Emit to specific user
  emitToUser(socketId: string, event: string, data: any) {
    this.server.to(socketId).emit(event, data);
  }

  // Register user connection
  registerUser(socketId: string, userId: string) {
    this.connectedUsers.set(socketId, userId);
  }

  // Room management methods
  createRoom(roomId: string, room: Room) {
    this.rooms.set(roomId, room);
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  updateRoom(roomId: string, room: Room) {
    this.rooms.set(roomId, room);
  }

  deleteRoom(roomId: string) {
    this.rooms.delete(roomId);
    // Also delete associated game if exists
    this.games.delete(roomId);
  }

  getAllRooms(): Map<string, Room> {
    return this.rooms;
  }

  // Game management methods
  createGame(roomId: string, game: IGame) {
    this.games.set(roomId, game);
  }

  getGame(roomId: string): IGame | undefined {
    return this.games.get(roomId);
  }

  updateGame(roomId: string, game: IGame) {
    this.games.set(roomId, game);
  }

  deleteGame(roomId: string) {
    this.games.delete(roomId);
  }

  getAllGames(): Map<string, IGame> {
    return this.games;
  }

  // Check if room exists and has space
  canJoinRoom(roomId: string): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;
    return room.players.length < room.maxPlayers;
  }

  // Add player to room
  addPlayerToRoom(roomId: string, userId: string): boolean {
    const room = this.getRoom(roomId);
    if (!room || !this.canJoinRoom(roomId)) return false;

    if (!room.players.includes(userId)) {
      room.players.push(userId);
      this.updateRoom(roomId, room);
    }
    return true;
  }

  // Remove player from room
  removePlayerFromRoom(roomId: string, userId: string): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const playerIndex = room.players.indexOf(userId);
    if (playerIndex > -1) {
      room.players.splice(playerIndex, 1);

      // If room is empty, delete it
      if (room.players.length === 0) {
        this.deleteRoom(roomId);
      } else {
        this.updateRoom(roomId, room);
      }
    }
    return true;
  }
}
