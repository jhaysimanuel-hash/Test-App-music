/*
# Auto-create profile on signup

Adds a trigger that creates a `profiles` row for every new auth user, so no one
ever gets stuck without a profile after signing up. The row starts as 'viewer'
with no workspace; the user joins or creates a workspace afterward.

Also backfills a profile row for any existing auth user who is missing one
(includes the developer admin so admin access is never lost).
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role, workspace_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'viewer',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

-- Backfill missing profiles for existing auth users.
INSERT INTO profiles (id, name, email, role, workspace_id)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  'viewer',
  NULL
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
