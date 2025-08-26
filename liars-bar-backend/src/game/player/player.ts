import { IPlayer } from './player.interface';

export class Player implements IPlayer {
  constructor(
    private id: string,
    private name: string,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }
}
