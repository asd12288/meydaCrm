/**
 * One-time script to create the support developer user
 * Usage: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/create-support-user.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable for production
 */

import { createClient } from '@supabase/supabase-js';

// Production Supabase URL
const SUPABASE_URL = 'https://owwyxrxojltmupqrvqcp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/create-support-user.mjs');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSupportUser() {
  const email = 'support@crm.local';
  const password = 'Holon27@';
  const displayName = 'Support';
  const role = 'developer';

  console.log(`Creating developer user: ${displayName} (${email})...`);

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email confirmation
  });

  if (authError) {
    console.error('Failed to create auth user:', authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`Auth user created with ID: ${userId}`);

  // Create profile with developer role
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      role,
      display_name: displayName,
    });

  if (profileError) {
    console.error('Failed to create profile:', profileError.message);
    // Try to clean up auth user
    await supabase.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  console.log('');
  console.log('User created successfully!');
  console.log('========================');
  console.log(`Username: support`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${role}`);
  console.log(`Display Name: ${displayName}`);
}

createSupportUser();
