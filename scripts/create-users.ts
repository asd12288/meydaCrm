/**
 * Create new users via Supabase Admin API
 * Usage: npx tsx scripts/create-users.ts
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

async function createUsers() {
  const users = [
    { email: 'robot24@crm.local', password: '12345678', displayName: 'ROBOT24 ROBOT24' },
    { email: 'deposit@crm.local', password: '12345678', displayName: 'DEPOSIT DEPOSIT' }
  ];

  console.log('🚀 Creating new users...\n');

  for (const user of users) {
    console.log(`Creating user: ${user.displayName}`);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    });

    if (authError) {
      console.error(`  ❌ Auth error: ${authError.message}`);
      continue;
    }

    console.log(`  ✅ Auth user created: ${authData.user.id}`);

    // Update profile with display_name and role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name: user.displayName, role: 'sales' })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error(`  ❌ Profile error: ${profileError.message}`);
    } else {
      console.log(`  ✅ Profile updated`);
    }
  }

  // Show new users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .in('display_name', ['ROBOT24 ROBOT24', 'DEPOSIT DEPOSIT']);

  console.log('\n📋 New users created:');
  profiles?.forEach(p => {
    console.log(`  - ${p.display_name}: ${p.id}`);
  });
}

createUsers().catch(console.error);
