/**
 * Diagnoses sign-up / sign-in issues.
 * Run: node scripts/diagnose-auth.mjs
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

console.log('=== Auth Diagnosis ===\n');

// 1. Test sign-up with a dummy account
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'TestPassword123!';

console.log(`1. Attempting sign-up with ${testEmail}...`);
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: testEmail,
  password: testPassword,
});

if (signUpError) {
  console.log(`   ❌ Sign-up failed: ${signUpError.message}`);
} else {
  console.log(`   ✅ Sign-up returned user: ${!!signUpData.user}`);
  console.log(`   📧 Session returned: ${!!signUpData.session}`);
  
  if (!signUpData.session) {
    console.log('\n   ⚠️  NO SESSION after sign-up!');
    console.log('   This means EMAIL CONFIRMATION is ENABLED in your Supabase project.');
    console.log('   The app cannot INSERT into public.users without a session (RLS blocks it).');
    console.log('');
    console.log('   FIX: Go to Supabase Dashboard → Authentication → Providers → Email');
    console.log('         and DISABLE "Confirm email" toggle.');
    console.log('   OR:  Use the database trigger approach (see fix below).');
  } else {
    console.log('   ✅ Session exists — email confirmation is OFF (good for dev)');
    
    // Try inserting into public.users
    console.log('\n2. Attempting INSERT into public.users...');
    const { error: insertError } = await supabase.from('users').insert({
      id: signUpData.user.id,
      email: testEmail,
      profile_completed: false,
    });
    
    if (insertError) {
      console.log(`   ❌ INSERT failed: ${insertError.message}`);
    } else {
      console.log('   ✅ INSERT succeeded');
    }

    // Clean up: delete the test row
    await supabase.from('users').delete().eq('id', signUpData.user.id);
  }

  // Try to clean up auth user (won't work with anon key but that's ok)
  if (signUpData.user) {
    // Can't delete auth users with anon key — that's fine
    console.log('\n   Note: Test user created in auth.users. You can delete it from the Supabase Dashboard.');
  }
}

console.log('\n=== Done ===');
