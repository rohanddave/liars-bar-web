import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsController } from './controller/rooms.controller';
import { RoomsService } from './service/rooms.service';
import { RoomsGateway } from './gateway/rooms.gateway';
import { Room } from './entities/room.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), AuthModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
  exports: [RoomsService, RoomsGateway],
})
export class RoomsModule {}
