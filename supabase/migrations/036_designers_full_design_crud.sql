-- ========================================
-- MIGRATION 036: Designers get full design CRUD (parity with managers)
-- ========================================
-- Product decision (2026-06-18): designers can now create, edit, delete and
-- reassign ANY design, with no role restriction on design operations. The role
-- ADMIN/DESIGNER still exists for everything else (member management, etc.);
-- only the distinction *over designs* disappears.
--
-- This aligns RLS + triggers with the API routes, which drop their ADMIN-only
-- guards in the same change (/api/designs/bulk, /api/designs/[id] PUT+DELETE,
-- /api/designs/[id]/assignee, /api/designs/[id]/status).
--
-- Before (migrations 021 + 026):
--   * INSERT: admin-only.
--   * UPDATE: assigned designer only, and a trigger blocked designer_id changes.
--   * DELETE: admin-only.
-- After:
--   * INSERT / UPDATE / DELETE: any authenticated user.
--   * SELECT stays open to any authenticated user (designs_read_all).
--   * Admin keeps full access (designs_admin_all — now redundant, left untouched).
-- The audit trigger (log_design_audit) keeps recording actor_id = auth.uid()
-- for every create/update/delete, so designer actions remain fully traceable.

-- 1. Replace the designer-own-only UPDATE policy with full authenticated UPDATE.
DROP POLICY IF EXISTS designs_update_designer_safe ON public.designs;
DROP POLICY IF EXISTS designs_update_authenticated ON public.designs;

CREATE POLICY designs_update_authenticated ON public.designs
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Allow any authenticated user to INSERT designs.
DROP POLICY IF EXISTS designs_insert ON public.designs;

CREATE POLICY designs_insert ON public.designs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Allow any authenticated user to DELETE designs.
DROP POLICY IF EXISTS designs_delete_all ON public.designs;

CREATE POLICY designs_delete_all ON public.designs
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 4. Remove the trigger (and its function) that blocked non-admins from
--    reassigning designer_id — reassignment is now allowed for everyone.
DROP TRIGGER IF EXISTS trg_prevent_non_admin_designer_reassignment ON public.designs;
DROP FUNCTION IF EXISTS public.prevent_non_admin_designer_reassignment();
