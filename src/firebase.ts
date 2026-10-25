import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    'WorshipFlow Cloud cannot start: Supabase connection details are missing. ' +
    'Open this project in Bolt and republish so the server credentials are bundled into the live site.';
  console.error('[WorshipFlow]', msg, { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey });
  // Surface the problem on the page instead of a blank screen.
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:80px auto;padding:32px;text-align:center;color:#0f172a;">
        <h1 style="font-size:20px;margin:0 0 12px;">WorshipFlow Cloud is not connected</h1>
        <p style="font-size:14px;color:#475569;line-height:1.6;">${msg}</p>
        <p style="font-size:12px;color:#94a3b8;margin-top:24px;">hasUrl=${!!supabaseUrl} · hasKey=${!!supabaseAnonKey}</p>
      </div>`;
  }
  throw new Error(msg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Re-exported under the legacy name so existing imports of { auth, db } keep working.
export const auth = supabase.auth;
export const db = supabase;
