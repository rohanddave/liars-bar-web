import { IRevolver } from './revolver.interface';

export class Revolver implements IRevolver {
  shoot(): boolean {
    throw new Error('Method not implemented.');
  }
  reset(): void {
    throw new Error('Method not implemented.');
  }
  getCurrentPosition(): number {
    throw new Error('Method not implemented.');
  }
}
