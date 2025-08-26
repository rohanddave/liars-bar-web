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
import {UnauthorizedException, Injectable} from '@nestjs/common';
import {JwtPayload} from 'src/auth/strategies/jwt.strategy';
import { RoomsService } from '../service/rooms.service';
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

  constructor(
    private readonly jwtServer,
    private readonly roomsService: RoomsService,
  ){}


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
      console.log(`Client authenticated and connected: ${client.id} (User: ${payload.username})`)
      
      client.emit('connection_established', {
        status: 'connected',
        userId: payload.id
      } catch (error) {
        console.error(`Auth failed: ${error.message}`);
        client.disconnect(true);
      });
    
    }


  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      // Notify rooms that user disconnected
      this.server.emit('user_disconnected', { userId });
      this.userRooms.delete(userId);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if(!userId){
      client.emit('error', {message: 'Auth required'});
      return {success: false, message: 'Auth required'};
    }
    try {
      const isAuthorized = await this.verifyRoomAccess(userId, data.roomId);

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
      roomId: data.roomId,
    });
    return { success: true, message: 'Left room successfully' };
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

  private async verifyRoomAccess(userId: string, roomId: string): Promise<boolean> {
    try {
      // Check if user has joined the room via REST API
      const roomAccess = await this.roomsService.checkUserRoomAccess(userId, roomId);
      return roomAccess;
    } catch (error) {
      console.error(`Error verifying room access: ${error.message}`);
      return false;
    }
  }
}
