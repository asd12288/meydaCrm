# Import System Architecture Plan

## Executive Summary

This document outlines a complete redesign of the CRM import system to handle **200k+ lead rows** reliably. The current system has limitations with timeouts, memory usage, and error recovery. The new architecture uses a job queue pattern with streaming parsers and background processing.

---

## 1. Current System Analysis

### What Works Well ✓
- Two-phase import (parse → commit) - solid foundation
- Auto column mapping with French/English aliases
- Duplicate detection (database + within-file)
- 4 assignment modes (none, single, round-robin, by_column)
- Audit trail with lead_history events
- RLS protection (admin-only)

### Critical Issues ✗

| Issue | Impact | Priority |
|-------|--------|----------|
| **Memory: Loads entire file** | Crashes on files >50MB | P0 |
| **Timeout: Edge Functions 10-min limit** | Fails on 50k+ rows | P0 |
| **No retry mechanism** | Partial imports lost | P0 |
| **RLS bug: Uses profiles query** | Infinite recursion possible | P1 |
| **Duplicate detection: Fetches 100k leads** | Memory/timeout issues | P1 |
| **No progress recovery** | Must restart from scratch | P2 |
| **No error report download** | Users can't fix issues | P2 |

---

## 2. New Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS (VERCEL)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Upload    │  │   Status    │  │   Review    │                  │
│  │   Wizard    │  │   Polling   │  │   UI        │                  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                  │
└─────────┼────────────────┼──────────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE STORAGE                             │
│                    (CSV/XLSX files, error reports)                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      UPSTASH QSTASH (JOB QUEUE)                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  parse_job      │  │  commit_job     │  │  error_report   │      │
│  │  (retries: 3)   │  │  (retries: 3)   │  │  (retries: 2)   │      │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │
└───────────┼─────────────────────┼─────────────────────┼─────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  IMPORT WORKER (NEXT.JS API ROUTES)                 │
│                                                                     │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  SMALL FILES (<20k rows): Process in API route             │    │
│   │  - Streaming CSV/XLSX parser                               │    │
│   │  - Batch inserts (500 rows)                                │    │
│   │  - 5-min timeout (Free) / 15-min (Pro) on Vercel           │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  LARGE FILES (>20k rows): Chunked processing               │    │
│   │  - Split into 20k-row chunks                               │    │
│   │  - Each chunk = separate QStash job                        │    │
│   │  - Parallel processing (up to 3 chunks)                    │    │
│   └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SUPABASE POSTGRES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ import_jobs  │  │ import_rows  │  │    leads     │               │
│  │ (staging)    │  │ (validation) │  │   (final)    │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Improvements

1. **Job Queue with Retries**: Upstash QStash provides HTTP-delivered jobs with automatic retries
2. **Streaming Parser**: papaparse streams file row-by-row (no full file in memory)
3. **Chunked Processing**: Large files split into manageable chunks
4. **Checkpoint Recovery**: Jobs can resume from last successful chunk
5. **Idempotency**: Same file won't be imported twice
6. **Error Reports**: Downloadable CSV of failed rows

---

## 3. Database Schema Updates

### New Columns for import_jobs

```sql
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS
  file_hash TEXT;                    -- SHA-256 for idempotency

ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS
  processed_rows INTEGER DEFAULT 0;   -- Actual count (not estimated)

ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS
  last_checkpoint INTEGER DEFAULT 0;  -- Last successful chunk

ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS
  error_report_path TEXT;            -- Path to error CSV in Storage

ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS
  assignment_config JSONB;           -- Store assignment settings

ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS
  duplicate_config JSONB;            -- Store duplicate settings

ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS
  worker_id TEXT;                    -- QStash message ID for tracking

-- Add index for idempotency check
CREATE INDEX IF NOT EXISTS import_jobs_file_hash_idx
  ON import_jobs(file_hash)
  WHERE file_hash IS NOT NULL;
```

### Fix RLS Policies

