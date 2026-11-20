export const KEY_SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];

export const OFF_KEY_SHIFT = 0.5;

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function nextStep(previous: number | null, random: () => number = Math.random): number {
  if (previous === null) return Math.floor(random() * KEY_SCALE.length);
  const moves = [-2, -1, 1, 2];
  const options = moves.map((m) => previous + m).filter((s) => s >= 0 && s < KEY_SCALE.length);
  return options[Math.floor(random() * options.length)];
}

export function keystrokeMidi(step: number, inKey: boolean, random: () => number = Math.random): number {
  const base = KEY_SCALE[step];
  if (inKey) return base;
  return base + (random() < 0.5 ? -OFF_KEY_SHIFT : OFF_KEY_SHIFT);
}
