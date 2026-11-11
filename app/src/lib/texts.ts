const WORDS = [
  "time", "music", "drum", "beat", "song", "play", "band", "tune", "note",
  "rhythm", "jazz", "guitar", "piano", "voice", "stage", "light", "sound",
  "fast", "slow", "loud", "quiet", "happy", "bright", "night", "day",
  "river", "city", "street", "house", "window", "garden", "summer", "winter",
  "friend", "school", "class", "paper", "pencil", "window", "travel", "train",
  "planet", "ocean", "forest", "mountain", "rocket", "orange", "yellow",
  "purple", "green", "simple", "little", "great", "every", "always", "never",
  "today", "tomorrow", "dance", "jump", "run", "walk", "write", "read",
];

function randomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do globalThis.crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

export function generateText(wordCount = 25): string {
  const words: string[] = [];
  while (words.length < wordCount) {
    const word = WORDS[randomInt(WORDS.length)];
    if (word !== words[words.length - 1]) words.push(word);
  }
  return words.join(" ");
}
