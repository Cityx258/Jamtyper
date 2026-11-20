import type { BoostKind } from "../src/lib/room-protocol";
import { racerEnd, racerText, type Race, type Racer } from "./room-state";

export const CHECKPOINTS = [0.25, 0.5, 0.75];
export const BEHIND_GAP = 0.25;
export const MAX_BONUSES = 3;
export const BONUS_WORDS = 3;
const KINDS: BoostKind[] = ["shortcut", "extra", "fog"];
const FOG_MS = 4_000;
const BADGE_MS = 3_000;

const fraction = (race: Race, r: Racer) =>
  r.outcome === "finished" ? 1 : r.position / racerEnd(race, r);

export function cutLastWords(text: string, end: number, words: number): number | null {
  let at = end;
  for (let i = 0; i < words; i++) {
    const space = text.lastIndexOf(" ", at - 1);
    if (space <= 0) return null;
    at = space;
  }
  return at;
}

function setEnd(race: Race, racer: Racer, end: number) {
  const base = race.text.length - racer.cut;
  if (end >= base) {
    racer.extra = racer.extra.slice(0, end - base);
  } else {
    racer.extra = "";
    racer.cut = race.text.length - end;
  }
}

function shortcut(race: Race, racer: Racer): boolean {
  const text = racerText(race, racer);
  const end = cutLastWords(text, text.length, BONUS_WORDS);
  if (end === null) return false;
  const nextSpace = text.indexOf(" ", racer.position);
  if (nextSpace === -1 || end <= nextSpace) return false;
  setEnd(race, racer, end);
  return true;
}

function extraWords(race: Race, leader: Racer, rng: () => number): boolean {
  const words = race.text.split(" ").filter(Boolean);
  if (words.length === 0) return false;
  const added = Array.from({ length: BONUS_WORDS }, () => words[Math.floor(rng() * words.length)]);
  leader.extra += ` ${added.join(" ")}`;
  return true;
}

function apply(
  race: Race,
  kind: BoostKind,
  giver: Racer,
  leader: Racer,
  now: number,
  rng: () => number,
): boolean {
  if (kind === "shortcut") {
    if (!shortcut(race, giver)) return false;
    giver.boost = { kind, until: now + BADGE_MS };
    return true;
  }
  if (kind === "extra" && !extraWords(race, leader, rng)) return false;
  leader.boost = { kind, until: now + (kind === "fog" ? FOG_MS : BADGE_MS) };
  return true;
}

export function isBehind(race: Race, racer: Racer, leader: number, last: Racer): boolean {
  return racer === last || leader - fraction(race, racer) > BEHIND_GAP;
}

export function applyBoosts(race: Race, now: number, rng: () => number = Math.random): boolean {
  let changed = false;
  for (const r of race.racers.values()) {
    if (r.boost && r.boost.until <= now) {
      r.boost = null;
      changed = true;
    }
  }

  const racers = [...race.racers.values()];
  const racing = racers.filter((r) => r.outcome === "racing");
  if (racers.length < 2 || racing.length < 2) return changed;
  const top = Math.max(...racers.map((r) => fraction(race, r)));
  const reached = CHECKPOINTS.filter((c) => top >= c).length;
  if (reached <= race.checkpoints) return changed;
  race.checkpoints = reached;

  const leader = racing.reduce((a, b) => (fraction(race, b) > fraction(race, a) ? b : a));
  const last = racing.reduce((a, b) => (fraction(race, b) < fraction(race, a) ? b : a));
  let leaderHit = false;
  for (const r of racing) {
    if (r === leader || r.bonuses >= MAX_BONUSES || !isBehind(race, r, top, last)) continue;
    const first = Math.floor(rng() * KINDS.length);
    const kinds = leaderHit
      ? (["shortcut"] as const)
      : KINDS.map((_, i) => KINDS[(first + i) % KINDS.length]);
    for (const kind of kinds) {
      if (!apply(race, kind, r, leader, now, rng)) continue;
      r.bonuses++;
      if (kind !== "shortcut") leaderHit = true;
      changed = true;
      break;
    }
  }
  return changed;
}
