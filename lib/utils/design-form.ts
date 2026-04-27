export type PlayerStatus = 'injured' | 'suspended' | 'doubt' | 'last_minute';

export interface SingleDesignFormData {
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  folder_url: string;
  designer_id: string | null;
  player_status: PlayerStatus | null;
}

export interface BulkDesignRow {
  id: string;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  designer_id: string | null;
  folder_url: string;
  player_status: PlayerStatus | null;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function createEmptyRow(): BulkDesignRow {
  return {
    id: generateId(),
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined,
    designer_id: null,
    folder_url: '',
    player_status: null,
  };
}

export function isRowValid(row: BulkDesignRow): boolean {
  return !!(
    row.player.trim() &&
    row.match_home.trim() &&
    row.match_away.trim() &&
    row.deadline_at
  );
}

export function isRowEmpty(row: BulkDesignRow): boolean {
  return (
    !row.title.trim() &&
    !row.player.trim() &&
    !row.match_home.trim() &&
    !row.match_away.trim() &&
    !row.deadline_at &&
    !row.folder_url.trim()
  );
}

export function isOutsideWeek(
  date: Date | undefined,
  start?: Date,
  end?: Date
): boolean {
  if (!date || !start || !end) return false;
  return date.getTime() < start.getTime() || date.getTime() > end.getTime();
}
