/**
 * One-time script to reset roland122's password
 * Usage: node scripts/reset-roland-password.mjs "NewPassword123"
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = 'd35fcda1-ee9d-422c-ad36-46dc2250caa7'; // roland122

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const newPassword = process.argv[2];
if (!newPassword) {
  console.error('Usage: node scripts/reset-roland-password.mjs "NewPassword"');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('Password must be at least 6 characters');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetPassword() {
  console.log(`Resetting password for roland122 (${USER_ID})...`);

  // Reset password using admin API
  const { error } = await supabase.auth.admin.updateUserById(USER_ID, {
    password: newPassword,
  });

  if (error) {
    console.error('Failed to reset password:', error.message);
    process.exit(1);
  }

  console.log('Password reset successfully!');
  console.log(`User: roland122`);
  console.log(`New password: ${newPassword}`);
}

resetPassword();
