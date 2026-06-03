import type { AppConfig, AppData, Group, Match, Team } from '../types';
import { validateAppData } from '../logic/validateData';

const dataPath = (fileName: string) => `${import.meta.env.BASE_URL}data/${fileName}`;

const loadJson = async <T,>(path: string): Promise<T> => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json() as Promise<T>;
};

export const loadAppData = async (): Promise<AppData> => {
  const [teams, groups, matches, config] = await Promise.all([
    loadJson<Team[]>(dataPath('teams.json')),
    loadJson<Group[]>(dataPath('groups.json')),
    loadJson<Match[]>(dataPath('matches.json')),
    loadJson<AppConfig>(dataPath('config.json')),
  ]);

  const data = { teams, groups, matches, config };
  const validationErrors = validateAppData(data);

  if (validationErrors.length > 0) {
    throw new Error(`データエラー: ${validationErrors.join(' / ')}`);
  }

  return data;
};
