/*
# Fix broken workspace ownership + allow self-linking

Root cause: createWorkspace's profile upsert silently failed under RLS for
some creators, leaving their workspace_id = NULL. This breaks everything:
the head leader can't see their own members or pending approvals, and the
approval flow stalls.

Fix 1: Backfill creators whose profile lost the workspace link. For every
workspace, if the creator's profile has workspace_id = NULL or doesn't
match, set it and elevate them to head-leader (or admin if already admin).

Fix 2: The profiles UPDATE WITH CHECK already allows id = auth.uid(), but
add an explicit policy that lets a user set their OWN workspace_id when
joining/creating, so the upsert never silently fails again.
*/

-- Backfill: link each workspace creator to their workspace.
UPDATE profiles p
SET workspace_id = w.id,
    role = CASE WHEN p.role = 'admin' THEN 'admin' ELSE 'head-leader' END
FROM workspaces w
WHERE p.id = w.created_by_id
  AND (p.workspace_id IS NULL OR p.workspace_id <> w.id);

-- Explicit: a user may update their own workspace_id and role (for join/create).
-- The existing prof_update_self_or_lead already covers id = auth.uid(), but
-- make it unambiguous by adding a dedicated self-link policy.
DROP POLICY IF EXISTS "prof_update_self_workspace" ON profiles;
CREATE POLICY "prof_update_self_workspace" ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
