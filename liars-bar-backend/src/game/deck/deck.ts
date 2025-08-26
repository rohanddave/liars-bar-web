import { Card } from '../card';
import { IDeck } from './deck.interface';

export class Deck implements IDeck {
  drawRandomCard(): Card {
    throw new Error('Method not implemented.');
  }
  drawNRandomCards(n: number): Card[] {
    throw new Error('Method not implemented.');
  }
}
