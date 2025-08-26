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
      // Notify rooms that user disconnected
      this.server.emit('user_disconnected', { userId });
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`room_${data.roomId}`);
    console.log(`Client ${client.id} joined room ${data.roomId}`);

    // Notify other users in the room
    client.to(`room_${data.roomId}`).emit('user_joined_room', {
      socketId: client.id,
      roomId: data.roomId,
    });
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`room_${data.roomId}`);
    console.log(`Client ${client.id} left room ${data.roomId}`);

    // Notify other users in the room
    client.to(`room_${data.roomId}`).emit('user_left_room', {
      socketId: client.id,
      roomId: data.roomId,
    });
  }

  @SubscribeMessage(GameEventType.GAME_STARTED)
  handleGameStarted(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`GAME_STARTED from ${client.id}`, data);
  }

  @SubscribeMessage(GameEventType.GAME_ENDED)
  handleGameEnded(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`GAME_ENDED from ${client.id}`, data);
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
}
