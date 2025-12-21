/**
 * Reset all sales users' passwords to a specified value
 *
 * Usage: npx tsx scripts/reset-sales-passwords.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NEW_PASSWORD = '123456';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('🔐 Resetting all sales users passwords to:', NEW_PASSWORD);
  console.log('');

  // Get all sales users
  const { data: salesUsers, error: fetchError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'sales')
    .order('display_name');

  if (fetchError) {
    console.error('Error fetching sales users:', fetchError.message);
    process.exit(1);
  }

  if (!salesUsers || salesUsers.length === 0) {
    console.log('No sales users found.');
    return;
  }

  console.log(`Found ${salesUsers.length} sales users to update:\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of salesUsers) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: NEW_PASSWORD,
    });

    if (error) {
      console.log(`❌ ${user.display_name}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`✅ ${user.display_name}: Password reset`);
      successCount++;
    }
  }

  console.log('');
  console.log('='.repeat(40));
  console.log(`✅ Success: ${successCount}`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }
  console.log('='.repeat(40));
}

main().catch(console.error);