```sql
-- Drop old policies
DROP POLICY IF EXISTS admin_read_import_jobs ON import_jobs;
DROP POLICY IF EXISTS admin_insert_import_jobs ON import_jobs;
DROP POLICY IF EXISTS admin_update_import_jobs ON import_jobs;

-- Create fixed policies using get_user_role()
CREATE POLICY admin_read_import_jobs ON import_jobs
  FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY admin_insert_import_jobs ON import_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role() = 'admin'
    AND created_by = auth.uid()
  );

CREATE POLICY admin_update_import_jobs ON import_jobs
  FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Same for import_rows
DROP POLICY IF EXISTS admin_read_import_rows ON import_rows;
DROP POLICY IF EXISTS admin_insert_import_rows ON import_rows;
DROP POLICY IF EXISTS admin_update_import_rows ON import_rows;

CREATE POLICY admin_read_import_rows ON import_rows
  FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY admin_insert_import_rows ON import_rows
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY admin_update_import_rows ON import_rows
  FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin');
```

### Add Dedupe Index Optimization

```sql
-- Partial indexes for faster duplicate detection
CREATE INDEX IF NOT EXISTS leads_email_lower_idx
  ON leads(LOWER(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_phone_idx
  ON leads(phone)
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_external_id_idx
  ON leads(external_id)
  WHERE external_id IS NOT NULL;
```

---

## 4. New File Structure

```
modules/import/
├── api/                           # NEW: API route handlers
│   ├── create-job.ts              # Upload file, create job
│   ├── start-parse.ts             # Enqueue parse job to QStash
│   ├── parse-worker.ts            # Process parse job
│   ├── start-commit.ts            # Enqueue commit job
│   ├── commit-worker.ts           # Process commit job
│   ├── job-status.ts              # Get job status
│   └── error-report.ts            # Generate/download error CSV
│
├── lib/
│   ├── actions.ts                 # Server actions (thin wrappers)
│   ├── parsers/                   # NEW: Streaming parsers
│   │   ├── csv-streamer.ts        # papaparse streaming
│   │   ├── xlsx-streamer.ts       # xlsx-stream-reader
│   │   └── index.ts
│   ├── queue/                     # NEW: QStash integration
│   │   ├── client.ts              # QStash client setup
│   │   ├── jobs.ts                # Job definitions
│   │   └── verify.ts              # Signature verification
│   ├── processors/                # NEW: Core processing logic
│   │   ├── parse-processor.ts     # Parse + validate logic
│   │   ├── commit-processor.ts    # Insert + dedupe logic
│   │   ├── dedupe.ts              # Duplicate detection
│   │   └── assignment.ts          # Assignment logic
│   ├── validators.ts              # Row validation (existing)
│   └── auto-mapper.ts             # Column mapping (existing)
│
├── components/
│   ├── import-wizard.tsx          # UPDATE: New flow
│   ├── upload-step.tsx            # UPDATE: Hash calculation
│   ├── review-step.tsx            # UPDATE: Better progress
│   ├── error-report-modal.tsx     # NEW: View/download errors
│   └── job-history-table.tsx      # NEW: Past imports
│
├── hooks/
│   ├── use-import-wizard.ts       # UPDATE: New state machine
│   ├── use-job-status.ts          # NEW: Polling with backoff
│   └── use-import-history.ts      # NEW: Past imports
│
├── config/
│   ├── constants.ts               # UPDATE: Add queue settings
│   └── column-aliases.ts          # Existing
│
├── types/
│   ├── index.ts                   # UPDATE: New types
│   └── queue.ts                   # NEW: Queue message types
│
└── views/
    ├── import-wizard-view.tsx     # Existing
    └── import-history-view.tsx    # NEW: Import history page
```

---

## 5. Import Flow (New)

### Phase 1: Upload & Validate

```
User uploads file
       │
       ▼
┌─────────────────────────────────────────┐
│  1. Calculate file SHA-256 hash         │
│  2. Check for existing import (dedupe)  │
│  3. Upload file to Supabase Storage     │
│  4. Create import_job record            │
│  5. Auto-detect columns & mapping       │
│  6. Show preview (first 100 rows)       │
└─────────────────────────────────────────┘
       │
       ▼
User reviews mapping & configures options
       │
       ▼
User clicks "Valider & Analyser"
```

### Phase 2: Parse & Stage

