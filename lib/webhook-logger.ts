/**
 * Structured Webhook Logger
 *
 * Provides structured logging for webhook handlers to make debugging easier.
 * Outputs JSON-formatted logs that can be parsed by log aggregation tools.
 */

export type WebhookLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface WebhookLogEntry {
  timestamp: string;
  level: WebhookLogLevel;
  event: string;
  paymentId?: string | null;
  orderId?: string | null;
  status?: string | null;
  message: string;
  details?: Record<string, unknown>;
  durationMs?: number;
}

/**
 * Log a webhook event with structured data
 */
export function logWebhook(
  entry: Omit<WebhookLogEntry, 'timestamp'>
): WebhookLogEntry {
  const fullEntry: WebhookLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Create a prefix for easy filtering in logs
  const prefix = `[WEBHOOK:${entry.event}]`;
  const msg = `${prefix} ${entry.message}`;

  // Build log object for structured output
  const logData = {
    ...fullEntry,
    // Remove redundant fields from details if they're already top-level
    details: fullEntry.details,
  };

  switch (entry.level) {
    case 'error':
      console.error(msg, JSON.stringify(logData));
      break;
    case 'warn':
      console.warn(msg, JSON.stringify(logData));
      break;
    case 'debug':
      // Only log debug in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(msg, JSON.stringify(logData));
      }
      break;
    default:
      console.log(msg, JSON.stringify(logData));
  }

  return fullEntry;
}

/**
 * Create a webhook logger instance for a specific request
 * Tracks timing and provides convenience methods
 */
export function createWebhookLogger(event: string) {
  const startTime = Date.now();
  let paymentId: string | null = null;
  let orderId: string | null = null;

  return {
    setPaymentId(id: string | null) {
      paymentId = id;
    },
    setOrderId(id: string | null) {
      orderId = id;
    },
    debug(message: string, details?: Record<string, unknown>) {
      return logWebhook({
        level: 'debug',
        event,
        paymentId,
        orderId,
        message,
        details,
      });
    },
    info(message: string, details?: Record<string, unknown>) {
      return logWebhook({
        level: 'info',
        event,
        paymentId,
        orderId,
        message,
        details,
      });
    },
    warn(message: string, details?: Record<string, unknown>) {
      return logWebhook({
        level: 'warn',
        event,
        paymentId,
        orderId,
        message,
        details,
      });
    },
    error(message: string, details?: Record<string, unknown>) {
      return logWebhook({
        level: 'error',
        event,
        paymentId,
        orderId,
        message,
        details,
      });
    },
    /**
     * Log completion with duration
     */
    complete(message: string, status?: string, details?: Record<string, unknown>) {
      const durationMs = Date.now() - startTime;
      return logWebhook({
        level: 'info',
        event,
        paymentId,
        orderId,
        status,
        message,
        durationMs,
        details,
      });
    },
    /**
     * Log failure with duration
     */
    fail(message: string, details?: Record<string, unknown>) {
      const durationMs = Date.now() - startTime;
      return logWebhook({
        level: 'error',
        event,
        paymentId,
        orderId,
        message,
        durationMs,
        details,
      });
    },
  };
}

/**
 * Webhook event types for consistency
 */
export const WEBHOOK_EVENTS = {
  RECEIVED: 'RECEIVED',
  SIGNATURE_VERIFIED: 'SIGNATURE_VERIFIED',
  SIGNATURE_FAILED: 'SIGNATURE_FAILED',
  PAYMENT_FOUND: 'PAYMENT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  STATUS_UPDATED: 'STATUS_UPDATED',
  SUBSCRIPTION_ACTIVATED: 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_RENEWED: 'SUBSCRIPTION_RENEWED',
  ALREADY_PROCESSED: 'ALREADY_PROCESSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
