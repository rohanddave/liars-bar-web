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
