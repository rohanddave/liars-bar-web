import { Card } from '../card';
import { IHand } from './hand.interface';

export class Hand implements IHand {
  getSize(): number {
    throw new Error('Method not implemented.');
  }

  getAt(index: number): Card {
    throw new Error('Method not implemented.');
  }

  addCard(card): void {
    throw new Error('Method not implemented.');
  }

  removeCard(card: Card): void {
    throw new Error('Method not implemented.');
  }
}
