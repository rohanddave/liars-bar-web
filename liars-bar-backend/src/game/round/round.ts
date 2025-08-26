import { IClaim } from '../claim';
import { IPlayer } from '../player';
import { Rank } from '../rank';
import { IRound } from './round.interface';

export class Round implements IRound {
  getRank(): Rank {
    throw new Error('Method not implemented.');
  }
  getLastClaim(): IClaim {
    throw new Error('Method not implemented.');
  }
  getCurrentPlayer(): IPlayer {
    throw new Error('Method not implemented.');
  }
  getElimitedPlayers(): IPlayer[] {
    throw new Error('Method not implemented.');
  }
  isRoundOver(): boolean {
    throw new Error('Method not implemented.');
  }
  getWinner(): IPlayer | null {
    throw new Error('Method not implemented.');
  }
  startRound(): void {
    throw new Error('Method not implemented.');
  }
  claim(player: IPlayer, claim: IClaim): void {
    throw new Error('Method not implemented.');
  }
  shoot(player: IPlayer): boolean {
    throw new Error('Method not implemented.');
  }
  challenge(player: IPlayer, claim: IClaim): boolean {
    throw new Error('Method not implemented.');
  }
}
