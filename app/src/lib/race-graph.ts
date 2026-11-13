export const SAMPLE_MS = 100;
export const SAMPLE_START_MS = 1000;

export const sampleTime = (index: number) => (SAMPLE_START_MS + index * SAMPLE_MS) / 1000;

export function niceMax(value: number): number {
  const step = value <= 60 ? 10 : value <= 150 ? 25 : 50;
  return Math.max(step, Math.ceil(value / step) * step);
}
