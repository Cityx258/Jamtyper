import { randomInt } from "node:crypto";
import { CODE_ALPHABET, CODE_LENGTH } from "../src/lib/room-code";

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}
