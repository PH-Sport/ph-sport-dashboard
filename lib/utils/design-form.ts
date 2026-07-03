export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function isOutsideWeek(
  date: Date | undefined,
  start?: Date,
  end?: Date
): boolean {
  if (!date || !start || !end) return false;
  return date.getTime() < start.getTime() || date.getTime() > end.getTime();
}
