-- 039: Modelo de tipos de pieza con peso + limpieza de player_status.
--
-- `designs.type` amplía de 3 a 14 valores (ver lib/types/design.ts,
-- DESIGN_TYPES). Sigue siendo texto libre validado en la app, no un enum de
-- Postgres (mismo patrón que la migración 034) — no requiere backfill.
--
-- `player_status` se elimina: solo 13 de 761 filas (1.7%) lo usaban en
-- producción (verificado 2026-07-02). `drop column if exists` porque esa
-- columna no la crea ningún archivo de migración local rastreado (divergencia
-- de tracking ya conocida del proyecto) — sin el guard, un replay desde cero
-- (001→039) fallaría aquí.
--
-- `details` sustituye a player_status como campo libre para lo específico
-- de cada tipo de pieza (rival, club nuevo, selección, motivo de la
-- firma...). Se llama `details` y no `context` para no chocar con el
-- helper getDesignContext() ya existente en lib/types/design.ts, que
-- calcula un subtítulo de visualización distinto. Sin consumidor todavía:
-- lo rellena el flujo de tarjetas (Fase 3) y el asistente IA (Fase 4).
--
-- `profiles.weekly_capacity` es la capacidad semanal de cada diseñador, en
-- unidades de peso (Rápida=1/Media=2/Pesada=4). Arranca en 10 para todos:
-- es la media histórica real redondeada al alza (~9.2 diseños/diseñador/
-- semana en los últimos ~6 meses, todos peso 1 hasta ahora, verificado
-- 2026-07-02). El equipo la ajustará por diseñador cuando la revise; la
-- consume el reparto de carga y el % de Team page (Fase 2).

alter table public.designs drop column if exists player_status;

alter table public.designs add column if not exists details text;
comment on column public.designs.details is
  'Texto libre con el detalle específico del tipo de pieza (rival, club, selección, motivo...). Rellenado a mano o por el asistente IA (Fase 4).';

alter table public.profiles add column if not exists weekly_capacity integer not null default 10;
comment on column public.profiles.weekly_capacity is
  'Capacidad semanal del diseñador, en unidades de peso (Rápida=1/Media=2/Pesada=4). Usada por el reparto de carga y el % de Team page (Fase 2).';
