/**
 * QStash Client
 *
 * Upstash QStash is an HTTP-based job queue that provides:
 * - Automatic retries with exponential backoff
 * - Dead letter queue for failed jobs
 * - Webhook-based delivery (works with Vercel Functions)
 * - No infrastructure to manage
 *
 * @see https://upstash.com/docs/qstash/overall/getstarted
 */

import { Client } from '@upstash/qstash';

// Singleton client instance
let qstashClient: Client | null = null;

/**
 * Get or create the QStash client
 * Lazily initialized to avoid issues during build
 */
export function getQStashClient(): Client {
  if (!qstashClient) {
    const token = process.env.QSTASH_TOKEN;

    if (!token) {
      throw new Error(
        'QSTASH_TOKEN environment variable is not set. ' +
          'Get your token from https://console.upstash.com/qstash'
      );
    }

    qstashClient = new Client({ token });
  }

  return qstashClient;
}

/**
 * Get the base URL for the application
 * Used for QStash callback URLs
 */
export function getAppUrl(): string {
  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Explicit APP_URL (recommended for production)
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  // Next.js public URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Development mode: use ngrok domain for webhook callbacks
  if (process.env.NODE_ENV === 'development') {
    return 'https://sheep-wanted-squirrel.ngrok-free.app';
  }

  // Local development fallback
  return 'http://localhost:3000';
}

// Export the client type for type inference
export type { Client };
