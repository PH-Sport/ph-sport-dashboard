import { z } from 'zod';

const PLAYER_STATUS_VALUES = ['injured', 'suspended', 'doubt', 'last_minute'] as const;
const DESIGN_STATUS_VALUES = ['BACKLOG', 'DELIVERED'] as const;

const isoDateTime = z.string().refine(
  (v) => !Number.isNaN(Date.parse(v)),
  { message: 'Fecha inválida (se espera ISO 8601)' }
);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Fecha inválida (se espera YYYY-MM-DD)',
});

const uuid = z.string().uuid({ message: 'UUID inválido' });

/** GET /api/designs?weekStart=...&weekEnd=...&status=...&designerId=... */
export const weekFiltersSchema = z.object({
  weekStart: isoDate,
  weekEnd: isoDate,
  status: z.enum(DESIGN_STATUS_VALUES).optional(),
  designerId: uuid.optional(),
});
export type WeekFiltersInput = z.infer<typeof weekFiltersSchema>;

/** POST /api/designs/bulk — input por diseño dentro del array */
const bulkDesignItemSchema = z.object({
  title: z.string().trim().max(200).optional(),
  player: z.string().trim().min(1, 'player requerido').max(100),
  match_home: z.string().trim().min(1, 'match_home requerido').max(100),
  match_away: z.string().trim().min(1, 'match_away requerido').max(100),
  deadline_at: isoDateTime,
  designer_id: z.union([uuid, z.literal('auto')]).nullish(),
  player_status: z.enum(PLAYER_STATUS_VALUES).nullish(),
  folder_url: z.string().url().max(2000).optional().or(z.literal('')),
});

export const bulkCreateDesignsSchema = z.object({
  designs: z.array(bulkDesignItemSchema).min(1, 'Debe incluir al menos un diseño').max(100),
});
export type BulkCreateDesignsInput = z.infer<typeof bulkCreateDesignsSchema>;

/** PUT /api/designs/:id — whitelist explícita de campos modificables */
export const updateDesignSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    player: z.string().trim().min(1).max(100).optional(),
    match_home: z.string().trim().min(1).max(100).optional(),
    match_away: z.string().trim().min(1).max(100).optional(),
    deadline_at: isoDateTime.optional(),
    folder_url: z.string().url().max(2000).nullable().optional(),
    player_status: z.enum(PLAYER_STATUS_VALUES).nullable().optional(),
    designer_id: z.union([uuid, z.literal('auto')]).nullable().optional(),
  })
  .strict();
export type UpdateDesignInput = z.infer<typeof updateDesignSchema>;

/** PATCH /api/designs/:id/status */
export const updateStatusSchema = z
  .object({
    status: z.enum(DESIGN_STATUS_VALUES),
  })
  .strict();
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

/** PATCH /api/designs/:id/assignee */
export const updateAssigneeSchema = z
  .object({
    designer_id: z.union([uuid, z.literal('auto')]).nullable(),
  })
  .strict();
export type UpdateAssigneeInput = z.infer<typeof updateAssigneeSchema>;
