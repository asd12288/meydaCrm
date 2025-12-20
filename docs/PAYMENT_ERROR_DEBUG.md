# Debugging Payment Creation Error

## Error Message
"Erreur lors de la creation du paiement"

## Quick Checks

### 1. Check Browser Console
Open browser DevTools (F12) → Console tab and look for:
- Detailed error messages
- Network request failures
- Status codes (401, 403, 500, etc.)

### 2. Check Next.js Console/Logs

Look for errors in:
- Browser console (F12 → Console)
- Next.js dev server terminal output
- Vercel logs (if deployed)

Look for:
- "NOWPAYMENTS_API_KEY not configured"
- "NOWPayments error: ..."
- Database errors
- Authentication errors

### 3. Verify Environment Variables (Next.js `.env.local`)

Check your `.env.local` file for required variables:

Required variables:
- `NOWPAYMENTS_API_KEY` - Your sandbox API key
- `NOWPAYMENTS_IPN_SECRET` - Your IPN secret
- `NOWPAYMENTS_SANDBOX` - Should be `true` for sandbox
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `APP_URL` - Your app URL (optional, auto-detected in dev)

Add missing variables to `.env.local`:
```env
NOWPAYMENTS_API_KEY=your_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret
NOWPAYMENTS_SANDBOX=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_URL=https://sheep-wanted-squirrel.ngrok-free.app
```

**Important**: Restart Next.js dev server after changing `.env.local`

### 5. Verify NOWPayments API Key

1. Go to [NOWPayments Sandbox Dashboard](https://account-sandbox.nowpayments.io)
2. Navigate to Store Settings → API Keys
3. Verify the API key matches what you set in Supabase secrets
4. Make sure you're using the **sandbox** API key, not production

### 6. Check Database Tables Exist

Verify the subscription system migration was applied:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'payments');

-- Should return both 'subscriptions' and 'payments'
```

If tables don't exist, run migration:
```bash
supabase db push
```

## Common Error Causes

### Error: "Configuration de paiement manquante"
**Cause**: `NOWPAYMENTS_API_KEY` not set in Supabase secrets
**Fix**: 
```bash
supabase secrets set NOWPAYMENTS_API_KEY=your_sandbox_api_key
```

### Error: "Non authentifie" or "Token invalide"
**Cause**: Session expired or invalid
**Fix**: Log out and log back in

### Error: "Acces non autorise"
**Cause**: User is not admin
**Fix**: Verify user role is `admin` in profiles table

### Error: "Erreur lors de la creation de la facture"
**Cause**: NOWPayments API error
**Check**:
1. API key is correct
2. Sandbox mode is enabled (`NOWPAYMENTS_SANDBOX=true`)
3. Check Edge Function logs for NOWPayments error details

### Error: Database errors
**Cause**: Tables don't exist or RLS policies blocking
**Fix**: 
1. Run migration: `supabase db push`
2. Check RLS policies are correct

## Testing the API Route Manually

Test the Next.js API route directly with curl:

```bash
# Make sure you're logged in and have session cookies
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookies" \
  -d '{"plan": "standard", "period": "1_month"}'
```

Or test via ngrok:
```bash
curl -X POST https://sheep-wanted-squirrel.ngrok-free.app/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookies" \
  -d '{"plan": "standard", "period": "1_month"}'
```

## Next Steps

1. Check browser console for the improved error message
2. Check Next.js console/logs
3. Verify all environment variables are set in `.env.local`
4. Restart Next.js dev server if you changed `.env.local`
5. Try creating payment again
6. If still failing, share the error message from browser console or Next.js logs
