/*
# WorshipFlow Cloud - Supabase schema (v1)

Migrates the worship team app from Firebase/Firestore to Supabase.
Adds email/password authentication (handled by Supabase Auth) and a
multi-tenant workspace model with row-level security.
*/

CREATE TABLE IF NOT EXISTS workspaces (
  id text PRIMARY KEY,
  name text NOT NULL,
  church_name text NOT NULL,
  passcode text NOT NULL,
  created_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  church_banner_url text,
  church_logo_text text,
  church_logo_url text
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','head-leader','leader','editor','viewer')),
  workspace_id text REFERENCES workspaces(id) ON DELETE SET NULL,
  avatar_url text,
  instrument text
);

CREATE TABLE IF NOT EXISTS songs (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text NOT NULL DEFAULT '',
  default_key text NOT NULL DEFAULT '',
  tempo integer,
  time_signature text,
  categories text[] NOT NULL DEFAULT '{}',
  lyrics_with_chords text NOT NULL DEFAULT '',
  ccli text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS setlists (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  date text NOT NULL DEFAULT '',
  time text,
  leader_id uuid,
  leader_name text NOT NULL DEFAULT '',
  theme text,
  notes text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pending_members (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projector_settings (
  workspace_id text PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  sender_role text NOT NULL DEFAULT 'viewer',
  content text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  is_pinned boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ui_color text NOT NULL DEFAULT 'red',
  user_font text NOT NULL DEFAULT 'Outfit',
  home_bg_url text,
  avatar_url text
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id text PRIMARY KEY,
  workspace_id text REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_sessions (
  workspace_id text PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by text NOT NULL DEFAULT '',
  updated_at bigint NOT NULL DEFAULT 0
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projector_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ws_select_member" ON workspaces;
CREATE POLICY "ws_select_member" ON workspaces FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = workspaces.id))
  );

DROP POLICY IF EXISTS "ws_insert_member" ON workspaces;
CREATE POLICY "ws_insert_member" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ws_update_member" ON workspaces;
CREATE POLICY "ws_update_member" ON workspaces FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = workspaces.id AND p.role IN ('admin','head-leader'))))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = workspaces.id AND p.role IN ('admin','head-leader'))))
  );

DROP POLICY IF EXISTS "ws_delete_admin" ON workspaces;
CREATE POLICY "ws_delete_admin" ON workspaces FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "prof_select" ON profiles;
CREATE POLICY "prof_select" ON profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = profiles.workspace_id))
  );

DROP POLICY IF EXISTS "prof_insert_self" ON profiles;
CREATE POLICY "prof_insert_self" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "prof_update_self_or_lead" ON profiles;
CREATE POLICY "prof_update_self_or_lead" ON profiles FOR UPDATE
  TO authenticated USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = profiles.workspace_id AND p.role IN ('admin','head-leader'))))
  ) WITH CHECK (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = profiles.workspace_id AND p.role IN ('admin','head-leader'))))
  );

DROP POLICY IF EXISTS "prof_delete_admin" ON profiles;
CREATE POLICY "prof_delete_admin" ON profiles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = profiles.workspace_id AND p.role IN ('admin','head-leader'))))
  );

DROP POLICY IF EXISTS "songs_select" ON songs;
CREATE POLICY "songs_select" ON songs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = songs.workspace_id))
  );

DROP POLICY IF EXISTS "songs_write" ON songs;
CREATE POLICY "songs_write" ON songs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = songs.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  );

DROP POLICY IF EXISTS "songs_update" ON songs;
CREATE POLICY "songs_update" ON songs FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = songs.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = songs.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  );

DROP POLICY IF EXISTS "songs_delete" ON songs;
CREATE POLICY "songs_delete" ON songs FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = songs.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  );

DROP POLICY IF EXISTS "setlists_select" ON setlists;
CREATE POLICY "setlists_select" ON setlists FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = setlists.workspace_id))
  );

DROP POLICY IF EXISTS "setlists_insert" ON setlists;
CREATE POLICY "setlists_insert" ON setlists FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = setlists.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  );

