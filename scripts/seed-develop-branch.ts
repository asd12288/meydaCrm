/**
 * Seed the development branch with users and data
 *
 * This script:
 * 1. Creates all 24 users (same IDs as production)
 * 2. Imports leads from the XLSX file
 *
 * Usage:
 *   Set SUPABASE_DEV_URL and SUPABASE_DEV_SERVICE_KEY env vars, then run:
 *   npx tsx scripts/seed-develop-branch.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Use environment variables for develop branch
// Set SUPABASE_DEV_URL and SUPABASE_DEV_SERVICE_KEY before running
const DEV_URL = process.env.SUPABASE_DEV_URL || 'https://wdtzyhtmrpbsrxycsqrf.supabase.co';
const DEV_SERVICE_KEY = process.env.SUPABASE_DEV_SERVICE_KEY!;

// Safety check - NEVER run against production
const PRODUCTION_REF = 'owwyxrxojltmupqrvqcp';
if (DEV_URL.includes(PRODUCTION_REF)) {
  console.error('❌ SAFETY: Cannot run against production database!');
  console.error('   Set SUPABASE_DEV_URL to your develop branch URL');
  process.exit(1);
}

if (!DEV_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_DEV_SERVICE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(DEV_URL, DEV_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Production users to recreate (same IDs for data compatibility)
const USERS = [
  { id: 'fd490d4a-5841-4996-bb9f-985d750ea374', email: 'admin@crm.local', password: 'Stabilo26', displayName: 'Admin', role: 'admin' },
  { id: '132e9d4a-05b2-4974-88fa-58d12d442b45', email: 'alain@crm.local', password: '12345678', displayName: 'ALAIN ALAIN', role: 'sales' },
  { id: '2bb2a181-964b-4391-8e39-0644be2851a1', email: 'archive@crm.local', password: '12345678', displayName: 'Archive', role: 'sales' },
  { id: 'eb38150a-d139-4cbc-9906-5e9aced19deb', email: 'charles@crm.local', password: '12345678', displayName: 'CHARLES CHARLES', role: 'sales' },
  { id: 'a6ace7a3-3caa-438c-bd37-d30a77bc0601', email: 'delemarre@crm.local', password: '12345678', displayName: 'DELEMARRE DELEMARRE', role: 'sales' },
  { id: '9a999a73-6ab2-4d39-9ce3-2a0ac31a31af', email: 'feyeux@crm.local', password: '12345678', displayName: 'FEYEUX FEYEUX', role: 'sales' },
  { id: 'af7ebf09-6cbc-4d66-b145-8468d33501a3', email: 'galvino@crm.local', password: '12345678', displayName: 'Galvino', role: 'sales' },
  { id: '61948f7d-e6a5-42fb-8d7c-d4ec4353ef87', email: 'helene@crm.local', password: '12345678', displayName: 'HELENE HELENE', role: 'sales' },
  { id: 'a69953a7-9b66-4a3c-8837-15d63321d208', email: 'julien@crm.local', password: '12345678', displayName: 'JULIEN JULIEN', role: 'sales' },
  { id: '0471d54d-6cf1-4d1e-bb91-4735612e8060', email: 'laurent@crm.local', password: '12345678', displayName: 'LAURENT VERDIER', role: 'sales' },
  { id: 'ec165a81-823d-47bf-8ccc-509b3e17ac8b', email: 'lefevre@crm.local', password: '12345678', displayName: 'LEFEVRE', role: 'sales' },
  { id: '115bb403-55db-43b9-8870-1ffc60b25d74', email: 'louvin@crm.local', password: '12345678', displayName: 'LOUVIN', role: 'sales' },
  { id: '0c1a9922-2f5e-421c-94bf-9c73fcb4faaf', email: 'lucas@crm.local', password: '12345678', displayName: 'LUCAS LUCAS', role: 'sales' },
  { id: 'bf8b882a-380a-47f1-ab7d-00228575961e', email: 'mapaire@crm.local', password: '12345678', displayName: 'MAPAIRE MAPAIRE', role: 'sales' },
  { id: 'c2441370-9b19-405c-b51f-2c1ad44a5d05', email: 'nicolas1@crm.local', password: '12345678', displayName: 'nicolas1 nicolas1', role: 'sales' },
  { id: '5091fef3-9e9f-43a2-a34e-e0fe23687aba', email: 'remy@crm.local', password: '12345678', displayName: 'remy remy', role: 'sales' },
  { id: 'f0c5ffa8-2547-4c14-a183-6f4402575cfe', email: 'richard@crm.local', password: '12345678', displayName: 'RICHARD', role: 'sales' },
  { id: 'ab4584b7-b6b7-481e-a7c5-f21bb6d759f9', email: 'sylvie@crm.local', password: '12345678', displayName: 'sylvie sylvie', role: 'sales' },
  { id: 'db89e43d-59da-404a-a74b-e1b6578cefc6', email: 'taillard@crm.local', password: '12345678', displayName: 'TAILLARD TAILLARD', role: 'sales' },
  { id: 'e2b3d5a3-cf53-4ec1-b3a8-7503b540f165', email: 'telaviv52@crm.local', password: '12345678', displayName: 'telaviv52', role: 'sales' },
  { id: '271a5da3-cac9-4fa6-84ad-f74c5a0f6295', email: 'vincent@crm.local', password: '12345678', displayName: 'VINCENT VINCENT', role: 'sales' },
  { id: 'd35fcda1-ee9d-422c-ad36-46dc2250caa7', email: 'roland122@crm.local', password: '12345678', displayName: 'Roland122', role: 'developer' },
  { id: '4753c93e-a1b0-41c7-a2b0-56fd0e68e70f', email: 'robot24@crm.local', password: '12345678', displayName: 'ROBOT24 ROBOT24', role: 'sales' },
  { id: 'd4e173f3-fa6c-4592-9212-807bf8e2232f', email: 'deposit@crm.local', password: '12345678', displayName: 'DEPOSIT DEPOSIT', role: 'sales' },
];

// Import configuration (same as import-leads.ts)
const BATCH_SIZE = 500;
const XLSX_PATH = './data/leads.xlsx';
const ARCHIVE_USER_ID = '2bb2a181-964b-4391-8e39-0644be2851a1';

const SALES_MAP: Record<string, string> = {
  'ALAIN ALAIN': '132e9d4a-05b2-4974-88fa-58d12d442b45',
  'CHARLES CHARLES': 'eb38150a-d139-4cbc-9906-5e9aced19deb',
  'DELEMARRE DELEMARRE': 'a6ace7a3-3caa-438c-bd37-d30a77bc0601',
  'FEYEUX FEYEUX': '9a999a73-6ab2-4d39-9ce3-2a0ac31a31af',
  'HELENE HELENE': '61948f7d-e6a5-42fb-8d7c-d4ec4353ef87',
  'JULIEN JULIEN': 'a69953a7-9b66-4a3c-8837-15d63321d208',
  'LAURENT VERDIER': '0471d54d-6cf1-4d1e-bb91-4735612e8060',
  'LEFEVRE': 'ec165a81-823d-47bf-8ccc-509b3e17ac8b',
  'LOUVIN': '115bb403-55db-43b9-8870-1ffc60b25d74',
  'LUCAS LUCAS': '0c1a9922-2f5e-421c-94bf-9c73fcb4faaf',
  'MAPAIRE MAPAIRE': 'bf8b882a-380a-47f1-ab7d-00228575961e',
  'RICHARD': 'f0c5ffa8-2547-4c14-a183-6f4402575cfe',
  'TAILLARD TAILLARD': 'db89e43d-59da-404a-a74b-e1b6578cefc6',
  'VINCENT VINCENT': '271a5da3-cac9-4fa6-84ad-f74c5a0f6295',
  'admin admin': 'fd490d4a-5841-4996-bb9f-985d750ea374',
  'Admin': 'fd490d4a-5841-4996-bb9f-985d750ea374',
  'galvino': 'af7ebf09-6cbc-4d66-b145-8468d33501a3',
  'Galvino': 'af7ebf09-6cbc-4d66-b145-8468d33501a3',
  'nicolas1 nicolas1': 'c2441370-9b19-405c-b51f-2c1ad44a5d05',
  'remy remy': '5091fef3-9e9f-43a2-a34e-e0fe23687aba',
  'sylvie sylvie': 'ab4584b7-b6b7-481e-a7c5-f21bb6d759f9',
  'telaviv52': 'e2b3d5a3-cf53-4ec1-b3a8-7503b540f165',
  'DEPOSIT DEPOSIT': 'd4e173f3-fa6c-4592-9212-807bf8e2232f',
  'ROBOT24 ROBOT24': '4753c93e-a1b0-41c7-a2b0-56fd0e68e70f',
  'poubelle': ARCHIVE_USER_ID,
};

const STATUS_MAP: Record<string, { status: string; label: string }> = {
  'Call back': { status: 'callback', label: 'Rappel' },
  'Deposit': { status: 'deposit', label: 'Dépôt' },
  'Depot en cours': { status: 'deposit', label: 'Dépôt' },
  'MAIL': { status: 'mail', label: 'Mail' },
  'No Answer 2': { status: 'no_answer_2', label: 'Pas de réponse 2' },
  'No answer': { status: 'no_answer', label: 'Pas de réponse' },
  'Not interess': { status: 'not_interested', label: 'Pas intéressé' },
  'RDV': { status: 'rdv', label: 'RDV' },
  'Wrong number': { status: 'wrong_number', label: 'Faux numéro' },
  'repondeur': { status: 'no_answer', label: 'Pas de réponse' },
};

const DEFAULT_STATUS = { status: 'relance', label: 'Relance' };

// Helper functions
function cleanPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return phone.replace(/^p:/, '').trim() || null;
}

function splitFullName(fullName: string | null | undefined): { firstName: string | null; lastName: string | null } {
  if (!fullName) return { firstName: null, lastName: null };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: null, lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function getAssignedTo(salesName: string | null | undefined): string | null {
  if (!salesName) return null;
  return SALES_MAP[salesName] || ARCHIVE_USER_ID;
}

function getStatus(statusValue: string | null | undefined): { status: string; label: string } {
  if (!statusValue) return DEFAULT_STATUS;
  return STATUS_MAP[statusValue] || DEFAULT_STATUS;
}

function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

async function createUsers() {
  console.log('👥 Creating users...\n');

  let created = 0;
  let skipped = 0;

  for (const user of USERS) {
    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.getUserById(user.id);

    if (existing?.user) {
      console.log(`   ⏭️  ${user.displayName} (already exists)`);
      skipped++;
      continue;
    }

    // Create auth user with specific ID
    const { error: authError } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (authError) {
      console.log(`   ❌ ${user.displayName}: ${authError.message}`);
      continue;
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name: user.displayName, role: user.role })
      .eq('id', user.id);

    if (profileError) {
      console.log(`   ⚠️  ${user.displayName}: Profile error - ${profileError.message}`);
    } else {
      console.log(`   ✅ ${user.displayName}`);
      created++;
    }
  }

  console.log(`\n   Created: ${created}, Skipped: ${skipped}\n`);
}

async function importLeads() {
  console.log('📊 Importing leads...\n');

  // Read XLSX
  console.log('   Reading XLSX file...');
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

  const headers = rawData[0] as string[];
  const rows = rawData.slice(1);
  console.log(`   Found ${rows.length} rows\n`);

  // Column indexes
  const colIdx = {
    id: headers.indexOf('ID'),
    nom: headers.indexOf('Nom'),
    prenom: headers.indexOf('Prénom'),
    statut: headers.indexOf('Statut'),
    source: headers.indexOf('Source'),
    societe: headers.indexOf('Société'),
    dateCreation: headers.indexOf('Date de création'),
    dateModification: headers.indexOf('Date de modification'),
    telPrincipal: headers.indexOf('Téléphone Principal'),
    mobile: headers.indexOf('Mobile'),
    email: headers.indexOf('E-Mail Principale'),
    adresse: headers.indexOf('Adresse'),
    ville: headers.indexOf('Ville'),
    codePostal: headers.indexOf('Code postal'),
    pays: headers.indexOf('Pays'),
    assigneA: headers.indexOf('Assigné à'),
    description: headers.indexOf('Description'),
  };

  // Get existing emails
  const { data: existingLeads } = await supabase
    .from('leads')
    .select('email')
    .not('email', 'is', null);

  const existingEmails = new Set(
    (existingLeads || []).map(l => l.email?.toLowerCase()).filter(Boolean)
  );
  console.log(`   Found ${existingEmails.size} existing emails\n`);

  // Transform rows
  console.log('   Transforming data...');
  const leadsToInsert: Record<string, unknown>[] = [];
  let skippedDuplicates = 0;
  let skippedNoContact = 0;

  for (const row of rows) {
    const email = (row[colIdx.email] as string)?.toLowerCase()?.trim() || null;
    const phone = cleanPhone(row[colIdx.telPrincipal] as string) || cleanPhone(row[colIdx.mobile] as string);

    if (!email && !phone) {
      skippedNoContact++;
      continue;
    }

    if (email && existingEmails.has(email)) {
      skippedDuplicates++;
      continue;
    }

    if (email) existingEmails.add(email);

    const { firstName, lastName } = splitFullName(row[colIdx.nom] as string);
    const statusInfo = getStatus(row[colIdx.statut] as string);
    const prenomData = row[colIdx.prenom] as string;
    const description = row[colIdx.description] as string;
    const notes = [prenomData, description].filter(Boolean).join('\n\n') || null;

    leadsToInsert.push({
      external_id: row[colIdx.id]?.toString() || null,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      company: (row[colIdx.societe] as string) || null,
      address: (row[colIdx.adresse] as string) || null,
      city: (row[colIdx.ville] as string) || null,
      postal_code: (row[colIdx.codePostal] as string)?.toString() || null,
      country: (row[colIdx.pays] as string) || 'France',
      source: (row[colIdx.source] as string) || null,
      notes: notes,
      status: statusInfo.status,
      status_label: statusInfo.label,
      assigned_to: getAssignedTo(row[colIdx.assigneA] as string),
      created_at: parseDate(row[colIdx.dateCreation] as string) || new Date().toISOString(),
      updated_at: parseDate(row[colIdx.dateModification] as string) || new Date().toISOString(),
    });
  }

  console.log(`   Prepared ${leadsToInsert.length} leads`);
  console.log(`   Skipped ${skippedDuplicates} duplicates`);
  console.log(`   Skipped ${skippedNoContact} no contact\n`);

  // Insert in batches
  console.log('   Inserting leads...');
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
    const batch = leadsToInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(leadsToInsert.length / BATCH_SIZE);

    const { error, data } = await supabase.from('leads').insert(batch).select('id');

    if (error) {
      console.error(`   ❌ Batch ${batchNum}/${totalBatches}: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += data?.length || batch.length;
      process.stdout.write(`   ✅ Batch ${batchNum}/${totalBatches} - ${inserted} inserted\r`);
    }
  }

  console.log('\n');
  console.log('=' .repeat(50));
  console.log('📊 IMPORT COMPLETE');
  console.log('=' .repeat(50));
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skippedDuplicates}`);
  console.log(`   ⏭️  Skipped (no contact): ${skippedNoContact}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('=' .repeat(50));
}

async function main() {
  console.log('🚀 Seeding Development Branch\n');
  console.log('   URL:', DEV_URL);
  console.log('');

  await createUsers();
  await importLeads();

  console.log('\n✅ Development branch seeded successfully!');
}

main().catch(console.error);
