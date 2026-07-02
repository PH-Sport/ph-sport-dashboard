import { type DesignType, DEFAULT_DESIGN_TYPE } from '@/lib/types/design';

export interface SingleDesignFormData {
  type: DesignType;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  folder_url: string;
  designer_id: string | null;
}

export interface BulkDesignRow {
  id: string;
  type: DesignType;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  designer_id: string | null;
  folder_url: string;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function createEmptyRow(type: DesignType = DEFAULT_DESIGN_TYPE): BulkDesignRow {
  return {
    id: generateId(),
    type,
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined,
    designer_id: null,
    folder_url: '',
  };
}

export function isRowValid(row: BulkDesignRow): boolean {
  if (!row.player.trim() || !row.deadline_at) return false;
  // El partido solo es obligatorio en matchday; el resto de tipos no lo tienen.
  if (row.type === 'matchday') {
    return !!(row.match_home.trim() && row.match_away.trim());
  }
  return true;
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