```
┌─────────────────────────────────────────┐
│  1. Enqueue parse job to QStash         │
│  2. Update job status = "queued"        │
│  3. QStash calls /api/import/parse      │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  PARSE WORKER (/api/import/parse)       │
│                                         │
│  4. Download file from Storage (stream) │
│  5. Parse CSV/XLSX row by row           │
│  6. Validate each row                   │
│  7. Insert to import_rows in batches    │
│  8. Update progress every 1000 rows     │
│  9. If error: save checkpoint, retry    │
│  10. Generate validation summary        │
│  11. Update job status = "ready"        │
└─────────────────────────────────────────┘
       │
       ▼
User sees validation summary
  - Total: 50,000 rows
  - Valid: 48,500 rows
  - Invalid: 1,500 rows (download report)
       │
       ▼
User clicks "Importer 48,500 lignes"
```

### Phase 3: Commit & Finalize

```
┌─────────────────────────────────────────┐
│  1. Enqueue commit job to QStash        │
│  2. Update job status = "committing"    │
│  3. QStash calls /api/import/commit     │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  COMMIT WORKER (/api/import/commit)     │
│                                         │
│  4. Read valid rows from import_rows    │
│  5. Check duplicates (indexed queries)  │
│  6. Apply assignment logic              │
│  7. Batch insert to leads (500/batch)   │
│  8. Create lead_history events          │
│  9. Update import_rows.lead_id          │
│  10. Update progress every batch        │
│  11. If error: save checkpoint, retry   │
│  12. Generate error report if needed    │
│  13. Update job status = "completed"    │
└─────────────────────────────────────────┘
       │
       ▼
User sees completion summary
  - Imported: 47,200 leads
  - Skipped (duplicates): 1,300
  - Errors: 0
  - [Voir les leads importés]
```

---

## 6. Key Implementation Details

### 6.1 Upstash QStash Integration

**Why QStash?**
- HTTP-delivered jobs (works with Netlify Functions)
- Automatic retries with exponential backoff
- Dead letter queue for failed jobs
- No infrastructure to manage
- Free tier: 500 messages/day

**Setup:**
```typescript
// lib/queue/client.ts
import { Client } from '@upstash/qstash';

export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

// Enqueue a parse job
export async function enqueueParseJob(importJobId: string) {
  await qstash.publishJSON({
    url: `${process.env.APP_URL}/api/import/parse-worker`,
    body: { importJobId },
    retries: 3,
    headers: {
      'X-Import-Job-Id': importJobId,
    },
  });
}
```

**Webhook Handler:**
```typescript
// app/api/import/parse-worker/route.ts
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

export const POST = verifySignatureAppRouter(async (req: Request) => {
  const { importJobId } = await req.json();

  // Process the import (streaming)
  await processParseJob(importJobId);

  return Response.json({ success: true });
});

export const maxDuration = 300; // 5 minutes (Vercel Pro: up to 900)
```

### 6.2 Streaming CSV Parser

```typescript
// lib/parsers/csv-streamer.ts
import Papa from 'papaparse';
import { Readable } from 'stream';

interface StreamParseOptions {
  importJobId: string;
  signedUrl: string;
  mappings: ColumnMapping[];
  onProgress: (processed: number) => void;
  onChunk: (rows: ImportRow[]) => Promise<void>;
}

export async function streamParseCSV(options: StreamParseOptions) {
  const { signedUrl, mappings, onProgress, onChunk } = options;

  const response = await fetch(signedUrl);
  if (!response.body) throw new Error('No response body');

  return new Promise((resolve, reject) => {
    let chunk: ImportRow[] = [];
    let rowNumber = 0;
    const CHUNK_SIZE = 500;

    Papa.parse(Readable.fromWeb(response.body as ReadableStream), {
      header: true,
      skipEmptyLines: true,

      step: async (result, parser) => {
        rowNumber++;

        // Map and validate row
        const row = mapAndValidateRow(result.data, mappings, rowNumber);
        chunk.push(row);

        // Flush chunk when full
        if (chunk.length >= CHUNK_SIZE) {
          parser.pause();
          await onChunk(chunk);
          onProgress(rowNumber);
          chunk = [];
          parser.resume();
        }
      },

      complete: async () => {
        // Flush remaining rows
        if (chunk.length > 0) {
          await onChunk(chunk);
        }
        resolve({ totalRows: rowNumber });
      },

      error: (error) => reject(error),
    });
  });
}
```

### 6.3 Optimized Duplicate Detection

