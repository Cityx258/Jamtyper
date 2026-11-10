import { randomInt } from "node:crypto";

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

export function generateText(wordCount = 25): string {
  const words: string[] = [];
  while (words.length < wordCount) {
    const word = WORDS[randomInt(WORDS.length)];
    if (word !== words[words.length - 1]) words.push(word);
  }
  return words.join(" ");
}
