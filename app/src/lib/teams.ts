export const TEAMS = [0, 1] as const;
export type Team = (typeof TEAMS)[number];

export const isTeam = (v: unknown): v is Team => v === 0 || v === 1;

export interface TeamScore {
  team: Team;
  wpm: number;
  size: number;
}

export function teamScores(racers: { team: Team | null; wpm: number }[]): TeamScore[] {
  return TEAMS.map((team) => {
    const members = racers.filter((r) => r.team === team);
    const total = members.reduce((sum, r) => sum + r.wpm, 0);
    return {
      team,
      wpm: members.length ? Math.round(total / members.length) : 0,
      size: members.length,
    };
  });
}

export function winningTeam(scores: TeamScore[]): Team | null {
  const [a, b] = scores;
  if (a.wpm === b.wpm) return null;
  return a.wpm > b.wpm ? a.team : b.team;
}

export function teamGaps(sizes: [number, number]): [number, number] {
  const target = Math.max(1, ...sizes);
  return [target - sizes[0], target - sizes[1]];
}
