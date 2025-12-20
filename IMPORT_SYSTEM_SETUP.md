# Import System Setup & Configuration

## 🔴 Critical Issue Identified

**Error**: `invalid destination url: endpoint resolves to a loopback address: ::1`

**Root Cause**: QStash cannot call `localhost` - it needs a **publicly accessible URL**.

---

## Why Retries Failed

1. ✅ **Old jobs were stuck** → Fixed by marking as `failed`
2. ✅ **Retry logic was too strict** → Fixed to allow stuck states
3. ⚠️ **APP_URL points to localhost** → QStash cannot reach it

### Error Progression

```
First attempts → Edge Function errors (old system)
     ↓
Stuck in "validating"/"parsing" states
     ↓
Fixed to "failed" status
     ↓
Retry attempted → QStash called localhost
     ↓
QStash error: "loopback address" ❌
```

---

## Solutions

### Option 1: Deploy to Vercel (Recommended for Production)

1. **Deploy the app to Vercel**:
   ```bash
   npm run build
   vercel --prod
   ```

2. **Set environment variables in Vercel dashboard**:
   ```
   QSTASH_TOKEN=your_token_here
   QSTASH_CURRENT_SIGNING_KEY=sig_xxx
   QSTASH_NEXT_SIGNING_KEY=sig_xxx
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

3. **Retry the import** on deployed app

4. **Vercel will auto-detect** `VERCEL_URL` → QStash can reach it

---

### Option 2: Local Development with ngrok/cloudflare tunnel

For testing locally with QStash:

1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   ```

2. **Start your dev server**:
   ```bash
   npm run dev
   ```

3. **Create tunnel** (in another terminal):
   ```bash
   ngrok http 3000
   ```

4. **Set environment variable**:
   ```bash
   # In .env.local
   APP_URL=https://your-ngrok-url.ngrok-free.app
   ```

5. **Restart dev server** and retry import

---

### Option 3: Direct API Route Testing (Local Development)

For **local testing without QStash**, temporarily bypass the queue:

**Create**: `app/api/import/test-parse/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleParse } from '../parse/route';

export const maxDuration = 300;

// Direct call without QStash (for local testing)
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    const result = await handleParse(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Update** `startImportParsing()` for local mode:

```typescript
// In modules/import/lib/actions.ts
export async function startImportParsing(importJobId: string) {
  const isLocal = process.env.NODE_ENV === 'development' && !process.env.APP_URL;
  
  if (isLocal) {
    // Direct API call for local testing
    const response = await fetch('/api/import/test-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importJobId }),
    });
    
    const result = await response.json();
    return { success: true, data: { messageId: 'local-test' } };
  }
  
  // Normal QStash flow
  const messageId = await enqueueParseJob({ importJobId });
  return { success: true, data: { messageId } };
}
```

---

## Current State of Your Jobs

```
Job ID: 76c0c0cc-a550-480d-811f-a835a3ea44b3
Status: failed
Reason: Migration required (stuck in validating)
Can retry: ✅ YES (after fix)

Job ID: 1e989108-1b7d-4c37-8611-4547840893c7  
Status: failed
Rows parsed: 210,202 total (40,285 valid, 215 invalid)
Reason: Migration required (stuck in parsing)
Can retry: ✅ YES (for commit phase only)

Job ID: d2ab1a27-b0fe-4e82-9fb2-61f0e309d256
Status: failed  
Rows parsed: 210,202 total (208,840 valid, 1,362 invalid)
Reason: Edge Function error
Can retry: ✅ YES
```

---

## Recommended Next Steps

### For Production (Best)

1. ✅ **Deploy to Vercel**
2. ✅ **Set QStash environment variables** in Vercel dashboard
3. ✅ **Upload LEADCLIENT.csv** via deployed app
4. ✅ **System will handle** 210k rows automatically

### For Local Development (Testing)

1. ✅ **Use ngrok tunnel** (see Option 2 above)
2. ✅ **Set APP_URL** to ngrok URL
3. ✅ **Restart dev server**
4. ✅ **Retry import**

---

## QStash Environment Variables

Get these from https://console.upstash.com/qstash:

```env
QSTASH_TOKEN=qstash_...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...
```

---

## What's Fixed

✅ Database migration applied (all V2 columns added)
✅ Stuck jobs marked as `failed` 
✅ Retry logic updated to handle stuck states
✅ TypeScript compilation passes
✅ All API routes created
✅ Error reporting system ready
✅ Import history page ready

## What's Needed

⚠️ **QStash environment variables** must be set
⚠️ **APP_URL must be publicly accessible** (not localhost)

---

**Status**: System is ready, but needs public URL configuration for QStash webhooks.
