-- 034: Tipos de pieza de diseño.
--
-- Hasta ahora todo diseño era un "matchday" (match_home/match_away obligatorios).
-- El equipo también produce presentaciones, cumpleaños, etc., que no tienen partido.
--
-- Modelo elegido (extensible sin migración de datos): una columna `type` libre,
-- cuyo conjunto válido vive en la app (lib/types/design.ts → DESIGN_TYPES), no en
-- un enum rígido de Postgres. Añadir/quitar un tipo en el futuro = editar esa
-- constante. El partido pasa a ser opcional, con un CHECK que solo exige equipos
-- cuando el tipo es 'matchday'.
--
-- Aplicado y verificado contra producción: 745 filas existentes migradas a
-- 'matchday' (todas tenían partido → el CHECK pasa).

alter table public.designs add column if not exists type text not null default 'matchday';

alter table public.designs alter column match_home drop not null;
alter table public.designs alter column match_away drop not null;

alter table public.designs add constraint designs_matchday_has_match
  check (type <> 'matchday' or (match_home is not null and match_away is not null));
