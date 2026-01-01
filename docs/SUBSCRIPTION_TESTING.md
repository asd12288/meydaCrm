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

3. Run the database migration (if not already done):
   ```bash
   supabase db push
   # Or apply manually:
   # psql -f supabase/migrations/0004_subscription_system.sql
   ```

## Testing Workflow

### 1. Access Subscription Page

1. Log in as admin
2. Navigate to Subscription page (sidebar)
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

4. **Check Next.js console** for structured webhook logs:
   - `[WEBHOOK:NOWPAYMENTS_IPN] Webhook received`
   - `[WEBHOOK:NOWPAYMENTS_IPN] Payment found`
   - `[WEBHOOK:NOWPAYMENTS_IPN] Payment status updated`
   - `[WEBHOOK:NOWPAYMENTS_IPN] Subscription activated`

The webhook will:
- Update payment status in `payments` table
- Activate subscription when payment completes
- Set `start_date` and `end_date`
- For renewals: extend from current end_date (not from NOW)

### 5. Test Webhook Manually (NEW - Development Only)

Use the test endpoint to simulate webhooks without completing payments:

```bash
# Get usage instructions and list recent payments
curl http://localhost:3000/api/webhooks/nowpayments/test

# Simulate a successful payment (use order_id from list above)
curl -X POST http://localhost:3000/api/webhooks/nowpayments/test \
  -H "Content-Type: application/json" \
  -d '{"orderId": "crm-pay-xxx", "status": "finished"}'
```

**Available statuses:**
- `waiting` - Invoice created, waiting for payment
- `confirming` - Payment received, awaiting confirmations
- `confirmed` - Enough confirmations, processing
- `sending` - Sending to merchant
- `partially_paid` - Underpaid
- `finished` - Complete (activates subscription)
- `failed` - Payment failed
- `refunded` - Payment refunded
- `expired` - Invoice expired

**Note**: This endpoint is disabled in production.

### 6. Verify Subscription Activation

After successful payment:
1. Refresh Subscription page
2. Verify:
   - Status badge shows "Actif"
   - Start/end dates are correct
   - Days remaining shows correct count

### 7. Test Expiry Warning

To test the warning banner:
1. Manually update subscription `end_date` in database to 5 days from now
2. Refresh any protected page
3. Verify: Yellow warning banner appears at top

```sql
UPDATE subscriptions
SET end_date = NOW() + INTERVAL '5 days'
WHERE id = 'your-subscription-id';
```

**Banner behavior:**
- Can be dismissed (persists for 24 hours via localStorage)
- Reappears each day
- Cannot be dismissed during grace period (too important)

### 8. Test Grace Period

To test the grace period (7 days after expiry):
1. Set subscription to just expired:
   ```sql
   UPDATE subscriptions
   SET status = 'active', end_date = NOW() - INTERVAL '1 day'
   WHERE id = 'your-subscription-id';
   ```
2. Navigate to any page - subscription should transition to `grace`
3. Verify: Red warning banner appears (cannot be dismissed)
4. User can still access CRM during grace period

### 9. Test Subscription Blocking

To test the blocked modal:
1. Set subscription status to 'expired':
   ```sql
   UPDATE subscriptions
   SET status = 'expired', end_date = NOW() - INTERVAL '10 days'
   WHERE id = 'your-subscription-id';
   ```
2. Navigate to any page except /subscription
3. Verify: Modal appears with "Abonnement expire" message

### 10. Test Renewal Extension

To verify renewals extend from existing end date:
1. Set subscription to active with future end date:
   ```sql
   UPDATE subscriptions
   SET status = 'active', end_date = NOW() + INTERVAL '7 days'
   WHERE id = 'your-subscription-id';
   ```
2. Create a new payment and simulate completion:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/nowpayments/test \
     -H "Content-Type: application/json" \
     -d '{"orderId": "crm-pay-xxx", "status": "finished"}'
   ```
3. Verify: New end_date = old end_date + period (not NOW + period)

## Database Verification

Check subscription status:
```sql
SELECT * FROM subscriptions;
```

Check payment history:
```sql
SELECT * FROM payments ORDER BY created_at DESC;
```

Check notification deduplication (should see max 1 per 12 hours):
```sql
SELECT type, COUNT(*), MAX(created_at)
FROM notifications
WHERE type = 'subscription_warning'
GROUP BY type;
```

## Troubleshooting

### Payment not created
- Check browser console for detailed error messages
- Check Next.js console/logs for API route errors
- Verify `NOWPAYMENTS_API_KEY` is set in `.env.local`
- Verify user is authenticated and is admin

### Webhook not processing
- Check Next.js console for `[WEBHOOK:*]` structured logs
- Verify ngrok is running: `npm run dev:webhook`
- Verify Next.js is running: `npm run dev`
- Verify webhook URL in NOWPayments dashboard
- Use test endpoint for debugging: `GET /api/webhooks/nowpayments/test`

### Subscription not activating
- Check webhook logs for errors
- Verify payment record exists in database
- Check `nowpayments_payment_id` or `nowpayments_order_id` matches
- Use test endpoint to simulate: `POST /api/webhooks/nowpayments/test`

### Duplicate notifications
- Notifications are deduplicated with 12-hour window
- Check `notifications` table for duplicates
- If duplicates exist, clean up manually:
  ```sql
  DELETE FROM notifications WHERE type = 'subscription_warning';
  ```

## Production Deployment

1. Create production NOWPayments account (not sandbox)

2. Update Vercel environment variables:
   - `NOWPAYMENTS_API_KEY` = production API key
   - `NOWPAYMENTS_IPN_SECRET` = production IPN secret
   - Remove `NOWPAYMENTS_SANDBOX` or set to `false`
   - `APP_URL` = production domain (optional, auto-detected on Vercel)

3. Update webhook URL in NOWPayments dashboard:
   ```
   https://your-production-url.com/api/webhooks/nowpayments
   ```

4. Deploy Next.js app - Both payment creation and webhook routes deploy automatically

5. Verify test endpoint is disabled:
   ```bash
   curl https://your-production-url.com/api/webhooks/nowpayments/test
   # Should return: {"error":"Test endpoint disabled in production"}
   ```

**Note**: Everything runs as Next.js API routes - no Supabase Edge Functions needed!


