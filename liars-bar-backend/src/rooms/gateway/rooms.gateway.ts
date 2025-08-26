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
import { Room } from '../entities/room.entity';
import { IGame } from 'src/game';
import { GameEventType } from 'src/game/action/event.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'rooms',
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId
  // TODO: add map for roomId -> Game instance
  private rooms = new Map<string, Room>();
  private games = new Map<string, IGame>(); // roomId -> Game instance

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
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
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = data;

    // If userId provided, register the user connection
    if (userId) {
      this.registerUser(client.id, userId);
    }

    // Get userId from connected users map
    const connectedUserId = userId || this.connectedUsers.get(client.id);

    if (!connectedUserId) {
      client.emit('join_room_error', { message: 'User ID required' });
      return;
    }

    // Check if room exists and user can join
    const room = this.getRoom(roomId);
    if (room && !this.canJoinRoom(roomId)) {
      client.emit('join_room_error', { message: 'Room is full' });
      return;
    }

    // Add player to room (this will update the rooms Map)
    if (room) {
      const success = this.addPlayerToRoom(roomId, connectedUserId);
      if (!success) {
        client.emit('join_room_error', { message: 'Failed to join room' });
        return;
      }
    }

    await client.join(`room_${roomId}`);
    console.log(
      `Client ${client.id} (User: ${connectedUserId}) joined room ${roomId}`,
    );

    // Notify other users in the room
    client.to(`room_${roomId}`).emit('user_joined_room', {
      socketId: client.id,
      userId: connectedUserId,
      roomId: roomId,
    });

    // Send current room state to the joining user
    const updatedRoom = this.getRoom(roomId);
    if (updatedRoom) {
      client.emit('room_state', {
        roomId: roomId,
        room: updatedRoom,
      });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    const userId = this.connectedUsers.get(client.id);

    if (!userId) {
      console.log(
        `Client ${client.id} tried to leave room ${roomId} but no userId found`,
      );
      return;
    }

    // Remove player from room (this will update the rooms Map)
    const success = this.removePlayerFromRoom(roomId, userId);

    await client.leave(`room_${roomId}`);
    console.log(`Client ${client.id} (User: ${userId}) left room ${roomId}`);

    // Notify other users in the room
    client.to(`room_${roomId}`).emit('user_left_room', {
      socketId: client.id,
      userId: userId,
      roomId: roomId,
    });

    // Send updated room state to remaining users
    const updatedRoom = this.getRoom(roomId);
    if (updatedRoom) {
      this.server.to(`room_${roomId}`).emit('room_state', {
        roomId: roomId,
        room: updatedRoom,
      });
    }

    // Notify the leaving user of successful departure
    client.emit('room_left', { roomId, success });
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
