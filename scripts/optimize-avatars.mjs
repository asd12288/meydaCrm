/**
 * Script to optimize avatar images
 * Resizes to 200x200 and compresses
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const AVATARS_DIR = './public/avatars';
const TARGET_SIZE = 200; // 200x200 pixels

async function optimizeAvatars() {
  console.log('Starting avatar optimization...\n');

  const files = await readdir(AVATARS_DIR);
  const pngFiles = files.filter((f) => f.endsWith('.png'));

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const file of pngFiles) {
    const filePath = join(AVATARS_DIR, file);
    const originalStats = await stat(filePath);
    totalOriginalSize += originalStats.size;

    // Read and optimize
    const optimized = await sharp(filePath)
      .resize(TARGET_SIZE, TARGET_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .png({
        quality: 80,
        compressionLevel: 9,
      })
      .toBuffer();

    // Overwrite with optimized version
    await sharp(optimized).toFile(filePath);

    const newStats = await stat(filePath);
    totalOptimizedSize += newStats.size;

    const savings = (
      ((originalStats.size - newStats.size) / originalStats.size) *
      100
    ).toFixed(1);
    console.log(
      `${file}: ${(originalStats.size / 1024 / 1024).toFixed(2)}MB → ${(newStats.size / 1024).toFixed(0)}KB (${savings}% saved)`
    );
  }

  console.log('\n--- Summary ---');
  console.log(
    `Original total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`
  );
  console.log(
    `Optimized total: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`
  );
  console.log(
    `Saved: ${(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100).toFixed(1)}%`
  );
}

optimizeAvatars().catch(console.error);
