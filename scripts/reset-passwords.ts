/**
 * Reset all user passwords
 * Usage: npx tsx scripts/reset-passwords.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Admin user gets special password
const ADMIN_USER_ID = 'fd490d4a-5841-4996-bb9f-985d750ea374';
const ADMIN_PASSWORD = 'Stabilo26';
const DEFAULT_PASSWORD = '12345678';

async function resetPasswords() {
  console.log('🔐 Resetting all user passwords...\n');

  // Get all profiles
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, display_name, role');

  if (fetchError) {
    console.error('Error fetching profiles:', fetchError.message);
    process.exit(1);
  }

  console.log(`Found ${profiles?.length} users\n`);

  let success = 0;
  let errors = 0;

  for (const profile of profiles || []) {
    const password = profile.id === ADMIN_USER_ID ? ADMIN_PASSWORD : DEFAULT_PASSWORD;
    const passwordDisplay = profile.id === ADMIN_USER_ID ? 'Stabilo26' : '12345678';

    const { error } = await supabase.auth.admin.updateUserById(profile.id, {
      password: password
    });

    if (error) {
      console.log(`❌ ${profile.display_name}: ${error.message}`);
      errors++;
    } else {
      console.log(`✅ ${profile.display_name} → ${passwordDisplay}`);
      success++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 PASSWORD RESET COMPLETE');
  console.log('='.repeat(50));
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('='.repeat(50));
}

resetPasswords().catch(console.error);
