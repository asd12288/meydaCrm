/**
 * Clear all leads from production database
 *
 * Usage: npx tsx scripts/clear-production-leads.ts --confirm
 *
 * This script deletes ALL leads and related data:
 * - lead_history
 * - lead_comments
 * - notes (linked to leads)
 * - import_rows
 * - leads
 *
 * It does NOT delete:
 * - profiles (users)
 * - import_jobs (history of imports)
 * - subscriptions, payments, support tickets, notifications
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// =============================================================================
// HELPERS
// =============================================================================

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCount(supabase: any, table: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error(`Error counting ${table}:`, error.message);
    return 0;
  }
  return count || 0;
}

// =============================================================================
// MAIN
// =============================================================================

async function clearProductionLeads() {
  // Check for --confirm flag
  if (!process.argv.includes('--confirm')) {
    console.log('');
    console.log('⚠️  SAFETY CHECK');
    console.log('================');
    console.log('This script will DELETE ALL LEADS from the database.');
    console.log('');
    console.log('To proceed, run with --confirm flag:');
    console.log('');
    console.log('  npx tsx scripts/clear-production-leads.ts --confirm');
    console.log('');
    process.exit(1);
  }

  console.log('');
  console.log('🗑️  CLEAR PRODUCTION LEADS');
  console.log('==========================');
  console.log('');

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Get counts before deletion
  console.log('📊 Current record counts:');
  const counts = {
    leads: await getCount(supabase, 'leads'),
    lead_history: await getCount(supabase, 'lead_history'),
    lead_comments: await getCount(supabase, 'lead_comments'),
    notes: await getCount(supabase, 'notes'),
    import_rows: await getCount(supabase, 'import_rows'),
  };

  console.log(`   leads:         ${counts.leads.toLocaleString()}`);
  console.log(`   lead_history:  ${counts.lead_history.toLocaleString()}`);
  console.log(`   lead_comments: ${counts.lead_comments.toLocaleString()}`);
  console.log(`   notes:         ${counts.notes.toLocaleString()}`);
  console.log(`   import_rows:   ${counts.import_rows.toLocaleString()}`);
  console.log('');

  // Final confirmation
  const answer = await prompt('⚠️  Are you sure you want to delete ALL this data? (type "DELETE" to confirm): ');

  if (answer !== 'DELETE') {
    console.log('');
    console.log('❌ Aborted. No data was deleted.');
    process.exit(0);
  }

  console.log('');
  console.log('🔄 Deleting records...');

  // Delete in order (respecting FK constraints)

  // 1. Delete lead_history (references leads)
  console.log('   Deleting lead_history...');
  const { error: historyError } = await supabase
    .from('lead_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (historyError) {
    console.error('   ❌ Error deleting lead_history:', historyError.message);
  } else {
    console.log(`   ✅ Deleted ${counts.lead_history} lead_history records`);
  }

  // 2. Delete lead_comments (references leads)
  console.log('   Deleting lead_comments...');
  const { error: commentsError } = await supabase
    .from('lead_comments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (commentsError) {
    console.error('   ❌ Error deleting lead_comments:', commentsError.message);
  } else {
    console.log(`   ✅ Deleted ${counts.lead_comments} lead_comments records`);
  }

  // 3. Delete notes (references leads)
  console.log('   Deleting notes...');
  const { error: notesError } = await supabase
    .from('notes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (notesError) {
    console.error('   ❌ Error deleting notes:', notesError.message);
  } else {
    console.log(`   ✅ Deleted ${counts.notes} notes records`);
  }

  // 4. Delete import_rows (references import_jobs, but we keep jobs)
  console.log('   Deleting import_rows...');
  const { error: rowsError } = await supabase
    .from('import_rows')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (rowsError) {
    console.error('   ❌ Error deleting import_rows:', rowsError.message);
  } else {
    console.log(`   ✅ Deleted ${counts.import_rows} import_rows records`);
  }

  // 5. Delete leads
  console.log('   Deleting leads...');
  const { error: leadsError } = await supabase
    .from('leads')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (leadsError) {
    console.error('   ❌ Error deleting leads:', leadsError.message);
  } else {
    console.log(`   ✅ Deleted ${counts.leads} leads records`);
  }

  // Verify deletion
  console.log('');
  console.log('📊 Final record counts:');
  console.log(`   leads:         ${await getCount(supabase, 'leads')}`);
  console.log(`   lead_history:  ${await getCount(supabase, 'lead_history')}`);
  console.log(`   lead_comments: ${await getCount(supabase, 'lead_comments')}`);
  console.log(`   notes:         ${await getCount(supabase, 'notes')}`);
  console.log(`   import_rows:   ${await getCount(supabase, 'import_rows')}`);

  console.log('');
  console.log('✅ DONE - Production leads have been cleared');
  console.log('');
}

// Run
clearProductionLeads().catch(console.error);
