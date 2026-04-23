-- Aligns designs RLS with what the API endpoints already enforce:
--   * INSERT: admin-only (was "any authenticated user"). /api/designs/bulk already
--     checks ADMIN; this closes the client-side bypass.
--   * DELETE: admin-only (was "DESIGNER or ADMIN"). /api/designs/[id] DELETE already
--     checks ADMIN; this closes the client-side bypass.
-- Preserved:
--   * SELECT for any authenticated user (designs_read_all)
--   * UPDATE for the assigned designer only (designs_update_designer_safe)
--   * Admin bypass for everything (designs_admin_all)
-- The trigger prevent_non_admin_designer_reassignment continues to block a designer
-- from changing the designer_id of a row, even though RLS already permits the update.

DROP POLICY IF EXISTS designs_insert ON public.designs;
DROP POLICY IF EXISTS designs_delete_all ON public.designs;
