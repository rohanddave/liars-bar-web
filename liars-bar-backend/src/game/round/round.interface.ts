import { Card } from '../card';
import { IClaim } from '../claim';
import { IPlayer } from '../player';
import { Rank } from '../rank';

export interface IRound {
  getRank(): Rank;

  getLastClaim(): IClaim;

  getCurrentPlayer(): IPlayer;

  getElimitedPlayers(): IPlayer[];

  isRoundOver(): boolean;

  getWinner(): IPlayer | null;

  startRound(): void;

  claim(player: IPlayer, claim: IClaim): void;

  shoot(player: IPlayer): boolean;

  challenge(player: IPlayer, claim: IClaim): boolean;
}
