import { SAMPLE_MS, SAMPLE_START_MS } from "../src/lib/race-graph";
import { racerWpm, type Race, type Racer } from "./room-state";

export function sampleRacer(race: Race, racer: Racer, now: number) {
  const slot = Math.floor((now - race.startsAt - SAMPLE_START_MS) / SAMPLE_MS);
  if (slot < 0) return;
  const wpm = Math.round(racerWpm(race, racer, now));
  while (racer.samples.length <= slot) racer.samples.push(wpm);
  racer.samples[slot] = wpm;
}

export function sampleRace(race: Race, now: number) {
  for (const racer of race.racers.values()) {
    if (racer.outcome === "racing") sampleRacer(race, racer, now);
  }
}
