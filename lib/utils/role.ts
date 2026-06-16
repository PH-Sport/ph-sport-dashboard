export type Role = 'ADMIN' | 'DESIGNER';

/** Etiqueta de cara al usuario. */
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Mánager',
  DESIGNER: 'Diseñador',
};

/** Clases de color por rol — literales completos para que Tailwind las detecte. */
export const ROLE_ACCENT: Record<Role, string> = {
  ADMIN: 'bg-primary/15 text-primary',
  DESIGNER: 'bg-role-designer/15 text-role-designer',
};
