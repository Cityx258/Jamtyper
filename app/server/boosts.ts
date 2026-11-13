import type { Race, Racer } from "./room-state";

export const BOOST_GAP = 0.15;
const SHORTCUT_COOLDOWN_MS = 10_000;
const SHORTCUT_WORDS = 2;
const BADGE_MS = 2_500;
const SPOTLIGHT_COOLDOWN_MS = 12_000;
const SPOTLIGHT_MS = 3_000;

const fraction = (race: Race, r: Racer) =>
  r.outcome === "finished" ? 1 : r.position / race.text.length;

function wordsAhead(text: string, from: number, words: number): number | null {
  let at = from;
  for (let i = 0; i < words; i++) {
    const space = text.indexOf(" ", at);
    if (space === -1) return null;
    at = space + 1;
  }
  return at;
}

function shortcut(race: Race, racer: Racer, now: number): boolean {
  if (now - racer.lastBoostAt < SHORTCUT_COOLDOWN_MS) return false;
  const target = wordsAhead(race.text, racer.position, SHORTCUT_WORDS);
  if (target === null || target >= race.text.length) return false;
  racer.bonus += target - racer.position;
  racer.position = target;
  racer.jump = target;
  racer.boost = { kind: "shortcut", until: now + BADGE_MS };
  racer.lastBoostAt = now;
  return true;
}

function spotlight(racer: Racer, now: number): boolean {
  if (racer.bot || now - racer.lastBoostAt < SPOTLIGHT_COOLDOWN_MS) return false;
  racer.boost = { kind: "spotlight", until: now + SPOTLIGHT_MS };
  racer.lastBoostAt = now;
  return true;
}

export function applyBoosts(race: Race, now: number): boolean {
  const racers = [...race.racers.values()];
  const racing = racers.filter((r) => r.outcome === "racing");
  if (racers.length < 2 || racing.length === 0) return false;

  let changed = false;
  for (const r of racers) {
    if (r.boost && r.boost.until <= now) {
      r.boost = null;
      changed = true;
    }
  }

  const leader = Math.max(...racers.map((r) => fraction(race, r)));
  const last = racing.reduce((a, b) => (fraction(race, b) < fraction(race, a) ? b : a));
  if (leader - fraction(race, last) >= BOOST_GAP && shortcut(race, last, now)) {
    changed = true;
  }

  const front = racing.reduce((a, b) => (fraction(race, b) > fraction(race, a) ? b : a));
  const chaser = Math.max(...racers.filter((r) => r !== front).map((r) => fraction(race, r)));
  if (fraction(race, front) - chaser >= BOOST_GAP && spotlight(front, now)) {
    changed = true;
  }
  return changed;
}
