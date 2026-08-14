/**
 * Probes which columns exist in public.users by attempting individual selects.
 * Run: node scripts/describe-users-table.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envText = readFileSync(resolve(root, '.env'), 'utf8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// All columns the app expects
const expectedColumns = [
  'id',
  'email',
  'name',
  'age_range',
  'gender',
  'skin_type',
  'hair_type',
  'skin_concerns',
  'profile_completed',
  'created_at',
];

console.log('--- Checking which columns exist in public.users ---\n');

for (const col of expectedColumns) {
  const { data, error } = await supabase.from('users').select(col).limit(1);
  if (error) {
    console.log(`  ❌  ${col}  →  MISSING  (${error.message.slice(0, 60)})`);
  } else {
    console.log(`  ✅  ${col}  →  EXISTS`);
  }
}

console.log('\n--- Done ---');
