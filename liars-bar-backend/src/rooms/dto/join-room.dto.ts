import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinRoomDto {
  @ApiProperty({
    description: 'Password for the room',
    example: 'secretPassword123'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
