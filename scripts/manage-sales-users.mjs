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
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Users to delete (existing test sales users)
const USERS_TO_DELETE = [
  'David',
  'Marc Dupont',
  'Sophie Leroy',
  'test test',
];

// New users to create (from Excel "Assigné à" column)
const USERS_TO_CREATE = [
  { username: 'archive', displayName: 'Archive' },
  { username: 'louvin', displayName: 'LOUVIN' },
  { username: 'richard', displayName: 'RICHARD' },
  { username: 'taillard', displayName: 'TAILLARD TAILLARD' },
  { username: 'alain', displayName: 'ALAIN ALAIN' },
  { username: 'lucas', displayName: 'LUCAS LUCAS' },
  { username: 'feyeux', displayName: 'FEYEUX FEYEUX' },
  { username: 'helene', displayName: 'HELENE HELENE' },
  { username: 'sylvie', displayName: 'sylvie sylvie' },
  { username: 'lefevre', displayName: 'LEFEVRE' },
  { username: 'laurent.verdier', displayName: 'LAURENT VERDIER' },
  { username: 'remy', displayName: 'remy remy' },
  { username: 'nicolas1', displayName: 'nicolas1 nicolas1' },
  { username: 'mapaire', displayName: 'MAPAIRE MAPAIRE' },
  { username: 'charles', displayName: 'CHARLES CHARLES' },
  { username: 'telaviv52', displayName: 'telaviv52' },
  { username: 'julien', displayName: 'JULIEN JULIEN' },
  { username: 'delemarre', displayName: 'DELEMARRE DELEMARRE' },
  { username: 'galvino', displayName: 'galvino' },
  { username: 'vincent', displayName: 'VINCENT VINCENT' },
];

const DEFAULT_PASSWORD = '12345678';

async function deleteUsers() {
  console.log('\n🗑️  DELETING EXISTING SALES USERS\n');
  console.log('=' .repeat(50));

  // Get all profiles to find user IDs
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('role', 'sales');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  for (const userName of USERS_TO_DELETE) {
    const profile = profiles.find(p => p.display_name === userName);
    
    if (!profile) {
      console.log(`⚠️  User "${userName}" not found, skipping...`);
      continue;
    }

    console.log(`Deleting user: ${userName} (ID: ${profile.id})`);
    
    const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.id);
    
    if (deleteError) {
      console.error(`❌ Error deleting ${userName}:`, deleteError.message);
    } else {
      console.log(`✅ Deleted: ${userName}`);
    }
  }
}

async function createUsers() {
  console.log('\n👥 CREATING NEW SALES USERS\n');
  console.log('=' .repeat(50));

  const results = {
    success: [],
    failed: [],
  };

  for (const user of USERS_TO_CREATE) {
    const email = `${user.username.toLowerCase().replace(/\s+/g, '.')}@crm.local`;
    
    console.log(`\nCreating: ${user.displayName} (${email})`);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        username: user.username,
        display_name: user.displayName,
        role: 'sales',
      },
    });

    if (authError) {
      console.error(`❌ Error creating ${user.displayName}:`, authError.message);
      results.failed.push({ ...user, error: authError.message });
      continue;
    }

    // Update profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'sales',
          display_name: user.displayName,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error(`⚠️  Profile update error for ${user.displayName}:`, profileError.message);
      }

      console.log(`✅ Created: ${user.displayName} (ID: ${authData.user.id})`);
      results.success.push({ ...user, id: authData.user.id, email });
    }
  }

  return results;
}

async function main() {
  console.log('🚀 SALES USER MANAGEMENT SCRIPT');
  console.log('=' .repeat(50));
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Users to delete: ${USERS_TO_DELETE.length}`);
  console.log(`Users to create: ${USERS_TO_CREATE.length}`);
  console.log(`Default password: ${DEFAULT_PASSWORD}`);

  // Step 1: Delete existing users
  await deleteUsers();

  // Step 2: Create new users
  const results = await createUsers();

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Successfully created: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\nFailed users:');
    results.failed.forEach(u => console.log(`  - ${u.displayName}: ${u.error}`));
  }

  console.log('\n✅ All users created with password: ' + DEFAULT_PASSWORD);
  console.log('\nCreated users:');
  results.success.forEach(u => {
    console.log(`  - ${u.displayName} (${u.username})`);
  });
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
