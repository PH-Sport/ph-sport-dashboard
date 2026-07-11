import { describe, it, expect } from 'vitest';
import {
  dbToUi,
  uiToDb,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './notification-preferences';

describe('notification-preferences push channel', () => {
  it('defaults push a true en los 3 eventos', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.push).toEqual({
      assignment: true,
      statusChanges: true,
      upcomingDeadlines: true,
    });
  });

  it('dbToUi rellena push ausente a true (retrocompatible)', () => {
    const ui = dbToUi({ email: {}, in_app: {} });
    expect(ui.push).toEqual({
      assignment: true,
      statusChanges: true,
      upcomingDeadlines: true,
    });
  });

  it('dbToUi lee push desde snake_case', () => {
    const ui = dbToUi({
      push: { assignment: false, status_change: true, deadline: false },
    });
    expect(ui.push).toEqual({
      assignment: false,
      statusChanges: true,
      upcomingDeadlines: false,
    });
  });

  it('uiToDb serializa push a snake_case', () => {
    const db = uiToDb(DEFAULT_NOTIFICATION_PREFERENCES);
    expect(db.push).toEqual({
      assignment: true,
      status_change: true,
      deadline: true,
    });
  });

  it('round-trip preserva push', () => {
    const start = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      push: { assignment: false, statusChanges: false, upcomingDeadlines: true },
    };
    expect(dbToUi(uiToDb(start))).toEqual(start);
  });
});
