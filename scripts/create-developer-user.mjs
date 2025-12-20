import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createDeveloperUser() {
  const username = 'roland122';
  const password = 'Thkikha122';
  const displayName = 'Roland122';
  const role = 'developer';

  // Create email from username
  const email = `${username.toLowerCase().replace(/\s+/g, '.')}@crm.local`;

  console.log(`Creating developer user: ${username} (${email})`);

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: displayName,
      role,
    },
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    process.exit(1);
  }

  console.log('Auth user created:', authData.user?.id);

  // Update profile (trigger should create it, but ensure role is correct)
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role,
        display_name: displayName,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      process.exit(1);
    }

    console.log('Profile updated successfully');
  }

  console.log('\n✅ User created successfully!');
  console.log(`Username: ${username}`);
  console.log(`Email: ${email}`);
  console.log(`Role: ${role}`);
  console.log(`User ID: ${authData.user?.id}`);
}

createDeveloperUser().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
