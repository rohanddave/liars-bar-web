import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from '../service/rooms.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { JoinRoomDto } from '../dto/join-room.dto';
import { GetCurrentUser, CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Room } from '../entities/room.entity';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('room')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new room',
    description: 'Create a new game room with a password (requires authentication)'
  })
  @ApiBody({
    type: CreateRoomDto,
    description: 'Room creation data with password'
  })
  @ApiResponse({
    status: 201,
    description: 'Room created successfully',
    type: Room
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  async createRoom(
    @Body() createRoomDto: CreateRoomDto,
    @GetCurrentUser() currentUser: CurrentUser,
  ): Promise<Room> {
    return this.roomsService.createRoom(createRoomDto, currentUser.userId);
  }

  @Post(':id/join')
  @ApiOperation({
    summary: 'Join room',
    description: 'Join an existing room with the room ID and password (requires authentication)'
  })
  @ApiParam({
    name: 'id',
    description: 'Room ID',
    type: 'string',
    example: 'room-123'
  })
  @ApiBody({
    type: JoinRoomDto,
    description: 'Room join data with password'
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully joined room',
    type: Room
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid room password or room full'
  })
  @ApiResponse({
    status: 409,
    description: 'User already in room'
  })
  async joinRoom(
    @Param('id') roomId: string,
    @Body() joinRoomDto: JoinRoomDto,
    @GetCurrentUser() currentUser: CurrentUser,
  ): Promise<Room> {
    return this.roomsService.joinRoom(roomId, joinRoomDto, currentUser.userId);
  }

  @Get('my-rooms')
  @ApiOperation({
    summary: 'Get user rooms',
    description: 'Get all rooms the authenticated user is currently in'
  })
  @ApiResponse({
    status: 200,
    description: 'List of user rooms',
    type: [Room]
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  async getUserRooms(@GetCurrentUser() currentUser: CurrentUser): Promise<Room[]> {
    return this.roomsService.findUserRooms(currentUser.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get room details',
    description: 'Get details of a specific room'
  })
  @ApiParam({
    name: 'id',
    description: 'Room ID',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Room details',
    type: Room
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  async getRoomDetails(@Param('id') roomId: string): Promise<Room> {
    return this.roomsService.findRoom(roomId);
  }
}
