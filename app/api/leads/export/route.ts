/**
 * Streaming CSV Export API for Leads
 * Admin-only, respects filters, Excel compatible
 */

import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';
import {
  UTF8_BOM,
  getCSVHeader,
  encodeCSVRow,
  formatLeadForCSV,
  parseExportFilters,
  getExportFilename,
  sanitizeSearchTerm,
  isValidSortColumn,
  type ExportFilters,
} from '@/modules/leads/lib/export';
import type { SupabaseClient } from '@supabase/supabase-js';

// Vercel config: 5 minutes max for large exports
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const CHUNK_SIZE = 1000; // Supabase API limit is 1000 rows per request
const MIN_SEARCH_LENGTH = 3;

/**
 * Fetch a chunk of leads with filters applied
 */
async function fetchLeadsChunk(
  supabase: SupabaseClient,
  filters: ExportFilters,
  offset: number,
  limit: number
) {
  let query = supabase
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_fkey(id, display_name)')
    .is('deleted_at', null);

  // Apply search filter (min 3 chars for performance, sanitized for security)
  if (filters.search && filters.search.trim().length >= MIN_SEARCH_LENGTH) {
    const sanitized = sanitizeSearchTerm(filters.search);
    if (sanitized.length >= MIN_SEARCH_LENGTH) {
      const searchTerm = `%${sanitized}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company.ilike.${searchTerm}`
      );
    }
  }

  // Apply status filter
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Apply assignee filter
  if (filters.assignedTo) {
    if (filters.assignedTo === 'unassigned') {
      query = query.is('assigned_to', null);
    } else {
      query = query.eq('assigned_to', filters.assignedTo);
    }
  }

  // Sort and paginate (validated sort column for security)
  const sortColumn = isValidSortColumn(filters.sortBy) ? filters.sortBy : 'updated_at';
  const ascending = filters.sortOrder === 'asc';
  query = query
    .order(sortColumn, { ascending })
    .range(offset, offset + limit - 1);

  return query;
}

export async function GET(request: Request) {
  try {
    // 1. Create Supabase client and verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Non authentifié', { status: 401 });
    }

    // 2. Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== ROLES.ADMIN) {
      return new Response('Accès non autorisé', { status: 403 });
    }

    // 3. Parse filters from URL
    const { searchParams } = new URL(request.url);
    const filters = parseExportFilters(searchParams);

    // 4. Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Write UTF-8 BOM for Excel compatibility
          controller.enqueue(UTF8_BOM);

          // Write header row
          controller.enqueue(getCSVHeader());

          // Fetch and stream data in chunks
          let offset = 0;
          let hasMore = true;

          while (hasMore) {
            const { data, error } = await fetchLeadsChunk(
              supabase,
              filters,
              offset,
              CHUNK_SIZE
            );

            if (error) {
              console.error('[Export] Database error:', error);
              break;
            }

            if (!data || data.length === 0) {
              hasMore = false;
              break;
            }

            // Stream each row
            for (const lead of data) {
              const row = formatLeadForCSV(lead);
              controller.enqueue(encodeCSVRow(row));
            }

            // Check if we got a full chunk (more data likely available)
            if (data.length < CHUNK_SIZE) {
              hasMore = false;
            } else {
              offset += CHUNK_SIZE;
            }
          }

          controller.close();
        } catch (error) {
          console.error('[Export] Stream error:', error);
          controller.error(error);
        }
      },
    });

    // 5. Return response with download headers
    const filename = getExportFilename();

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Export] Unexpected error:', error);
    return new Response('Erreur serveur', { status: 500 });
  }
}
