import type { BotLevel, RaceSettings } from "./race-settings";
import { teamGaps, type Team } from "./teams";

export const MIN_RACERS = 2;

export interface PlannedBot {
  team: Team | null;
  level: BotLevel;
}

export function botPlan(
  sizes: [number, number],
  settings: Pick<RaceSettings, "bots" | "botLevels" | "botLevel" | "teams">,
): PlannedBot[] {
  const humans = sizes[0] + sizes[1];
  if (humans === 0) return [];
  const chosen = settings.botLevels.length;
  const level = (i: number) => (i < chosen ? settings.botLevels[i] : settings.botLevel);
  if (!settings.teams) {
    const count = settings.bots ? Math.max(MIN_RACERS - humans, chosen) : chosen;
    return Array.from({ length: count }, (_, i) => ({ team: null, level: level(i) }));
  }
  const gaps = settings.bots ? teamGaps(sizes) : [0, 0];
  const teams: Team[] = [...Array<Team>(gaps[0]).fill(0), ...Array<Team>(gaps[1]).fill(1)];
  const filled = [sizes[0] + gaps[0], sizes[1] + gaps[1]];
  while (teams.length < chosen) {
    const team: Team = filled[0] <= filled[1] ? 0 : 1;
    teams.push(team);
    filled[team]++;
  }
  return teams.map((team, i) => ({ team, level: level(i) }));
}
