/**
 * QStash Signature Verification
 *
 * Verifies that incoming webhook requests are from QStash.
 * This prevents unauthorized calls to your worker endpoints.
 *
 * @see https://upstash.com/docs/qstash/features/security
 */

import { Receiver } from '@upstash/qstash';

// Singleton receiver instance
let receiver: Receiver | null = null;

/**
 * Get or create the QStash receiver for signature verification
 */
function getReceiver(): Receiver {
  if (!receiver) {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (!currentSigningKey || !nextSigningKey) {
      throw new Error(
        'QStash signing keys are not set. ' +
          'Set QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY. ' +
          'Get them from https://console.upstash.com/qstash'
      );
    }

    receiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });
  }

  return receiver;
}

/**
 * Verify a QStash webhook request
 *
 * @param request - The incoming request
 * @returns The verified request body, or throws if invalid
 */
export async function verifyQStashSignature<T = unknown>(
  request: Request
): Promise<T> {
  const signature = request.headers.get('Upstash-Signature');

  if (!signature) {
    throw new Error('Missing Upstash-Signature header');
  }

  const body = await request.text();

  const isValid = await getReceiver().verify({
    signature,
    body,
  });

  if (!isValid) {
    throw new Error('Invalid QStash signature');
  }

  return JSON.parse(body) as T;
}

/**
 * Create a verified handler for QStash webhooks
 *
 * SECURITY: Always verifies HMAC signature from QStash.
 * For local development, use ngrok to receive real QStash webhooks.
 *
 * @example
 * ```ts
 * // app/api/import/parse/route.ts
 * export const POST = createQStashHandler<ParseJobPayload>(async (payload) => {
 *   await processParseJob(payload.importJobId);
 *   return { success: true };
 * });
 * ```
 */
export function createQStashHandler<TPayload, TResult = unknown>(
  handler: (payload: TPayload, request: Request) => Promise<TResult>
) {
  return async (request: Request): Promise<Response> => {
    try {
      // SECURITY: Always verify QStash signature - no bypass allowed
      // For local testing, use ngrok tunnel with real QStash webhooks
      const payload = await verifyQStashSignature<TPayload>(request);

      const result = await handler(payload, request);

      return Response.json(result, { status: 200 });
    } catch (error) {
      console.error('QStash handler error:', error);

      const message =
        error instanceof Error ? error.message : 'Unknown error';

      // Return 500 to trigger QStash retry
      return Response.json({ error: message }, { status: 500 });
    }
  };
}

/**
 * Helper to check if a request is from QStash (has signature header)
 */
export function isQStashRequest(request: Request): boolean {
  return request.headers.has('Upstash-Signature');
}
