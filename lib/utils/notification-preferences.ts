export type NotificationChannel = 'email' | 'in_app';
export type NotificationEvent =
  | 'assignment'
  | 'statusChanges'
  | 'upcomingDeadlines'
  | 'comments';

export type NotificationChannelPrefs = Record<NotificationEvent, boolean>;

export interface NotificationPreferences {
  email: NotificationChannelPrefs;
  in_app: NotificationChannelPrefs;
}

/** DB shape (snake_case keys, all optional). */
export interface NotificationPreferencesDb {
  email?: {
    assignment?: boolean;
    status_change?: boolean;
    deadline?: boolean;
    comment?: boolean;
  };
  in_app?: {
    assignment?: boolean;
    status_change?: boolean;
    deadline?: boolean;
    comment?: boolean;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: {
    assignment: true,
    statusChanges: true,
    upcomingDeadlines: true,
    comments: true,
  },
  in_app: {
    assignment: true,
    statusChanges: true,
    upcomingDeadlines: true,
    comments: true,
  },
};

/** Convert DB snake_case shape into the camelCase shape used by the UI, defaulting missing keys to true. */
export function dbToUi(db: NotificationPreferencesDb): NotificationPreferences {
  return {
    email: {
      assignment: db.email?.assignment ?? true,
      statusChanges: db.email?.status_change ?? true,
      upcomingDeadlines: db.email?.deadline ?? true,
      comments: db.email?.comment ?? true,
    },
    in_app: {
      assignment: db.in_app?.assignment ?? true,
      statusChanges: db.in_app?.status_change ?? true,
      upcomingDeadlines: db.in_app?.deadline ?? true,
      comments: db.in_app?.comment ?? true,
    },
  };
}

/** Convert UI camelCase shape back to the DB snake_case payload. */
export function uiToDb(ui: NotificationPreferences): NotificationPreferencesDb {
  return {
    email: {
      assignment: ui.email.assignment,
      status_change: ui.email.statusChanges,
      deadline: ui.email.upcomingDeadlines,
      comment: ui.email.comments,
    },
    in_app: {
      assignment: ui.in_app.assignment,
      status_change: ui.in_app.statusChanges,
      deadline: ui.in_app.upcomingDeadlines,
      comment: ui.in_app.comments,
    },
  };
}