```typescript
// lib/processors/dedupe.ts
import { createClient } from '@/lib/supabase/server';

interface DedupeConfig {
  checkFields: ('email' | 'phone' | 'external_id')[];
  checkDatabase: boolean;
}

/**
 * Build a Set of existing values for fast O(1) lookup
 * Uses indexed queries - much faster than loading all leads
 */
export async function buildDedupeSet(config: DedupeConfig): Promise<Set<string>> {
  const supabase = await createClient();
  const dedupeSet = new Set<string>();

  if (!config.checkDatabase) return dedupeSet;

  for (const field of config.checkFields) {
    // Use cursor-based pagination for large datasets
    let cursor: string | null = null;
    const BATCH_SIZE = 10000;

    while (true) {
      let query = supabase
        .from('leads')
        .select('id, ' + field)
        .not(field, 'is', null)
        .order('id')
        .limit(BATCH_SIZE);

      if (cursor) {
        query = query.gt('id', cursor);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) break;

      for (const lead of data) {
        const value = (lead[field] as string)?.toLowerCase();
        if (value) {
          dedupeSet.add(`${field}:${value}`);
        }
      }

      cursor = data[data.length - 1].id;

      if (data.length < BATCH_SIZE) break;
    }
  }

  return dedupeSet;
}

/**
 * Check if a row is a duplicate
 */
export function isDuplicate(
  row: Record<string, string | null>,
  fields: string[],
  dedupeSet: Set<string>,
  fileSet: Set<string>
): { isDuplicate: boolean; field?: string } {
  for (const field of fields) {
    const value = row[field]?.toLowerCase();
    if (!value) continue;

    const key = `${field}:${value}`;

    if (dedupeSet.has(key)) {
      return { isDuplicate: true, field };
    }

    if (fileSet.has(key)) {
      return { isDuplicate: true, field };
    }
  }

  return { isDuplicate: false };
}
```

### 6.4 Checkpoint Recovery

```typescript
// lib/processors/parse-processor.ts

interface Checkpoint {
  chunkNumber: number;
  rowNumber: number;
  validCount: number;
  invalidCount: number;
}

export async function processParseJob(importJobId: string) {
  const supabase = await createAdminClient();

  // Get job with checkpoint
  const { data: job } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', importJobId)
    .single();

  if (!job) throw new Error('Job not found');

  // Resume from checkpoint if exists
  const checkpoint: Checkpoint = job.last_checkpoint
    ? JSON.parse(job.last_checkpoint)
    : { chunkNumber: 0, rowNumber: 0, validCount: 0, invalidCount: 0 };

  try {
    // Get signed URL for file
    const { data: urlData } = await supabase.storage
      .from('imports')
      .createSignedUrl(job.storage_path, 3600);

    if (!urlData?.signedUrl) throw new Error('Failed to get signed URL');

    // Stream parse with checkpointing
    await streamParseCSV({
      importJobId,
      signedUrl: urlData.signedUrl,
      mappings: job.column_mapping?.mappings || [],
      startRow: checkpoint.rowNumber,

      onChunk: async (rows, chunkNumber) => {
        // Insert rows
        await supabase.from('import_rows').insert(rows);

        // Save checkpoint
        await supabase
          .from('import_jobs')
          .update({
            last_checkpoint: JSON.stringify({
              chunkNumber,
              rowNumber: checkpoint.rowNumber + rows.length,
              validCount: checkpoint.validCount + rows.filter(r => r.status === 'valid').length,
              invalidCount: checkpoint.invalidCount + rows.filter(r => r.status === 'invalid').length,
            }),
            processed_rows: checkpoint.rowNumber + rows.length,
          })
          .eq('id', importJobId);

        checkpoint.rowNumber += rows.length;
      },
    });

    // Mark as ready
    await supabase
      .from('import_jobs')
      .update({
        status: 'ready',
        total_rows: checkpoint.rowNumber,
        valid_rows: checkpoint.validCount,
        invalid_rows: checkpoint.invalidCount,
      })
      .eq('id', importJobId);

  } catch (error) {
    // Checkpoint is saved, job can be retried
    await supabase
      .from('import_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', importJobId);

    throw error; // QStash will retry
  }
}
```

### 6.5 Error Report Generation

