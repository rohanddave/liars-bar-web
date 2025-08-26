import { Rank } from '../rank';
import { ICard } from './card.interface';

export class Card implements ICard {
  constructor(private readonly rank: Rank) {}

  getRank(): Rank {
    return this.rank;
  }
}
