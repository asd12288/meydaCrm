# Email Notifications Setup

This document explains how to set up email notifications for the support ticket system.

## Overview

The system sends email notifications to **developers** when:
- A new support ticket is created by an admin
- A new comment/reply is added to a ticket

These emails are **never visible to app users**. The developer email is stored server-side only and allows developers to know when they need to log in and respond to tickets.

Emails are sent using [Resend](https://resend.com), a modern email API service.

## How It Works

```
Admin creates ticket → Email sent to developer → Developer logs in to respond
Admin adds comment  → Email sent to developer → Developer sees notification
```

The email includes:
- Ticket subject and category
- Message content
- **Direct link** to view/respond to the ticket

## Setup Steps

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your account

### 2. Get Your API Key

1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name (e.g., "CRM Notifications")
4. Copy the API key (starts with `re_`)

### 3. Add Domain (Optional but Recommended)

For production, you should add your own domain:
1. Go to [Resend Domains](https://resend.com/domains)
2. Add your domain
3. Follow DNS verification steps
4. Use your domain email as `RESEND_FROM_EMAIL`

For development/testing, you can use Resend's test domain.

### 4. Configure Environment Variables

Add these to your `.env.local` file (and Vercel environment variables for production):

```bash
# Resend API Key (required)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Developer email for ticket notifications (required)
# This email will receive all support ticket notifications
# IMPORTANT: This is NEVER exposed to users
DEVELOPER_NOTIFICATION_EMAIL=developer@company.com

# From email address (optional, defaults to noreply@crm.local)
# For production, use your verified domain: notifications@yourdomain.com
RESEND_FROM_EMAIL=notifications@yourdomain.com

# App URL for ticket links (optional, auto-detected on Vercel)
APP_URL=https://your-app.vercel.app
```

### 5. Deploy to Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - `RESEND_API_KEY` (required)
   - `DEVELOPER_NOTIFICATION_EMAIL` (required)
   - `RESEND_FROM_EMAIL` (optional)
   - `APP_URL` (optional, auto-detected from `VERCEL_URL`)

### 6. Test

1. Create a new support ticket in the app
2. Check the developer email inbox
3. Click the "Voir le ticket" button in the email
4. Add a comment to a ticket
5. Check for the comment notification email

## Email Templates

### New Ticket Email

When a new ticket is created, the email includes:
- Category (Bug, Feature, Payment, etc.)
- Subject
- Full description
- Creator name
- **"Voir le ticket" button** linking directly to the ticket

### New Comment Email

When a comment is added, the email includes:
- Ticket subject (as reply reference)
- Author name
- Comment content
- **"Répondre" button** linking directly to the ticket

## Email Behavior

- **Fails Silently**: If email sending fails, the system logs a warning but doesn't block ticket/comment creation
- **Non-Blocking**: Email sending happens asynchronously
- **Direct Links**: Each email includes a clickable button to view the ticket
- **Clean Design**: Minimal, professional email templates

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**: Ensure `RESEND_API_KEY` and `DEVELOPER_NOTIFICATION_EMAIL` are set
2. **Check Resend Dashboard**: Go to [Resend Logs](https://resend.com/emails) to see delivery status
3. **Check Server Logs**: Look for `[Email]` prefixed logs
4. **Verify API Key**: Make sure your API key is valid

### Links Not Working

1. **Check APP_URL**: Ensure `APP_URL` or `VERCEL_URL` is correctly set
2. **Verify Deployment**: The app must be deployed for links to work

### Emails Going to Spam

1. **Add SPF/DKIM Records**: If using your own domain, configure DNS properly
2. **Use Verified Domain**: Resend requires domain verification for production
3. **Check Spam Folder**: Initial emails may be filtered

## Security

**Important**: The developer email address is **never exposed** to users:

- Stored only in server-side environment variables
- Never sent to the client/browser
- Only used in server actions (`lib/email.ts`)
- No API endpoint exposes this value

Users only see the ticket interface. They have no way to know or access the notification email address.

## Alternative Email Services

If you prefer a different email service, modify `lib/email.ts`:

- **SendGrid**: Similar API, replace fetch URL and headers
- **AWS SES**: Use AWS SDK instead of fetch
- **Nodemailer**: For SMTP-based sending

The email utility functions are designed to be easily replaceable.