DROP POLICY IF EXISTS "setlists_update" ON setlists;
CREATE POLICY "setlists_update" ON setlists FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = setlists.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = setlists.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  );

DROP POLICY IF EXISTS "setlists_delete" ON setlists;
CREATE POLICY "setlists_delete" ON setlists FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = setlists.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  );

DROP POLICY IF EXISTS "pending_select" ON pending_members;
CREATE POLICY "pending_select" ON pending_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = pending_members.workspace_id))
  );

DROP POLICY IF EXISTS "pending_insert" ON pending_members;
CREATE POLICY "pending_insert" ON pending_members FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "pending_delete" ON pending_members;
CREATE POLICY "pending_delete" ON pending_members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = pending_members.workspace_id AND p.role IN ('admin','head-leader'))))
  );

DROP POLICY IF EXISTS "proj_select" ON projector_settings;
CREATE POLICY "proj_select" ON projector_settings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = projector_settings.workspace_id))
  );

DROP POLICY IF EXISTS "proj_upsert" ON projector_settings;
CREATE POLICY "proj_upsert" ON projector_settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = projector_settings.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  );

DROP POLICY IF EXISTS "proj_update" ON projector_settings;
CREATE POLICY "proj_update" ON projector_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = projector_settings.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = projector_settings.workspace_id AND p.role IN ('admin','head-leader','leader','editor'))))
  );

DROP POLICY IF EXISTS "chat_select" ON chat_messages;
CREATE POLICY "chat_select" ON chat_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = chat_messages.workspace_id))
  );

DROP POLICY IF EXISTS "chat_insert" ON chat_messages;
CREATE POLICY "chat_insert" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = chat_messages.workspace_id))
  );

DROP POLICY IF EXISTS "chat_delete" ON chat_messages;
CREATE POLICY "chat_delete" ON chat_messages FOR DELETE
  TO authenticated USING (
    sender_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.workspace_id = chat_messages.workspace_id AND p.role IN ('admin','head-leader','leader'))))
  );

DROP POLICY IF EXISTS "prefs_select" ON user_preferences;
CREATE POLICY "prefs_select" ON user_preferences FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "prefs_insert" ON user_preferences;
CREATE POLICY "prefs_insert" ON user_preferences FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "prefs_update" ON user_preferences;
CREATE POLICY "prefs_update" ON user_preferences FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "prefs_delete" ON user_preferences;
CREATE POLICY "prefs_delete" ON user_preferences FOR DELETE
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "gallery_select" ON gallery_images;
CREATE POLICY "gallery_select" ON gallery_images FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = gallery_images.workspace_id))
  );

DROP POLICY IF EXISTS "gallery_insert" ON gallery_images;
CREATE POLICY "gallery_insert" ON gallery_images FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = gallery_images.workspace_id))
  );

DROP POLICY IF EXISTS "gallery_delete" ON gallery_images;
CREATE POLICY "gallery_delete" ON gallery_images FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "live_select" ON live_sessions;
CREATE POLICY "live_select" ON live_sessions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = live_sessions.workspace_id))
  );

DROP POLICY IF EXISTS "live_upsert" ON live_sessions;
CREATE POLICY "live_upsert" ON live_sessions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = live_sessions.workspace_id))
  );

DROP POLICY IF EXISTS "live_update" ON live_sessions;
CREATE POLICY "live_update" ON live_sessions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = live_sessions.workspace_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.workspace_id = live_sessions.workspace_id))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON songs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON setlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pending_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON projector_settings TO authenticated;
GRANT SELECT, INSERT, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO authenticated;
GRANT SELECT, INSERT, DELETE ON gallery_images TO authenticated;
GRANT SELECT, INSERT, UPDATE ON live_sessions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_songs_workspace ON songs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_setlists_workspace ON setlists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chat_workspace ON chat_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pending_workspace ON pending_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT count(*) FROM profiles) = 0 THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bootstrap_first_admin ON profiles;
CREATE TRIGGER trg_bootstrap_first_admin
BEFORE INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;
