import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Try selecting all columns
const { data, error } = await supabase.from('users').select('*').limit(1);

if (error) {
  console.log('Query error:', error.message, error.code, error.details);
} else {
  console.log('Sample row keys:', data?.[0] ? Object.keys(data[0]) : '(no rows yet)');
  console.log('Row count returned:', data?.length ?? 0);
}
