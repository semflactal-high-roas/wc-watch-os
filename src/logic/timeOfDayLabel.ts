type TimeOfDayBucket = 'late_night' | 'morning' | 'forenoon' | 'daytime' | 'night' | 'pre_late_night';

const parseKickoffHour = (kickoffTimeJST: string): number | null => {
  const match = kickoffTimeJST.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return hour;
};

const getBucket = (kickoffTimeJST: string): TimeOfDayBucket | null => {
  const hour = parseKickoffHour(kickoffTimeJST);
  if (hour === null) return null;

  if (hour <= 3) return 'late_night';
  if (hour <= 6) return 'morning';
  if (hour <= 10) return 'forenoon';
  if (hour <= 16) return 'daytime';
  if (hour <= 20) return 'night';
  return 'pre_late_night';
};

export const getJstTimeOfDayLabel = (kickoffTimeJST: string): string => {
  const bucket = getBucket(kickoffTimeJST);

  switch (bucket) {
    case 'late_night':
      return '深夜';
    case 'morning':
      return '朝';
    case 'forenoon':
      return '午前';
    case 'daytime':
      return '昼';
    case 'night':
      return '夜';
    case 'pre_late_night':
      return '深夜手前';
    default:
      return '';
  }
};

export const getJstViewingHint = (kickoffTimeJST: string): string => {
  const bucket = getBucket(kickoffTimeJST);

  switch (bucket) {
    case 'late_night':
      return 'リアタイするなら睡眠コスト高め';
    case 'morning':
      return '出勤・通学前に見やすい時間帯';
    case 'forenoon':
      return '日中前に追いやすい時間帯';
    case 'daytime':
      return '昼休みや移動中に追いやすい時間帯';
    case 'night':
      return 'リアタイしやすい時間帯';
    case 'pre_late_night':
      return '翌日に響きにくい範囲で見やすい時間帯';
    default:
      return '';
  }
};

export const formatKickoffWithTimeOfDay = (kickoffTimeJST: string): string => {
  const label = getJstTimeOfDayLabel(kickoffTimeJST);
  const hour = parseKickoffHour(kickoffTimeJST);
  if (!label || hour === null) return `${kickoffTimeJST} 日本時間`;

  return `${label}${hour}:00キックオフ`;
};
