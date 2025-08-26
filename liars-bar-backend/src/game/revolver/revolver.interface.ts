export interface IRevolver {
  shoot(): boolean;

  reset(): void;

  getCurrentPosition(): number;
}
