/**
 * Full end-to-end auth test: signup → check user row → signin → cleanup
 * Run: node scripts/test-auth-flow.mjs
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

const testEmail = `skintel-test-${Date.now()}@example.com`;
const testPass = 'Test123456!';
let testUserId = null;

console.log('=== Full Auth Flow Test ===\n');

// ─── Step 1: Sign Up ─────────────────────────────────────────────────────
console.log(`1. SIGN UP with ${testEmail}`);
const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
  email: testEmail,
  password: testPass,
});

if (signUpErr) {
  console.log(`   ❌ signUp error: ${signUpErr.message}`);
  console.log('   If "email rate limit exceeded", wait a few minutes or use Supabase Dashboard to delete test users from Authentication → Users');
  process.exit(1);
}

console.log(`   user returned:    ${!!signUpData.user}`);
console.log(`   user.id:          ${signUpData.user?.id ?? 'none'}`);
console.log(`   session returned: ${!!signUpData.session}`);
testUserId = signUpData.user?.id;

if (!signUpData.session) {
  console.log('\n   ⛔ NO SESSION — email confirmation is still ON!');
  console.log('   Go to Supabase Dashboard → Authentication → Providers → Email');
  console.log('   Turn OFF "Confirm email" and Save.\n');
  console.log('   Cannot continue test without a session.');
  process.exit(1);
}

// ─── Step 2: Check if trigger created public.users row ────────────────────
console.log('\n2. CHECK public.users row (should exist via trigger)');
// Small delay to let the trigger fire
await new Promise((r) => setTimeout(r, 1000));

const { data: userRow, error: selectErr } = await supabase
  .from('users')
  .select('*')
  .eq('id', testUserId)
  .maybeSingle();

if (selectErr) {
  console.log(`   ❌ SELECT error: ${selectErr.message}`);
} else if (!userRow) {
  console.log('   ❌ No row found! The trigger did NOT create a row.');
  console.log('   Did you run auto_create_user.sql in the SQL Editor?');
} else {
  console.log('   ✅ Row exists!');
  console.log('   Columns:', JSON.stringify(userRow, null, 2));
}

// ─── Step 3: Test UPDATE (simulating onboarding) ──────────────────────────
console.log('\n3. UPDATE (simulate onboarding submit)');
const { error: updateErr } = await supabase
  .from('users')
  .update({
    name: 'Test User',
    age_range: '25-34',
    gender: 'Female',
    skin_type: 'Combination',
    hair_type: 'Wavy',
    skin_concerns: ['Acne', 'Dryness'],
    profile_completed: true,
  })
  .eq('id', testUserId);

if (updateErr) {
  console.log(`   ❌ UPDATE error: ${updateErr.message}`);
} else {
  console.log('   ✅ UPDATE succeeded');
}

// ─── Step 4: Verify profile_completed ─────────────────────────────────────
console.log('\n4. VERIFY profile_completed');
const { data: verifyRow } = await supabase
  .from('users')
  .select('profile_completed, name')
  .eq('id', testUserId)
  .maybeSingle();

if (verifyRow) {
  console.log(`   profile_completed: ${verifyRow.profile_completed}`);
  console.log(`   name: ${verifyRow.name}`);
  if (verifyRow.profile_completed && verifyRow.name === 'Test User') {
    console.log('   ✅ Full flow works!');
  }
} else {
  console.log('   ❌ Could not verify');
}

// ─── Step 5: Sign Out + Sign In ───────────────────────────────────────────
console.log('\n5. SIGN OUT then SIGN IN');
await supabase.auth.signOut();

const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
  email: testEmail,
  password: testPass,
});

if (signInErr) {
  console.log(`   ❌ signIn error: ${signInErr.message}`);
} else {
  console.log(`   ✅ signIn succeeded, session: ${!!signInData.session}`);
}

// ─── Cleanup ──────────────────────────────────────────────────────────────
console.log('\n6. CLEANUP');
if (testUserId) {
  const { error: delErr } = await supabase.from('users').delete().eq('id', testUserId);
  if (delErr) {
    console.log(`   Note: Could not delete test row (${delErr.message}). Delete manually from dashboard.`);
  } else {
    console.log('   Deleted test row from public.users');
  }
}
await supabase.auth.signOut();
console.log('   Note: Test auth user remains in auth.users. Delete from Dashboard → Authentication → Users if desired.');

console.log('\n=== Done ===');