```typescript
// lib/processors/error-report.ts

export async function generateErrorReport(importJobId: string): Promise<string> {
  const supabase = await createAdminClient();

  // Get invalid rows
  const { data: rows } = await supabase
    .from('import_rows')
    .select('row_number, raw_data, validation_errors')
    .eq('import_job_id', importJobId)
    .eq('status', 'invalid')
    .order('row_number');

  if (!rows || rows.length === 0) return '';

  // Build CSV
  const headers = ['Ligne', 'Erreurs', ...Object.keys(rows[0].raw_data)];
  const csvRows = rows.map(row => [
    row.row_number,
    Object.values(row.validation_errors || {}).join('; '),
    ...Object.values(row.raw_data),
  ]);

  const csv = [
    headers.join(','),
    ...csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Upload to Storage
  const path = `error-reports/${importJobId}.csv`;
  await supabase.storage
    .from('imports')
    .upload(path, csv, {
      contentType: 'text/csv',
      upsert: true,
    });

  // Update job
  await supabase
    .from('import_jobs')
    .update({ error_report_path: path })
    .eq('id', importJobId);

  return path;
}
```

---

## 7. Environment Variables

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Server-side only

# New: Upstash QStash
QSTASH_TOKEN=qstash_xxx
QSTASH_CURRENT_SIGNING_KEY=sig_xxx
QSTASH_NEXT_SIGNING_KEY=sig_xxx

