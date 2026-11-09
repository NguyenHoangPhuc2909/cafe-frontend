export type DrinkOptionLevel = 'DEFAULT' | 'LESS' | 'NONE';

export interface DrinkCustomization {
  iceLevel?: DrinkOptionLevel | null;
  sweetnessLevel?: DrinkOptionLevel | null;
}
