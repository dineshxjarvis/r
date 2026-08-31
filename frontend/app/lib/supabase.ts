/**
 * Supabase client — singleton for the entire frontend.
 * Used for: Auth (login/logout/session), direct table queries via PostgREST.
 *
 * Tables currently in Supabase: mines, inspections, findings (others pending migrations)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'strata_supabase_session',
  },
});

// ── Auth helpers ───────────────────────────────────────────────────────────

export async function supabaseLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function supabaseLogout() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ── Table query helpers ────────────────────────────────────────────────────

/** List mines visible to the current user (RLS-enforced) */
export const minesQuery = () =>
  supabase.from('mines').select('*').order('name');

/** List inspections for a mine */
export const inspectionsQuery = (mineId?: string) => {
  let q = supabase.from('inspections').select('*').order('scheduled_at', { ascending: false });
  if (mineId) q = q.eq('mine_id', mineId);
  return q;
};

/** List findings for a mine */
export const findingsQuery = (mineId?: string) => {
  let q = supabase.from('findings').select('*').order('raised_at', { ascending: false });
  if (mineId) q = q.eq('mine_id', mineId);
  return q;
};
