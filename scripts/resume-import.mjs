#!/usr/bin/env node

/**
 * Resume Import Script
 *
 * For large imports that timeout, this script will keep calling
 * the resume endpoint until all rows are processed.
 *
 * Usage: node scripts/resume-import.mjs <import-job-id>
 */

const importJobId = process.argv[2];

if (!importJobId) {
  console.error('Usage: node scripts/resume-import.mjs <import-job-id>');
  process.exit(1);
}

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

async function checkStatus() {
  const res = await fetch(`${BASE_URL}/api/import/${importJobId}/resume`);
  return res.json();
}

async function resume() {
  const res = await fetch(`${BASE_URL}/api/import/${importJobId}/resume`, {
    method: 'POST',
  });
  return res.json();
}

async function main() {
  console.log(`\n🔄 Resuming import: ${importJobId}`);
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  let iteration = 0;
  let totalImported = 0;

  while (true) {
    iteration++;

    // Check current status
    const status = await checkStatus();

    if (!status.job) {
      console.error('❌ Job not found');
      break;
    }

    const { job, remainingValidRows } = status;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Iteration ${iteration}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Total rows: ${job.total_rows?.toLocaleString()}`);
    console.log(`   Valid rows: ${job.valid_rows?.toLocaleString()}`);
    console.log(`   Imported: ${job.imported_rows?.toLocaleString()}`);
    console.log(`   Skipped: ${job.skipped_rows?.toLocaleString()}`);
    console.log(`   Remaining: ${remainingValidRows?.toLocaleString()}`);

    if (job.status === 'completed') {
      console.log(`\n✅ Import completed!`);
      console.log(`   Total imported: ${job.imported_rows?.toLocaleString()}`);
      break;
    }

    if (job.status === 'failed' || job.status === 'cancelled') {
      console.log(`\n❌ Import ${job.status}`);
      break;
    }

    if (remainingValidRows === 0) {
      console.log(`\n✅ No remaining rows - marking complete`);
      await resume();
      break;
    }

    // Resume processing
    console.log(`\n⏳ Processing next batch...`);
    const startTime = Date.now();
    const importedBefore = job.imported_rows || 0;

    try {
      const result = await resume();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
        // Wait and retry
        console.log(`   Retrying in 5 seconds...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      if (result.result) {
        const batchImported = result.result.importedCount || 0;
        totalImported += batchImported;

        console.log(`✅ Batch complete in ${duration}s`);
        console.log(`   Imported this batch: ${batchImported.toLocaleString()}`);
        console.log(`   Skipped this batch: ${result.result.skippedCount || 0}`);

        const progress = job.valid_rows
          ? (((job.imported_rows || 0) + batchImported) / job.valid_rows * 100).toFixed(1)
          : 0;
        console.log(`   Progress: ${progress}%`);
      }
    } catch (err) {
      console.log(`❌ Request failed: ${err.message}`);
      console.log(`   Retrying in 5 seconds...`);
      await new Promise(r => setTimeout(r, 5000));
    }

    // Small delay between batches
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🏁 Resume script finished`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(console.error);
