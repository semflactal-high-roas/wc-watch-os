import type { AppData, Group, Match, Team } from '../types';

const loadJson = async <T,>(path: string): Promise<T> => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json() as Promise<T>;
};

export const loadAppData = async (): Promise<AppData> => {
  const [teams, groups, matches] = await Promise.all([
    loadJson<Team[]>('/data/teams.json'),
    loadJson<Group[]>('/data/groups.json'),
    loadJson<Match[]>('/data/matches.json'),
  ]);

  return { teams, groups, matches };
};
