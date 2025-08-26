import { Card } from '../card';
import { Rank } from '../rank';
import { IClaim } from './claim.interface';

export class Claim implements IClaim {
  getCount(): number {
    throw new Error('Method not implemented.');
  }
  getCards(): Card[] {
    throw new Error('Method not implemented.');
  }
  getRank(): Rank {
    throw new Error('Method not implemented.');
  }
  getIsSettled(): boolean {
    throw new Error('Method not implemented.');
  }
  settle(): void {
    throw new Error('Method not implemented.');
  }
}
