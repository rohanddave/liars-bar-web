import { IGame } from './game.interface';
import { Round } from './round';

export class Game implements IGame {
  getCurrentRound(): Round {
    throw new Error('Method not implemented.');
  }
  startNewRound(): Round {
    throw new Error('Method not implemented.');
  }
  endCurrentRound(): void {
    throw new Error('Method not implemented.');
  }
  addPlayer(playerId: string): void {
    throw new Error('Method not implemented.');
  }
  removePlayer(playerId: string): void {
    throw new Error('Method not implemented.');
  }
  getAdminId(): string {
    throw new Error('Method not implemented.');
  }
}
