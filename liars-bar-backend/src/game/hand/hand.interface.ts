import { Card } from '../card';

export interface IHand {
  getSize(): number;

  getAt(index: number): Card;

  addCard(card: Card): void;

  removeCard(card: Card): void;
}
