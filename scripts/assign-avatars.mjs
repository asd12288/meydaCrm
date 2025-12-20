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

// Avatar assignments based on name analysis
// Female avatars: 11, 16, 18, 21, 24, 26, 28, 29
// Male avatars: 02, 04, 05, 06, 07, 09, 10, 12, 14, 15, 17, 20, 22, 23, 25, 27, 30
// Special/Neutral: 03

const AVATAR_ASSIGNMENTS = {
  // Female names
  'HELENE HELENE': 'avatar-21',      // Blonde woman in blue blazer (professional)
  'sylvie sylvie': 'avatar-11',      // Woman with dark curly hair

  // Special
  'Archive': 'avatar-03',            // Charlie Chaplin style (neutral/archive)

  // Male names - diverse selection
  'LOUVIN': 'avatar-07',             // Singer/performer
  'RICHARD': 'avatar-09',            // Tesla businessman style
  'TAILLARD TAILLARD': 'avatar-15',  // Scientist with hat
  'ALAIN ALAIN': 'avatar-17',        // Man with laptop
  'LUCAS LUCAS': 'avatar-20',        // Soccer player (young, energetic)
  'FEYEUX FEYEUX': 'avatar-06',      // Detective with magnifying glass
  'LEFEVRE': 'avatar-22',            // Pilot (professional)
  'LAURENT VERDIER': 'avatar-23',    // Doctor (professional)
  'remy remy': 'avatar-25',          // Man in tuxedo (professional)
  'nicolas1 nicolas1': 'avatar-10',  // Elon Musk style (tech)
  'MAPAIRE MAPAIRE': 'avatar-14',    // Man with cap (casual)
  'CHARLES CHARLES': 'avatar-04',    // Dalí style (distinguished)
  'telaviv52': 'avatar-05',          // Steve Jobs style (tech)
  'JULIEN JULIEN': 'avatar-12',      // Boxer (energetic)
  'DELEMARRE DELEMARRE': 'avatar-27', // Firefighter
  'galvino': 'avatar-30',            // Farmer
  'VINCENT VINCENT': 'avatar-02',    // Freddie Mercury style (artistic)

  // Admin and Developer (if needed)
  'Admin': 'avatar-01',              // Einstein (wise)
  'Roland122': 'avatar-19',          // Astronaut (developer/explorer)
};

async function assignAvatars() {
  console.log('\n🎨 ASSIGNING AVATARS TO USERS\n');
  console.log('=' .repeat(50));

  // Get all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const profile of profiles) {
    const avatar = AVATAR_ASSIGNMENTS[profile.display_name];

    if (!avatar) {
      console.log(`⚠️  No avatar mapping for: ${profile.display_name}`);
      skipped++;
      continue;
    }

    if (profile.avatar === avatar) {
      console.log(`✓ ${profile.display_name} already has ${avatar}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar })
      .eq('id', profile.id);

    if (updateError) {
      console.error(`❌ Error updating ${profile.display_name}:`, updateError.message);
    } else {
      console.log(`✅ ${profile.display_name} → ${avatar}`);
      updated++;
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped (no mapping): ${skipped}`);
}

assignAvatars().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