# App URL (for callbacks)
APP_URL=https://your-crm.netlify.app
```

---

## 8. UI/UX Improvements

### 8.1 New Progress Display

```tsx
// components/import-progress.tsx
export function ImportProgress({ job }: { job: ImportJob }) {
  const percentage = job.total_rows > 0
    ? Math.round((job.processed_rows / job.total_rows) * 100)
    : 0;

  const speed = calculateSpeed(job); // rows/second
  const eta = calculateETA(job);     // estimated time remaining

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="w-full bg-surface rounded-full h-3">
        <div
          className="bg-primary h-3 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-sm text-darklink">
        <span>{job.processed_rows.toLocaleString()} / {job.total_rows.toLocaleString()} lignes</span>
        <span>{speed.toLocaleString()} lignes/sec</span>
        <span>~{formatDuration(eta)} restant</span>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-2">
        <PhaseIndicator
          phase={job.status}
          phases={['queued', 'parsing', 'ready', 'committing', 'completed']}
        />
      </div>
    </div>
  );
}
```

### 8.2 Error Review Modal

```tsx
// components/error-report-modal.tsx
export function ErrorReportModal({ job, isOpen, onClose }: Props) {
  const [errors, setErrors] = useState<ImportRow[]>([]);
  const [downloading, setDownloading] = useState(false);

  // Load first 100 errors for preview
  useEffect(() => {
    if (isOpen && job.invalid_rows > 0) {
      loadErrors();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lignes invalides">
      <div className="space-y-4">
        <FormAlert
          type="warning"
          message={`${job.invalid_rows} lignes contiennent des erreurs et ne seront pas importées.`}
        />

        {/* Error preview table */}
        <div className="max-h-96 overflow-auto">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Ligne</th>
                <th>Erreur</th>
                <th>Données</th>
              </tr>
            </thead>
            <tbody>
              {errors.map(row => (
                <tr key={row.id}>
                  <td>{row.row_number}</td>
                  <td className="text-error">
                    {Object.values(row.validation_errors || {}).join(', ')}
                  </td>
                  <td className="text-xs">
                    {JSON.stringify(row.raw_data).slice(0, 100)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Download button */}
        <FormActions>
          <Button
            variant="secondary"
            onClick={handleDownload}
            loading={downloading}
          >
            <IconDownload size={18} />
            Télécharger le rapport complet (CSV)
          </Button>
        </FormActions>
      </div>
    </Modal>
  );
}
```

### 8.3 Import History Page

```tsx
// views/import-history-view.tsx
export function ImportHistoryView() {
  const { data: jobs, isLoading } = useImportHistory();

  return (
    <CardBox>
      <div className="flex justify-between items-center mb-4">
        <h4 className="card-title">Historique des imports</h4>
        <Link href="/import">
          <Button variant="primary">
            <IconUpload size={18} />
            Nouvel import
          </Button>
        </Link>
      </div>

      <table className="ui-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Fichier</th>
            <th>Statut</th>
            <th>Lignes</th>
            <th>Importées</th>
            <th>Erreurs</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs?.map(job => (
            <tr key={job.id}>
              <td>{formatDate(job.created_at)}</td>
              <td>{job.file_name}</td>
              <td><ImportStatusBadge status={job.status} /></td>
              <td>{job.total_rows?.toLocaleString()}</td>
              <td>{job.imported_rows?.toLocaleString()}</td>
              <td>
                {job.invalid_rows > 0 && (
                  <button
                    className="text-error underline"
                    onClick={() => downloadErrorReport(job.id)}
                  >
                    {job.invalid_rows}
                  </button>
                )}
              </td>
              <td>
                <JobActions job={job} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardBox>
  );
}
```

---

## 9. Migration Path

### Phase A: Foundation (Days 1-2)

1. **Database migration**: Add new columns, fix RLS policies
2. **Install dependencies**: @upstash/qstash, papaparse
3. **Set up QStash**: Create account, add environment variables
4. **Create queue utilities**: lib/queue/client.ts, verify.ts

### Phase B: Streaming Parser (Days 3-4)

1. **Implement streaming CSV parser**: lib/parsers/csv-streamer.ts
2. **Create parse worker API route**: app/api/import/parse-worker/route.ts
3. **Update actions to use QStash**: Start parse via queue
4. **Test with 50k row file**

### Phase C: Commit Worker (Days 5-6)

1. **Implement optimized dedupe**: Cursor pagination, indexed queries
2. **Create commit worker API route**: app/api/import/commit-worker/route.ts
3. **Add checkpoint recovery**: Resume from last batch
4. **Test full flow with 100k rows**

### Phase D: UI Polish (Days 7-8)

1. **Update wizard components**: New progress display
2. **Add error report modal**: Preview + download
3. **Add import history page**: /import/history
4. **Test error handling and retries**

### Phase E: Edge Cases (Day 9)

1. **XLSX streaming support** (optional)
2. **Cancel job functionality**
3. **Retry failed jobs from UI**
4. **Documentation and cleanup**

---

## 10. Performance Benchmarks (Expected)

| Scenario | Current System | New System |
|----------|----------------|------------|
| 1k rows | 5 sec | 3 sec |
| 10k rows | 50 sec | 15 sec |
| 50k rows | Timeout/Fail | 2 min |
| 100k rows | N/A | 4 min |
| 200k rows | N/A | 8 min |

**Key Metrics:**
- **Memory**: ~50MB per import → ~10MB per import (streaming)
- **Throughput**: ~2,000 rows/sec → ~8,000 rows/sec
- **Reliability**: ~70% success → ~99.9% success (with retries)

---

## 11. Fallback: External Worker

If Netlify Functions prove insufficient for very large files (>100k rows), we can add a dedicated worker:

**Option A: Vercel Functions + QStash (Recommended)**
- Works for up to ~100k rows with streaming + chunking
- 5-min timeout (Free) / 15-min timeout (Pro)
- QStash handles retries and chunked processing

**Option B: Fly.io Worker (For Extreme Scale)**
- No timeout limits
- Direct Postgres connection (COPY command)
- ~$5/month for always-on instance
- Best for 200k+ rows regularly

For most use cases, **Option A (Vercel + QStash)** is sufficient. The chunked processing with QStash means even 200k rows can be processed by splitting into 10k-row chunks, each processed in a separate function invocation.

---

## 12. Summary

### What We're Keeping
- Two-phase import architecture (parse → commit)
- Auto column mapping with French aliases
- Duplicate detection logic
- Assignment modes (single, round-robin, by_column)
- Audit trail with lead_history

### What We're Adding
- **Upstash QStash** for job queue with retries
- **Streaming parsers** for large files
- **Checkpoint recovery** for interrupted imports
- **Error report downloads** for invalid rows
- **Import history page** for tracking past imports
- **Better progress tracking** with ETA

### What We're Fixing
- RLS policies (use get_user_role())
- Memory issues (streaming vs load-all)
- Timeout issues (chunked processing)
- Duplicate detection performance (indexed queries)
- Error recovery (checkpoint + retry)

---

**Ready for implementation?** Start with Phase A: Database migration and QStash setup.
