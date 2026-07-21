/**
 * Quick Supabase connectivity check.
 * Run: node scripts/check-supabase.mjs
 *
 * Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('FAIL: .env file not found');
    process.exit(1);
  }

  const vars = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    vars[key] = value;
  }
  return vars;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log('--- Supabase connection check ---\n');

if (!url) {
  console.error('FAIL: VITE_SUPABASE_URL is missing in .env');
  process.exit(1);
}
if (!key) {
  console.error('FAIL: VITE_SUPABASE_ANON_KEY is missing in .env');
  process.exit(1);
}

console.log('OK:  VITE_SUPABASE_URL is set');
console.log('OK:  VITE_SUPABASE_ANON_KEY is set');
console.log(`     Project URL: ${url.replace(/^(https:\/\/[^.]+).*/, '$1...')}\n`);

const supabase = createClient(url, key);

// 1. Can we reach Supabase Auth?
const { error: authError } = await supabase.auth.getSession();
if (authError) {
  console.error('FAIL: Auth endpoint unreachable:', authError.message);
  process.exit(1);
}
console.log('OK:  Auth endpoint reachable');

// 2. Does the users table exist and respond?
const { error: tableError } = await supabase.from('users').select('id').limit(1);
if (tableError) {
  console.error('FAIL: users table query failed:', tableError.message);
  if (tableError.message.includes('does not exist')) {
    console.error('     → Create the users table in Supabase first.');
  }
  if (tableError.code === '42501' || tableError.message.toLowerCase().includes('policy')) {
    console.error('     → Table exists but RLS may be blocking anonymous reads (expected).');
    console.error('     → Run supabase/rls_users.sql in the SQL Editor.');
  }
  process.exit(1);
}
console.log('OK:  users table exists and is queryable');

console.log('\n--- All checks passed ---');
