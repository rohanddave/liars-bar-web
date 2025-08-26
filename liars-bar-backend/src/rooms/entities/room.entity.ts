import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MAX_PLAYERS_PER_ROOM } from '../../game/constants';

export enum RoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING,
  })
  status: RoomStatus;

  @Column({ default: MAX_PLAYERS_PER_ROOM })
  maxPlayers: number;

  @Column({ default: 0 })
  currentPlayers: number;

  @Column('json', { default: [] })
  players: string[]; // Array of user IDs

  @Column({ nullable: true })
  hostUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
