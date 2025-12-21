/**
 * Script to process and optimize new avatar images
 * Resizes 3000x3000 images to 200x200 and optimizes for web
 *
 * Run with: npx tsx scripts/process-avatars.ts
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SOURCE_DIR =
  'C:/Users/ilanc/Downloads/png-file_NjhmM2FiODQ4NTU4M2UwMDM4OWRmY2I4/PNG File';
const TARGET_DIR = 'c:/Users/ilanc/Desktop/crm/public/avatars';

// New avatars to add (starting from avatar-31)
const NEW_AVATARS = [
  // More Unique Characters (not already in the set)
  { source: 'Unique Character/5 - Paul McCartney.png', label: 'Paul McCartney' },
  { source: 'Unique Character/8 - Wes Anderson.png', label: 'Wes Anderson' },
  { source: 'Unique Character/9 - Marilyn Monroe.png', label: 'Marilyn Monroe' },
  { source: 'Unique Character/18 - Le Bron James.png', label: 'LeBron James' },
  { source: 'Unique Character/20 - Taylor Swift.png', label: 'Taylor Swift' },
  { source: 'Unique Character/21 - Lionel Messi.png', label: 'Lionel Messi' },
  { source: 'Unique Character/22 - Angela Merkel.png', label: 'Angela Merkel' },
  { source: 'Unique Character/25 - Hideo Kojima.png', label: 'Hideo Kojima' },
  { source: 'Unique Character/27 - Malala Yousafzai.png', label: 'Malala Yousafzai' },
  { source: 'Unique Character/13 - Pope Francis.png', label: 'Pape François' },
  { source: 'Unique Character/1 - Daft Punk 1.png', label: 'Daft Punk 1' },
  { source: 'Unique Character/2 - Daft Punk 2.png', label: 'Daft Punk 2' },

  // Profession Characters (diverse selection - using Male White Happy as default)
  { source: 'Profession Character/2 - Army/2 - Army Male - White - Happy.png', label: 'Militaire' },
  { source: 'Profession Character/12 - Astronaut/12 - Astronaut Male - White - Happy.png', label: 'Astronaute 2' },
  { source: 'Profession Character/13 - Scuba Divers/13 - Scuba Divers Male - White - Happy.png', label: 'Plongeur' },
  { source: 'Profession Character/15 - Archaeologist/15 - Archaeologist Male - White - Happy.png', label: 'Archéologue' },
  { source: 'Profession Character/17 - Sailor/17 - Sailor Male - White - Happy.png', label: 'Marin' },
  { source: 'Profession Character/18 - Clown/18 - Clown Male - White - Happy.png', label: 'Clown' },

  // Female profession characters for diversity
  { source: 'Profession Character/1 - Scientist/1 - Scientist Female - White - Happy.png', label: 'Scientifique F' },
  { source: 'Profession Character/10 - Programmer/10 - Programmer Female - White - Happy.png', label: 'Programmeuse' },
  { source: 'Profession Character/5 - Doctor/5 - Doctor Female - White - Happy.png', label: 'Médecin F' },
  { source: 'Profession Character/3 - Police/3 - Police Female - White - Happy.png', label: 'Policière' },

  // Regular/General Characters (colorful)
  { source: 'Reguler Character/General Character/General Character - Blue.png', label: 'Personnage Bleu' },
  { source: 'Reguler Character/General Character/General Character - Green.png', label: 'Personnage Vert' },
  { source: 'Reguler Character/General Character/General Character - Purple.png', label: 'Personnage Violet' },
  { source: 'Reguler Character/General Character/General Character - Red.png', label: 'Personnage Rouge' },
];

async function processAvatars() {
  console.log(`Processing ${NEW_AVATARS.length} new avatars...\n`);

  let startIndex = 31; // Start from avatar-31

  for (const avatar of NEW_AVATARS) {
    const sourcePath = path.join(SOURCE_DIR, avatar.source);
    const targetId = `avatar-${startIndex.toString().padStart(2, '0')}`;
    const targetPath = path.join(TARGET_DIR, `${targetId}.png`);

    try {
      if (!fs.existsSync(sourcePath)) {
        console.log(`❌ Source not found: ${avatar.source}`);
        continue;
      }

      await sharp(sourcePath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .png({
          quality: 90,
          compressionLevel: 9,
        })
        .toFile(targetPath);

      const stats = fs.statSync(targetPath);
      console.log(
        `✅ ${targetId}: ${avatar.label} (${Math.round(stats.size / 1024)}KB)`
      );

      startIndex++;
    } catch (error) {
      console.log(`❌ Error processing ${avatar.source}:`, error);
    }
  }

  console.log(`\nDone! Created avatars from avatar-31 to avatar-${startIndex - 1}`);

  // Generate the constants to add to avatars.ts
  console.log('\n--- Add to lib/constants/avatars.ts ---\n');
  let idx = 31;
  for (const avatar of NEW_AVATARS) {
    console.log(`  { id: 'avatar-${idx.toString().padStart(2, '0')}', label: '${avatar.label}' },`);
    idx++;
  }
}

processAvatars();
