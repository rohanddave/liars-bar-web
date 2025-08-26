import { Controller, Post, Param, Body } from '@nestjs/common';
import { RoomsService } from '../service/rooms.service';

@Controller('room')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(@Body() body: any) {
    return '';
  }

  @Post(':id/join')
  joinRoom(@Param('id') id: string, @Body() body: any) {
    return '';
  }
}
