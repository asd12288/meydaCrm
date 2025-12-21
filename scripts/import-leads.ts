/**
 * Bulk import leads from XLSX file
 *
 * Usage: npx tsx scripts/import-leads.ts
 *
 * Features:
 * - Maps sales names to user IDs (unknowns → Archive)
 * - Maps statuses to lead_status enum
 * - Splits full name into first/last name
 * - Strips phone prefixes
 * - Skips duplicates by email
 * - Preserves original created_at dates
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BATCH_SIZE = 500;
const XLSX_PATH = './data/leads.xlsx';

// Archive user ID for unknown sales
const ARCHIVE_USER_ID = '2bb2a181-964b-4391-8e39-0644be2851a1';

// Sales name → user ID mapping (full names + first-name-only for CSV)
const SALES_MAP: Record<string, string> = {
  // Full names (XLSX format)
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
  // New users (created for import)
  'DEPOSIT DEPOSIT': 'd4e173f3-fa6c-4592-9212-807bf8e2232f',
  'ROBOT24 ROBOT24': '4753c93e-a1b0-41c7-a2b0-56fd0e68e70f',
  // Archived leads
  'poubelle': ARCHIVE_USER_ID,

  // First-name-only (CSV format)
  'ALAIN': '132e9d4a-05b2-4974-88fa-58d12d442b45',
  'CHARLES': 'eb38150a-d139-4cbc-9906-5e9aced19deb',
  'DELEMARRE': 'a6ace7a3-3caa-438c-bd37-d30a77bc0601',
  'FEYEUX': '9a999a73-6ab2-4d39-9ce3-2a0ac31a31af',
  'HELENE': '61948f7d-e6a5-42fb-8d7c-d4ec4353ef87',
  'JULIEN': 'a69953a7-9b66-4a3c-8837-15d63321d208',
  'LAURENT': '0471d54d-6cf1-4d1e-bb91-4735612e8060',
  'LUCAS': '0c1a9922-2f5e-421c-94bf-9c73fcb4faaf',
  'MAPAIRE': 'bf8b882a-380a-47f1-ab7d-00228575961e',
  'TAILLARD': 'db89e43d-59da-404a-a74b-e1b6578cefc6',
  'VINCENT': '271a5da3-cac9-4fa6-84ad-f74c5a0f6295',
  'DEPOSIT': 'd4e173f3-fa6c-4592-9212-807bf8e2232f',
  'ROBOT24': '4753c93e-a1b0-41c7-a2b0-56fd0e68e70f',
  'nicolas1': 'c2441370-9b19-405c-b51f-2c1ad44a5d05',
  'remy': '5091fef3-9e9f-43a2-a34e-e0fe23687aba',
  'sylvie': 'ab4584b7-b6b7-481e-a7c5-f21bb6d759f9',
};

// Status mapping (file value → DB enum)
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

// Default status for unmapped values
const DEFAULT_STATUS = { status: 'relance', label: 'Relance' };

// =============================================================================
// HELPERS
// =============================================================================

function cleanPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove "p:" prefix and trim
  return phone.replace(/^p:/, '').trim() || null;
}

function splitFullName(fullName: string | null | undefined): { firstName: string | null; lastName: string | null } {
  if (!fullName) return { firstName: null, lastName: null };

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: null, lastName: parts[0] };

  // First part is first name, rest is last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
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
  // Format: "2025-12-18 09:11:55"
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

// =============================================================================
// MAIN IMPORT FUNCTION
// =============================================================================

async function importLeads() {
  console.log('🚀 Starting lead import...\n');

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Read XLSX file
  console.log('📖 Reading XLSX file...');
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

  const headers = rawData[0] as string[];
  const rows = rawData.slice(1);
  console.log(`   Found ${rows.length} rows\n`);

  // Get column indexes
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

  // Get existing emails to skip duplicates
  console.log('📧 Fetching existing emails for duplicate check...');
  const { data: existingLeads, error: fetchError } = await supabase
    .from('leads')
    .select('email')
    .not('email', 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching existing leads:', fetchError);
    process.exit(1);
  }

  const existingEmails = new Set(
    (existingLeads || [])
      .map(l => l.email?.toLowerCase())
      .filter(Boolean)
  );
  console.log(`   Found ${existingEmails.size} existing emails\n`);

  // Transform and filter rows
  console.log('🔄 Transforming data...');
  const leadsToInsert: Record<string, unknown>[] = [];
  let skippedDuplicates = 0;
  let skippedNoContact = 0;

  for (const row of rows) {
    const email = (row[colIdx.email] as string)?.toLowerCase()?.trim() || null;
    const phone = cleanPhone(row[colIdx.telPrincipal] as string) || cleanPhone(row[colIdx.mobile] as string);

    // Skip if no email and no phone
    if (!email && !phone) {
      skippedNoContact++;
      continue;
    }

    // Skip duplicates by email
    if (email && existingEmails.has(email)) {
      skippedDuplicates++;
      continue;
    }

    // Mark email as seen to avoid duplicates within the file
    if (email) existingEmails.add(email);

    // Parse name - "Nom" contains full name
    const { firstName, lastName } = splitFullName(row[colIdx.nom] as string);

    // Get status
    const statusInfo = getStatus(row[colIdx.statut] as string);

    // Build notes from "Prénom" (which has budget info) and Description
    const prenomData = row[colIdx.prenom] as string;
    const description = row[colIdx.description] as string;
    const notes = [prenomData, description].filter(Boolean).join('\n\n') || null;

    const lead = {
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
    };

    leadsToInsert.push(lead);
  }

  console.log(`   Prepared ${leadsToInsert.length} leads to insert`);
  console.log(`   Skipped ${skippedDuplicates} duplicates (by email)`);
  console.log(`   Skipped ${skippedNoContact} leads with no contact info\n`);

  // Insert in batches
  console.log('💾 Inserting leads in batches...');
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
    const batch = leadsToInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(leadsToInsert.length / BATCH_SIZE);

    const { error: insertError, data } = await supabase
      .from('leads')
      .insert(batch)
      .select('id');

    if (insertError) {
      console.error(`   ❌ Batch ${batchNum}/${totalBatches} failed:`, insertError.message);
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

// Run
importLeads().catch(console.error);
