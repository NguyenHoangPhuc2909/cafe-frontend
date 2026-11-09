import type { DrinkCustomization, DrinkOptionLevel } from '../types/drinkOptions.ts';

export function isDrinkOptionLevel(value: unknown): value is DrinkOptionLevel | null | undefined {
  return value == null || value === 'DEFAULT' || value === 'LESS' || value === 'NONE';
}

export function normalizeDrinkOptions(value: DrinkCustomization): DrinkCustomization {
  return {
    ...(value.iceLevel && value.iceLevel !== 'DEFAULT' ? { iceLevel: value.iceLevel } : {}),
    ...(value.sweetnessLevel && value.sweetnessLevel !== 'DEFAULT' ? { sweetnessLevel: value.sweetnessLevel } : {}),
  };
}

export function drinkOptionsKey(value: DrinkCustomization) {
  const options = normalizeDrinkOptions(value);
  return `${options.iceLevel ? `:ice=${options.iceLevel}` : ''}${options.sweetnessLevel ? `:sweetness=${options.sweetnessLevel}` : ''}`;
}

export function formatDrinkOptions(value: DrinkCustomization) {
  return [value.iceLevel === 'LESS' ? 'Ít đá' : value.iceLevel === 'NONE' ? 'Không đá' : '',
    value.sweetnessLevel === 'LESS' ? 'Ít ngọt' : value.sweetnessLevel === 'NONE' ? 'Không đường' : ''].filter(Boolean).join(' · ');
}
