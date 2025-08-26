import { Controller, Post, Param, Body } from '@nestjs/common';
import { RoomsService } from '../service/rooms.service';
import { CreateRoomDto } from '../dto/create-room.dto';

@Controller('room')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(@Body() body: CreateRoomDto) {
    return '';
  }

  @Post(':id/join')
  joinRoom(@Param('id') id: string, @Body() body: any) {
    return '';
  }
}
