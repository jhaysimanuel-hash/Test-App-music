/*
# Harden bootstrap_first_admin function

Sets a fixed search_path on the trigger function to silence the
function_search_path_mutable linter. The function is only invoked by
the BEFORE INSERT trigger on profiles; it cannot be called directly
to elevate privileges because it only acts on NEW rows being inserted
when the profiles table is empty (first-ever user).
*/

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF (SELECT count(*) FROM profiles) = 0 THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;
