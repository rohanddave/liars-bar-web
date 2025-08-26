import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Room, RoomStatus } from '../entities/room.entity';
import { CreateRoomDto } from '../dto/create-room.dto';
import { JoinRoomDto } from '../dto/join-room.dto';
import { RoomsGateway } from '../gateway/rooms.gateway';
import * as bcrypt from 'bcryptjs';
import { MAX_ROOMS_PER_USER } from 'src/game/constants';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    private roomsGateway: RoomsGateway,
  ) {}

  async getActiveRoomsForUser(userId: string): Promise<Room[]> {
    return this.roomsRepository.find({
      where: {
        hostUserId: userId,
        status: Not(RoomStatus.FINISHED),
      },
    });
  }

  async createRoom(
    createRoomDto: CreateRoomDto,
    userId: string,
  ): Promise<Room> {
    const existingRoomCountForUser = (await this.getActiveRoomsForUser(userId))
      .length;

    if (existingRoomCountForUser >= MAX_ROOMS_PER_USER) {
      throw new BadRequestException('User has reached the room creation limit');
    }

    const hashedPassword = await bcrypt.hash(createRoomDto.password, 10);

    const room = this.roomsRepository.create({
      password: hashedPassword,
      hostUserId: userId,
      players: [userId],
      currentPlayers: 1,
      status: RoomStatus.WAITING,
    });

    const savedRoom = await this.roomsRepository.save(room);

    // Emit room created event
    this.roomsGateway.emitToRoom(savedRoom.id, 'room_created', {
      roomId: savedRoom.id,
      hostUserId: userId,
      players: savedRoom.players,
    });

    return savedRoom;
  }

  async joinRoom(
    roomId: string,
    joinRoomDto: JoinRoomDto,
    userId: string,
  ): Promise<Room> {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Room is not accepting new players');
    }

    if (room.currentPlayers >= room.maxPlayers) {
      throw new BadRequestException('Room is full');
    }

    if (room.players.includes(userId)) {
      throw new ConflictException('User is already in this room');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      joinRoomDto.password,
      room.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid room password');
    }

    // Add user to room
    room.players.push(userId);
    room.currentPlayers = room.players.length;

    const updatedRoom = await this.roomsRepository.save(room);

    // Emit user joined event to all users in the room
    this.roomsGateway.emitToRoom(roomId, 'user_joined', {
      roomId,
      userId,
      players: updatedRoom.players,
      currentPlayers: updatedRoom.currentPlayers,
    });

    return updatedRoom;
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.players.includes(userId)) {
      throw new BadRequestException('User is not in this room');
    }

    // Remove user from room
    room.players = room.players.filter((id) => id !== userId);
    room.currentPlayers = room.players.length;

    // If no players left, delete the room
    if (room.currentPlayers === 0) {
      await this.roomsRepository.remove(room);
      this.roomsGateway.emitToRoom(roomId, 'room_deleted', { roomId });
    } else {
      // If host left, assign new host
      if (room.hostUserId === userId && room.players.length > 0) {
        room.hostUserId = room.players[0];
      }

      await this.roomsRepository.save(room);

      // Emit user left event
      this.roomsGateway.emitToRoom(roomId, 'user_left', {
        roomId,
        userId,
        players: room.players,
        currentPlayers: room.currentPlayers,
        hostUserId: room.hostUserId,
      });
    }
  }

  async findRoom(roomId: string): Promise<Room> {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async findUserRooms(userId: string): Promise<Room[]> {
    return this.roomsRepository.find({
      where: {
        players: userId as any, // TypeORM JSON array query
      },
    });
  }

  // New method to check if user has access to a room
  async checkUserRoomAccess(userId: string, roomId: string): Promise<boolean> {
    try {
      const room = await this.roomsRepository.findOne({ where: { id: roomId } });
      
      if (!room) {
        return false;
      }
      
      // Check if user is in the room's players array
      return room.players.includes(userId);
    } catch (error) {
      console.error(`Error checking room access: ${error.message}`);
      return false;
    }
  }
}
