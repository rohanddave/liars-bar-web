import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from '../service/rooms.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { JoinRoomDto } from '../dto/join-room.dto';

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
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Room ID',
          example: 'room-123'
        },
        message: {
          type: 'string',
          example: 'Room created successfully'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  createRoom(@Body() body: CreateRoomDto) {
    return '';
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
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Successfully joined room'
        },
        roomId: {
          type: 'string',
          example: 'room-123'
        }
      }
    }
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
    status: 403,
    description: 'Invalid room password'
  })
  joinRoom(@Param('id') id: string, @Body() body: JoinRoomDto) {
    return '';
  }
}
