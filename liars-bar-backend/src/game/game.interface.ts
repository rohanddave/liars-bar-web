import { Round } from './round';

export interface IGame {
  getCurrentRound(): Round;

  startNewRound(): Round;

  endCurrentRound(): void;

  addPlayer(playerId: string): void;

  removePlayer(playerId: string): void;

  getAdminId(): string;
}
