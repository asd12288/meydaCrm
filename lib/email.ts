/**
 * Email notification utilities for developers
 * Uses Resend for sending emails
 * 
 * IMPORTANT: Email addresses are NEVER exposed to users.
 * DEVELOPER_NOTIFICATION_EMAIL is server-side only.
 * 
 * @see https://resend.com/docs
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Get the app URL for ticket links
 */
function getAppUrl(): string {
  return process.env.APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
}

/**
 * Send an email notification
 * Returns success/failure without throwing errors (fails silently)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@crm.local';

  // Fail silently if Resend is not configured
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Failed to send:', error);
      return false;
    }

    const data = await response.json();
    console.log('[Email] Sent successfully:', data.id);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

/**
 * Send ticket creation notification to developer
 */
export async function sendTicketCreatedEmail(
  ticket: {
    id: string;
    subject: string;
    category: string;
    description: string;
    createdBy: string;
  }
): Promise<boolean> {
  const developerEmail = process.env.DEVELOPER_NOTIFICATION_EMAIL;

  if (!developerEmail) {
    console.warn('[Email] DEVELOPER_NOTIFICATION_EMAIL not configured');
    return false;
  }

  const categoryLabels: Record<string, string> = {
    bug: 'Bug',
    feature: 'Fonctionnalité',
    payment_issue: 'Problème de paiement',
    feedback: 'Retour',
  };

  const ticketUrl = `${getAppUrl()}/support?ticket=${ticket.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #18181b; padding: 24px 32px;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                      Nouveau ticket
                    </h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <!-- Category & Subject -->
                    <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                      ${categoryLabels[ticket.category] || ticket.category}
                    </p>
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                      ${escapeHtml(ticket.subject)}
                    </h2>
                    
                    <!-- Description -->
                    <div style="padding: 16px; background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                      <p style="margin: 0; font-size: 14px; color: #3f3f46; white-space: pre-wrap; line-height: 1.5;">
                        ${escapeHtml(ticket.description)}
                      </p>
                    </div>
                    
                    <!-- Meta -->
                    <p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a;">
                      Créé par <strong style="color: #18181b;">${escapeHtml(ticket.createdBy)}</strong>
                    </p>
                    
                    <!-- CTA Button -->
                    <a href="${ticketUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
                      Voir le ticket
                    </a>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 16px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                      CRM Support • Notification automatique
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: developerEmail,
    subject: `[Support] ${ticket.subject}`,
    html,
  });
}

/**
 * Send ticket comment notification to developer
 */
export async function sendTicketCommentEmail(
  ticket: {
    id: string;
    subject: string;
  },
  comment: {
    body: string;
    authorName: string;
  }
): Promise<boolean> {
  const developerEmail = process.env.DEVELOPER_NOTIFICATION_EMAIL;

  if (!developerEmail) {
    console.warn('[Email] DEVELOPER_NOTIFICATION_EMAIL not configured');
    return false;
  }

  const ticketUrl = `${getAppUrl()}/support?ticket=${ticket.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #18181b; padding: 24px 32px;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                      Nouveau message
                    </h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <!-- Ticket Subject -->
                    <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">
                      Re: ${escapeHtml(ticket.subject)}
                    </p>
                    
                    <!-- Author -->
                    <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b;">
                      <strong>${escapeHtml(comment.authorName)}</strong> a écrit:
                    </p>
                    
                    <!-- Comment Body -->
                    <div style="padding: 16px; background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px; border-left: 3px solid #18181b;">
                      <p style="margin: 0; font-size: 14px; color: #3f3f46; white-space: pre-wrap; line-height: 1.5;">
                        ${escapeHtml(comment.body)}
                      </p>
                    </div>
                    
                    <!-- CTA Button -->
                    <a href="${ticketUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
                      Répondre
                    </a>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 16px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                      CRM Support • Notification automatique
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: developerEmail,
    subject: `[Support] Re: ${ticket.subject}`,
    html,
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
