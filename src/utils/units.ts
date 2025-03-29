export type LengthUnit = 'mm' | 'cm' | 'm' | 'in';
export type WeightUnit = 'g' | 'kg' | 'lbs';
export type CurrencyCode = string;

export const lengthConversions: Record<LengthUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4 // 1 inch = 25.4mm
};

export const weightConversions: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  lbs: 453.592
};

export const convertLength = (value: number, from: LengthUnit, to: LengthUnit): number => {
  const inMm = value * lengthConversions[from];
  return inMm / lengthConversions[to];
};

export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
  const inGrams = value * weightConversions[from];
  return inGrams / weightConversions[to];
};

export const formatMeasurement = (value: number, unit: LengthUnit | WeightUnit): string => {
  return `${value.toFixed(2)} ${unit}`;
};