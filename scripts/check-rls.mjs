/**
 * Checks RLS policy behavior on public.users
 * Run: node scripts/check-rls.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');

function loadEnv() {
  const vars = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return vars;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

console.log('--- RLS policy check (anon / not logged in) ---\n');

// Anonymous SELECT — should return empty (RLS on) or error, NOT other users' rows
const { data: selectData, error: selectError } = await supabase
  .from('users')
  .select('id, name')
  .limit(5);

if (selectError) {
  console.log('SELECT (anon): blocked or error →', selectError.message);
} else if (!selectData?.length) {
  console.log('SELECT (anon): returned 0 rows → RLS likely ON (good)');
} else {
  console.log('SELECT (anon): returned', selectData.length, 'row(s) → RLS may be OFF or too permissive');
}

// Anonymous INSERT — should always fail
const { error: insertError } = await supabase.from('users').insert({
  id: '00000000-0000-0000-0000-000000000000',
  profile_completed: false,
});

if (insertError) {
  console.log('INSERT (anon): blocked →', insertError.message.slice(0, 80));
} else {
  console.log('INSERT (anon): succeeded → RLS is NOT protecting inserts (bad)');
}

// Anonymous UPDATE — should always fail
const { data: updateData, error: updateError } = await supabase
  .from('users')
  .update({ name: 'rls-test' })
  .eq('id', '00000000-0000-0000-0000-000000000000')
  .select();

if (updateError) {
  console.log('UPDATE (anon): blocked →', updateError.message.slice(0, 80));
} else if (!updateData?.length) {
  console.log('UPDATE (anon): 0 rows matched → cannot determine RLS status (no test row exists)');
} else {
  console.log('UPDATE (anon): succeeded → RLS is NOT protecting updates (bad)');
}

console.log('\nIf INSERT/UPDATE are blocked for anon users, run supabase/fix_users_table.sql');
console.log('in Supabase Dashboard → SQL Editor to add the email column and enable RLS policies.');
