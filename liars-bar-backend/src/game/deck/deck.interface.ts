import { Card } from '../card';

export interface IDeck {
  drawRandomCard(): Card;

  drawNRandomCards(n: number): Card[];
}
