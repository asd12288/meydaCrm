# NOWPayments Sandbox Setup Guide

## Overview

This guide walks you through setting up NOWPayments sandbox for testing crypto subscription payments. The webhook handler runs as a Next.js API route, accessible via your ngrok tunnel.

## Architecture

```
NOWPayments Sandbox → ngrok → Next.js API Route → Supabase Database
```

- **Webhook URL**: `https://sheep-wanted-squirrel.ngrok-free.app/api/webhooks/nowpayments`
- **Handler**: Next.js API route at `/api/webhooks/nowpayments`
- **Database**: Supabase (payments and subscriptions tables)

## Prerequisites

1. NOWPayments sandbox account
2. ngrok installed and configured with fixed domain
3. Next.js app running locally
4. Supabase project (production or local)

## Step-by-Step Setup

### Step 1: Create Sandbox Account

1. Visit [NOWPayments Sandbox](https://account-sandbox.nowpayments.io)
2. Sign up for a sandbox account
3. Verify your email (if required)
4. Log in to the dashboard

### Step 2: Generate API Key

1. Navigate to **Store Settings** → **API Keys**
2. Click **"Add new key"**
3. Copy the API key immediately (it's shown only once)
4. Save it securely - you'll need it for Supabase secrets

### Step 3: Generate IPN Secret

1. Navigate to **Store Settings** → **Instant Payment Notifications**
2. Click **"Regenerate"** to create a new IPN Secret Key
3. Copy the secret immediately (it's shown only once)
4. Save it securely - you'll need it for Next.js environment variables

### Step 4: Configure Webhook URL

1. In **Store Settings** → **Instant Payment Notifications**
2. Set **IPN Callback URL** to:
   ```
   https://sheep-wanted-squirrel.ngrok-free.app/api/webhooks/nowpayments
   ```
3. Click **"Save"**

**Important**: Make sure the URL is exactly correct, including the `/api/webhooks/nowpayments` path.

### Step 5: Configure Environment Variables

#### Next.js Environment Variables (`.env.local`)

Add these to your `.env.local` file:

```env
# NOWPayments IPN Secret (for webhook signature verification)
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here

# Supabase (for database access)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Note**: `SUPABASE_SERVICE_ROLE_KEY` is server-side only and should never be exposed to the client.

#### Additional Next.js Environment Variables

Add these to your `.env.local` file:

```env
# NOWPayments API Key (for creating payments)
NOWPAYMENTS_API_KEY=your_sandbox_api_key

# Enable sandbox mode
NOWPAYMENTS_SANDBOX=true

# App URL (for webhook and redirects) - optional, auto-detected in dev
APP_URL=https://sheep-wanted-squirrel.ngrok-free.app
```

**Note**: Both payment creation and webhook handling are Next.js API routes, so no Supabase Edge Function deployment needed!

### Step 7: Start Development Environment

1. **Start ngrok** (Terminal 1):
   ```bash
   npm run dev:webhook
   ```
   This starts ngrok with your fixed domain pointing to `localhost:3000`.

2. **Start Next.js** (Terminal 2):
   ```bash
   npm run dev
   ```
   This starts the Next.js dev server on `localhost:3000`.

3. **Verify ngrok is working**:
   - Check ngrok output for: `✅ ngrok tunnel is running!`
   - Verify URL: `https://sheep-wanted-squirrel.ngrok-free.app`

## Testing

### Test Payment Creation

1. Log in to your app as admin
2. Navigate to **Support** page
3. Select a plan (Standard or Pro)
4. Select a period (1, 3, or 12 months)
5. Click **"Payer avec USDT"**
6. You should be redirected to NOWPayments sandbox checkout page

### Test Webhook Processing

1. Complete a test payment in NOWPayments sandbox
2. Check Next.js console for webhook logs:
   - `Received IPN payload: {...}`
   - `Found payment: ...`
   - `Payment status updated to: finished`
   - `Subscription activated: ...`

3. Verify in database:
   ```sql
   -- Check payment status
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 1;
   
   -- Check subscription status
   SELECT * FROM subscriptions;
   ```

### Test Different Payment Scenarios

NOWPayments sandbox allows testing different payment outcomes. You can simulate:
- **Successful payment**: Complete the payment normally
- **Failed payment**: Cancel or let payment fail
- **Expired payment**: Let the payment timeout

## Troubleshooting

### Webhook Not Received

**Symptoms**: Payment created but status not updating

**Solutions**:
1. Verify ngrok is running: `npm run dev:webhook`
2. Verify Next.js is running: `npm run dev`
3. Check webhook URL in NOWPayments dashboard matches exactly:
   - Should be: `https://sheep-wanted-squirrel.ngrok-free.app/api/webhooks/nowpayments`
   - No trailing slash
   - Correct path: `/api/webhooks/nowpayments`

4. Test webhook URL manually:
   ```bash
   curl -X POST https://sheep-wanted-squirrel.ngrok-free.app/api/webhooks/nowpayments \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```
   Should return a response (even if error).

5. Check Next.js console for errors

### Signature Verification Fails

**Symptoms**: Webhook received but returns 401 error

**Solutions**:
1. Verify `NOWPAYMENTS_IPN_SECRET` in `.env.local` matches dashboard exactly
2. Check for extra spaces or newlines in the secret
3. Restart Next.js dev server after changing `.env.local`
4. Temporarily disable signature verification for testing (not recommended):
   - Remove `NOWPAYMENTS_IPN_SECRET` from `.env.local` (webhook will log warning but continue)

### Payment Not Found

**Symptoms**: Webhook logs "Payment not found"

**Solutions**:
1. Verify payment was created in database:
   ```sql
   SELECT * FROM payments ORDER BY created_at DESC;
   ```
2. Check `nowpayments_order_id` matches the order ID in webhook payload
3. Verify payment creation API route completed successfully

### Subscription Not Activating

**Symptoms**: Payment status updates but subscription stays pending

**Solutions**:
1. Check webhook logs for errors activating subscription
2. Verify payment status is `finished` (not just `confirmed`)
3. Check subscription exists and is linked to payment:
   ```sql
   SELECT p.*, s.* 
   FROM payments p 
   LEFT JOIN subscriptions s ON p.subscription_id = s.id 
   ORDER BY p.created_at DESC;
   ```

## Environment Variables Summary

### Required for Next.js (`.env.local`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `NOWPAYMENTS_IPN_SECRET` | Webhook signature verification | `abc123...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Database access (server-side) | `eyJ...` |

### Additional Next.js Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NOWPAYMENTS_API_KEY` | Create payments | `sandbox_key_...` |
| `NOWPAYMENTS_SANDBOX` | Enable sandbox mode | `true` |
| `APP_URL` | Base URL for webhooks/redirects (optional) | `https://sheep-wanted-squirrel.ngrok-free.app` |

## Production Deployment

When moving to production:

1. **Create production NOWPayments account** (not sandbox)
2. **Update Next.js environment variables** (Vercel/your hosting):
   - Set `NOWPAYMENTS_API_KEY` to production API key
   - Set `NOWPAYMENTS_IPN_SECRET` to production IPN secret
   - Remove or set `NOWPAYMENTS_SANDBOX=false`
   - Set `APP_URL` to production domain (optional, auto-detected on Vercel)

3. **Update webhook URL** in NOWPayments dashboard to production:
   ```
   https://your-production-domain.com/api/webhooks/nowpayments
   ```

4. **Deploy Next.js app** - Both payment creation and webhook routes deploy automatically with your app

**Note**: No Supabase Edge Functions needed - everything runs as Next.js API routes!

## Additional Resources

- [NOWPayments Sandbox Documentation](https://nowpayments.io/blog/how-to-use-the-sandbox-a-guide)
- [NOWPayments IPN Setup Guide](https://nowpayments.zendesk.com/hc/en-us/articles/21395546303389-IPN-and-how-to-setup)
- [NOWPayments API Documentation](https://documenter.getpostman.com/view/7907941/T1LJjU52)

## Support

If you encounter issues:

1. Check Next.js console logs
2. Check Next.js console/logs for API route errors
3. Verify all environment variables are set correctly
4. Test webhook URL manually with curl
5. Check database for payment and subscription records


