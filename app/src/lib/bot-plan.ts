import type { RaceSettings } from "./race-settings";
import { teamGaps, type Team } from "./teams";

export const MIN_RACERS = 2;

export function botPlan(
  sizes: [number, number],
  settings: Pick<RaceSettings, "bots" | "botCount" | "teams">,
): (Team | null)[] {
  const humans = sizes[0] + sizes[1];
  if (!settings.bots || humans === 0) return [];
  if (!settings.teams) {
    return Array(Math.max(MIN_RACERS - humans, settings.botCount, 0)).fill(null);
  }
  const gaps = teamGaps(sizes);
  const plan: Team[] = [...Array<Team>(gaps[0]).fill(0), ...Array<Team>(gaps[1]).fill(1)];
  const filled = [sizes[0] + gaps[0], sizes[1] + gaps[1]];
  while (plan.length < settings.botCount) {
    const team: Team = filled[0] <= filled[1] ? 0 : 1;
    plan.push(team);
    filled[team]++;
  }
  return plan;
}
