# Import System Troubleshooting

## Issue: "Ce job ne peut pas être relancé" Error

### Root Cause
The import jobs were created **before the new QStash-based system was deployed** and tried to call the old Supabase Edge Functions (`import-parse`, `import-commit`) which have been deleted.

### Symptoms
1. Jobs stuck in `validating` or `parsing` status
2. Error message: "Edge Function returned a non-2xx status code"
3. Cannot retry because status is not `failed`

### Solution Applied

#### Step 1: Fix Stuck Jobs ✅
Marked stuck jobs as `failed` so they can be retried:

```sql
UPDATE import_jobs
SET 
  status = 'failed',
  error_message = 'Migration vers nouveau système requis - relancez l''import'
WHERE 
  file_name = 'LEADCLIENT.csv'
  AND status IN ('validating', 'parsing')
  AND (error_message IS NULL OR error_message = '');
```

#### Step 2: Retry Import
Now that jobs are marked as `failed`, you can:

1. **Go to Import History**: Navigate to `/import/history`
2. **Find the failed import**: Look for LEADCLIENT.csv
3. **Click Retry button**: This will restart the import with the new QStash system

**OR**

1. **Start a fresh import**: Upload the file again
2. The new system will:
   - Use QStash workers instead of Edge Functions
   - Stream parse the file (210k rows)
   - Process in chunks with checkpoints
   - Support automatic retries

### Why This Happened

The old system used Supabase Edge Functions which we replaced with:
- ✅ **Next.js API Routes** (`/api/import/parse`, `/api/import/commit`)
- ✅ **QStash Queue** (for reliable job processing)
- ✅ **Streaming Parsers** (for large files)

Old jobs tried to call functions that no longer exist, causing failures.

### Prevention

Going forward:
- All new imports use the QStash system
- Jobs can be retried with automatic retry logic
- Checkpoints allow resuming from failures
- No more Edge Function dependencies

### For This Specific File (LEADCLIENT.csv)

File details:
- **Size**: 14.07 MB
- **Rows**: 210,202
- **Columns**: 20

Recommended approach:
1. **Start fresh import** (recommended)
2. System will stream parse in ~2-3 minutes
3. Configure assignment and duplicate handling
4. Import will complete in ~5-7 minutes total

**Important**: Make sure QStash environment variables are set in Vercel:
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`

### Current Status

✅ **Stuck jobs fixed** - Marked as failed
✅ **Retry now available** - Can retry from import history
✅ **New system ready** - QStash workers deployed
⚠️ **Need to retry or re-upload** - Choose one option above

---

**Next Steps**: Either retry the failed import or start a fresh upload of LEADCLIENT.csv
