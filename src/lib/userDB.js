import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getUser(username) {
  const { data, error } = await supabase
    .from('webauthn_users')
    .select('*')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function saveUser(user) {
  const { error } = await supabase
    .from('webauthn_users')
    .upsert(user, { onConflict: 'username' });
  if (error) throw error;
}
