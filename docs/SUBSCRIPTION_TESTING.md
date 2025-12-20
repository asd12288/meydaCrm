# Subscription System Testing Guide

## Overview

This guide explains how to test the crypto subscription payment system using NOWPayments sandbox.

**For complete setup instructions, see [NOWPayments Sandbox Setup Guide](./NOWPAYMENTS_SANDBOX_SETUP.md)**

## Prerequisites

1. NOWPayments Sandbox Account
   - Create account at: https://account-sandbox.nowpayments.io
   - Generate API Key from Store Settings
   - Generate IPN Secret Key (save it - shown only once!)

2. Configure Next.js environment variables (`.env.local`):
   ```env
   # NOWPayments
   NOWPAYMENTS_API_KEY=your_sandbox_api_key
   NOWPAYMENTS_IPN_SECRET=your_ipn_secret
   NOWPAYMENTS_SANDBOX=true
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Optional - auto-detected in dev
   APP_URL=https://sheep-wanted-squirrel.ngrok-free.app
   ```

   **Note**: Both payment creation and webhook handling are Next.js API routes, so no Supabase Edge Function deployment needed!

5. Run the database migration (if not already done):
   ```bash
   supabase db push
   # Or apply manually:
   # psql -f supabase/migrations/0004_subscription_system.sql
   ```

## Testing Workflow

### 1. Access Support Page

1. Log in as admin
2. Navigate to Support page (sidebar)
3. Verify:
   - "Aucun abonnement actif" message displays
   - Plan cards show correct pricing
   - Period selector works

### 2. Test Payment Creation

1. Select a plan (Standard or Pro)
2. Select a period (1, 3, or 12 months)
3. Click "Payer avec USDT"
4. Verify:
   - Loading spinner appears
   - You're redirected to NOWPayments checkout page

### 3. Test NOWPayments Sandbox

In sandbox mode, you can simulate different payment outcomes:

1. **Successful Payment**: Complete the payment on NOWPayments
2. **Cancelled Payment**: Click cancel on NOWPayments page
3. **Expired Payment**: Let the payment timeout

### 4. Test Webhook Processing

The webhook handler is a Next.js API route accessible via your ngrok tunnel.

1. **Start ngrok** (if not already running):
   ```bash
   npm run dev:webhook
   ```

2. **Start Next.js** (if not already running):
   ```bash
   npm run dev
   ```

3. **Verify webhook URL** in NOWPayments dashboard:
   - Should be: `https://sheep-wanted-squirrel.ngrok-free.app/api/webhooks/nowpayments`

4. **Check Next.js console** for webhook logs when payment status changes:
   - `Received IPN payload: {...}`
   - `Found payment: ...`
   - `Payment status updated to: finished`
   - `Subscription activated: ...`

The webhook will:
- Update payment status in `payments` table
- Activate subscription when payment completes
- Set `start_date` and `end_date`

### 5. Verify Subscription Activation

After successful payment:
1. Refresh Support page
2. Verify:
   - Status badge shows "Actif"
   - Start/end dates are correct
   - Days remaining shows correct count

### 6. Test Expiry Warning

To test the warning banner:
1. Manually update subscription `end_date` in database to 5 days from now
2. Refresh any protected page
3. Verify: Yellow warning banner appears at top

```sql
UPDATE subscriptions
SET end_date = NOW() + INTERVAL '5 days'
WHERE id = 'your-subscription-id';
```

### 7. Test Subscription Blocking

To test the blocked modal:
1. Manually set subscription status to 'expired' or set `end_date` to past
2. Navigate to any page except /support
3. Verify: Modal appears with "Abonnement expire" message

```sql
UPDATE subscriptions
SET status = 'expired', end_date = NOW() - INTERVAL '1 day'
WHERE id = 'your-subscription-id';
```

## Database Verification

Check subscription status:
```sql
SELECT * FROM subscriptions;
```

Check payment history:
```sql
SELECT * FROM payments ORDER BY created_at DESC;
```

## Webhook Testing with cURL

Test the Next.js webhook endpoint manually:

```bash
curl -X POST https://sheep-wanted-squirrel.ngrok-free.app/api/webhooks/nowpayments \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: your_signature_here" \
  -d '{
    "payment_id": "123456",
    "payment_status": "finished",
    "order_id": "crm-pay-xxx",
    "price_amount": 99,
    "price_currency": "usd",
    "pay_amount": 99,
    "pay_currency": "usdttrc20"
  }'
```

**Note**: For testing without signature verification, temporarily remove `NOWPAYMENTS_IPN_SECRET` from `.env.local` (not recommended for production).

## Troubleshooting

### Payment not created
- Check browser console for detailed error messages
- Check Next.js console/logs for API route errors
- Verify `NOWPAYMENTS_API_KEY` is set in `.env.local`
- Verify user is authenticated and is admin

### Webhook not processing
- Check Next.js console for webhook logs
- Verify ngrok is running: `npm run dev:webhook`
- Verify Next.js is running: `npm run dev`
- Verify webhook URL in NOWPayments dashboard: `https://sheep-wanted-squirrel.ngrok-free.app/api/webhooks/nowpayments`
- Test webhook URL manually with curl (see above)
- Check signature verification (temporarily remove `NOWPAYMENTS_IPN_SECRET` from `.env.local` for testing)

### Subscription not activating
- Check webhook logs for errors
- Verify payment record exists in database
- Check `nowpayments_payment_id` matches

## Production Deployment

1. Create production NOWPayments account
2. Update Next.js environment variables (Vercel/your hosting):
   - Set `NOWPAYMENTS_IPN_SECRET` to production IPN secret
   - Update other environment variables as needed

3. Update Next.js environment variables (Vercel/your hosting):
   - Set `NOWPAYMENTS_API_KEY` to production API key
   - Set `NOWPAYMENTS_IPN_SECRET` to production IPN secret
   - Remove or set `NOWPAYMENTS_SANDBOX=false`
   - Set `APP_URL` to production domain (optional, auto-detected on Vercel)

4. Update webhook URL in NOWPayments dashboard to production:
   ```
   https://your-production-url.com/api/webhooks/nowpayments
   ```

5. Deploy Next.js app - Both payment creation and webhook routes deploy automatically

**Note**: Everything runs as Next.js API routes - no Supabase Edge Functions needed!
