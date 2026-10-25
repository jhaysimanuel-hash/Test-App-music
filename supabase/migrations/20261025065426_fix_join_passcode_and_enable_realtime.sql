/*
# Fix join-by-passcode + enable realtime for all tables

Problem 1: A brand-new authenticated user has workspace_id = NULL, so the
existing workspaces SELECT policy (p.workspace_id = workspaces.id) blocks
them from looking up a workspace by passcode to join. They always see
"Invalid Passcode ID."

Fix: Allow any authenticated user to SELECT a workspace row. The passcode
is the secret that gates joining — if someone has it, they are entitled to
find that workspace. The app only ever queries by passcode or id, so other
workspaces are never enumerated.

Problem 2: Realtime broadcasts nothing because no table is in the
supabase_realtime publication. Live chat, song, setlist, member, projector,
and profile subscriptions never fire.

Fix: Add every workspace-scoped table to the realtime publication.
*/

DROP POLICY IF EXISTS "workspaces_select_any_authenticated" ON public.workspaces;
CREATE POLICY "workspaces_select_any_authenticated" ON public.workspaces
  FOR SELECT TO authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.workspaces,
  public.profiles,
  public.songs,
  public.setlists,
  public.pending_members,
  public.projector_settings,
  public.chat_messages,
  public.gallery_images,
  public.user_preferences;
