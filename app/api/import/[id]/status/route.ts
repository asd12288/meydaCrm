import { createClient } from '@/lib/supabase/server';
import type { ImportJobProgress } from '@/modules/import/types';

/**
 * SSE endpoint for real-time import progress updates
 * Uses Supabase Realtime to push updates when import_jobs table changes
 *
 * GET /api/import/[id]/status
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: importJobId } = await params;

  // Validate import job ID
  if (!importJobId || !/^[0-9a-f-]{36}$/.test(importJobId)) {
    return new Response('Invalid import job ID', { status: 400 });
  }

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return new Response('Acces non autorise', { status: 403 });
  }

  // Check if import job exists
  const { data: job, error: jobError } = await supabase
    .from('import_jobs')
    .select('id, status, created_by')
    .eq('id', importJobId)
    .single();

  if (jobError || !job) {
    return new Response('Import job not found', { status: 404 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let isConnectionOpen = true;

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE message
      const sendMessage = (data: ImportJobProgress | null, type: string = 'progress') => {
        if (!isConnectionOpen) return;

        const message = {
          type,
          data,
          timestamp: new Date().toISOString(),
        };

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        } catch {
          // Controller might be closed
          isConnectionOpen = false;
        }
      };

      // Helper to transform DB row to ImportJobProgress
      const transformToProgress = (row: Record<string, unknown>): ImportJobProgress => ({
        id: row.id as string,
        status: row.status as ImportJobProgress['status'],
        totalRows: row.total_rows as number | null,
        processedRows: row.processed_rows as number | null,
        validRows: row.valid_rows as number | null,
        invalidRows: row.invalid_rows as number | null,
        importedRows: row.imported_rows as number | null,
        skippedRows: row.skipped_rows as number | null,
        currentChunk: row.current_chunk as number | null,
        totalChunks: row.total_chunks as number | null,
        errorMessage: row.error_message as string | null,
        startedAt: row.started_at as string | null,
        completedAt: row.completed_at as string | null,
        updatedAt: row.updated_at as string,
      });

      // Send initial state
      const { data: initialJob } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', importJobId)
        .single();

      if (initialJob) {
        sendMessage(transformToProgress(initialJob), 'progress');
      }

      // Subscribe to Realtime updates
      const channel = supabase
        .channel(`import-${importJobId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'import_jobs',
            filter: `id=eq.${importJobId}`,
          },
          (payload) => {
            const progress = transformToProgress(payload.new);
            const eventType =
              progress.status === 'completed' || progress.status === 'failed'
                ? 'complete'
                : 'progress';

            sendMessage(progress, eventType);

            // Close connection when import is done
            if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
              setTimeout(() => {
                isConnectionOpen = false;
                if (heartbeatInterval) {
                  clearInterval(heartbeatInterval);
                }
                channel.unsubscribe();
                controller.close();
              }, 1000); // Give client time to receive final message
            }
          }
        )
        .subscribe();

      // Heartbeat to keep connection alive (every 15 seconds)
      heartbeatInterval = setInterval(() => {
        if (!isConnectionOpen) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          return;
        }

        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          isConnectionOpen = false;
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          channel.unsubscribe();
        }
      }, 15000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        isConnectionOpen = false;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        channel.unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
