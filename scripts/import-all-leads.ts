/**
 * Import ALL leads from XLSX and CSV files
 *
 * Usage: npx tsx scripts/import-all-leads.ts
 *
 * This script imports leads from:
 * - data/leads.xlsx (210K+ leads)
 * - data/Prospect*.csv (2K+ leads)
 *
 * Features:
 * - Handles different date formats (XLSX: YYYY-MM-DD, CSV: DD-MM-YYYY)
 * - Maps sales names (full names AND first-name-only)
 * - Deduplicates across all files by email
 * - Batch inserts (500 per batch)
 * - Preserves original created_at dates
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BATCH_SIZE = 500;
const DATA_DIR = './data';
const XLSX_FILE = 'leads.xlsx';

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
  'DEPOSIT DEPOSIT': 'd4e173f3-fa6c-4592-9212-807bf8e2232f',
  'ROBOT24 ROBOT24': '4753c93e-a1b0-41c7-a2b0-56fd0e68e70f',
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

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

function getAssignedTo(salesName: string | null | undefined): string | null {
  if (!salesName) return null;
  const trimmed = salesName.trim();
  return SALES_MAP[trimmed] || ARCHIVE_USER_ID;
}

function getStatus(statusValue: string | null | undefined): { status: string; label: string } {
  if (!statusValue) return DEFAULT_STATUS;
  return STATUS_MAP[statusValue.trim()] || DEFAULT_STATUS;
}

// Parse XLSX date format: "2025-12-18 09:11:55"
function parseDateXLSX(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

// Parse CSV date format: "19-12-2025 09:39:30"
function parseDateCSV(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, day, month, year, hour, min, sec] = match;
      const date = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return null;
  } catch {
    return null;
  }
}

// =============================================================================
// XLSX PARSER
// =============================================================================

interface LeadRecord {
  external_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  source: string | null;
  notes: string | null;
  status: string;
  status_label: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

function parseXLSX(filePath: string): LeadRecord[] {
  console.log(`   Reading ${filePath}...`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

  const headers = rawData[0] as string[];
  const rows = rawData.slice(1);
  console.log(`   Found ${rows.length} rows in XLSX`);

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

  const leads: LeadRecord[] = [];

  for (const row of rows) {
    const email = (row[colIdx.email] as string)?.toLowerCase()?.trim() || null;
    const phone = cleanPhone(row[colIdx.telPrincipal] as string) || cleanPhone(row[colIdx.mobile] as string);

    // Skip if no contact info
    if (!email && !phone) continue;

    const { firstName, lastName } = splitFullName(row[colIdx.nom] as string);
    const statusInfo = getStatus(row[colIdx.statut] as string);

    // Build notes from "Prénom" (budget info) and Description
    const prenomData = row[colIdx.prenom] as string;
    const description = row[colIdx.description] as string;
    const notes = [prenomData, description].filter(Boolean).join('\n\n') || null;

    leads.push({
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
      created_at: parseDateXLSX(row[colIdx.dateCreation] as string) || new Date().toISOString(),
      updated_at: parseDateXLSX(row[colIdx.dateModification] as string) || new Date().toISOString(),
    });
  }

  return leads;
}

// =============================================================================
// CSV PARSER
// =============================================================================

function parseCSV(filePath: string): LeadRecord[] {
  console.log(`   Reading ${filePath}...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  console.log(`   Found ${records.length} rows in CSV`);

  const leads: LeadRecord[] = [];

  for (const row of records) {
    const email = row['E-Mail Principale']?.toLowerCase()?.trim() || null;
    const phone = cleanPhone(row['Téléphone Principal']) || cleanPhone(row['Mobile']);

    // Skip if no contact info
    if (!email && !phone) continue;

    const { firstName, lastName } = splitFullName(row['Nom']);
    const statusInfo = getStatus(row['Statut']);

    // Build notes from "Prénom" (budget info), Description, and Platform
    const prenomData = row['Prénom'];
    const description = row['Description'];
    const platform = row['Plateforme'];
    const notesParts = [prenomData, description, platform ? `Plateforme: ${platform}` : null].filter(Boolean);
    const notes = notesParts.join('\n\n') || null;

    // Build address
    const address = row['Rue'] || null;
    const city = row['Ville'] || null;
    const postalCode = row['Code postal'] || null;

    leads.push({
      external_id: row['Prospect N°'] || null,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      company: null, // CSV doesn't have company
      address: address,
      city: city,
      postal_code: postalCode,
      country: 'France',
      source: row['Source'] || 'IMPORT',
      notes: notes,
      status: statusInfo.status,
      status_label: statusInfo.label,
      assigned_to: getAssignedTo(row['Assigné à']),
      created_at: parseDateCSV(row['Date de création']) || new Date().toISOString(),
      updated_at: parseDateCSV(row['Date de modification']) || new Date().toISOString(),
    });
  }

  return leads;
}

// =============================================================================
// MAIN
// =============================================================================

async function importAllLeads() {
  console.log('');
  console.log('🚀 IMPORT ALL LEADS');
  console.log('===================');
  console.log('');

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Collect all leads from all files
  const allLeads: LeadRecord[] = [];
  const seenEmails = new Set<string>();

  // 1. Parse XLSX file
  console.log('📖 Parsing XLSX file...');
  const xlsxPath = path.join(DATA_DIR, XLSX_FILE);
  if (fs.existsSync(xlsxPath)) {
    const xlsxLeads = parseXLSX(xlsxPath);
    console.log(`   Parsed ${xlsxLeads.length} leads from XLSX`);

    for (const lead of xlsxLeads) {
      if (lead.email) {
        if (seenEmails.has(lead.email)) continue;
        seenEmails.add(lead.email);
      }
      allLeads.push(lead);
    }
    console.log(`   After dedup: ${allLeads.length} unique leads`);
  } else {
    console.log(`   ⚠️  XLSX file not found: ${xlsxPath}`);
  }

  // 2. Parse all CSV files
  console.log('');
  console.log('📖 Parsing CSV files...');
  const csvFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.csv') && f.startsWith('Prospect'));

  for (const csvFile of csvFiles) {
    const csvPath = path.join(DATA_DIR, csvFile);
    const csvLeads = parseCSV(csvPath);

    let added = 0;
    for (const lead of csvLeads) {
      if (lead.email) {
        if (seenEmails.has(lead.email)) continue;
        seenEmails.add(lead.email);
      }
      allLeads.push(lead);
      added++;
    }
    console.log(`   Added ${added} unique leads from ${csvFile}`);
  }

  console.log('');
  console.log(`📊 Total unique leads to import: ${allLeads.length.toLocaleString()}`);
  console.log('');

  // Insert in batches
  console.log('💾 Inserting leads in batches...');
  let inserted = 0;
  let errors = 0;
  const totalBatches = Math.ceil(allLeads.length / BATCH_SIZE);

  for (let i = 0; i < allLeads.length; i += BATCH_SIZE) {
    const batch = allLeads.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const { error: insertError, data } = await supabase
      .from('leads')
      .insert(batch)
      .select('id');

    if (insertError) {
      console.error(`   ❌ Batch ${batchNum}/${totalBatches} failed:`, insertError.message);
      errors += batch.length;
    } else {
      inserted += data?.length || batch.length;
      process.stdout.write(`   ✅ Batch ${batchNum}/${totalBatches} - ${inserted.toLocaleString()} inserted\r`);
    }
  }

  console.log('');
  console.log('');
  console.log('='.repeat(50));
  console.log('📊 IMPORT COMPLETE');
  console.log('='.repeat(50));
  console.log(`   ✅ Inserted: ${inserted.toLocaleString()}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('='.repeat(50));
  console.log('');
}

// Run
importAllLeads().catch(console.error);
