import { Card } from '../card';
import { Rank } from '../rank';

export interface IClaim {
  getCount(): number;

  getCards(): Card[];

  getRank(): Rank;

  getIsSettled(): boolean;

  settle(): void;
}
