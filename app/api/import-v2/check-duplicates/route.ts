/**
 * Check Duplicates API Route
 *
 * POST: Check for DB duplicates against existing leads
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/modules/auth';
import { detectDbDuplicates } from '@/modules/import-v2/lib/processors/db-dedupe';
import type { RowValidationResultV2 } from '@/modules/import-v2/types';
import { DUPLICATE_CHECK_FIELDS } from '@/modules/import-v2/config/constants';
import type { DuplicateCheckField } from '@/modules/import-v2/config/constants';

// =============================================================================
// TYPES
// =============================================================================

interface CheckDuplicatesRequest {
  /** Validated rows from client parsing */
  validatedRows: RowValidationResultV2[];
  /** Fields to check for duplicates */
  checkFields: DuplicateCheckField[];
}

// =============================================================================
// HELPERS
// =============================================================================

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =============================================================================
// POST HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  const LOG_PREFIX = '[API:check-duplicates]';

  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      );
    }

    // Check admin role
    if (user.profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acces refuse' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CheckDuplicatesRequest = await request.json();

    if (!body.validatedRows || !Array.isArray(body.validatedRows)) {
      return NextResponse.json(
        { error: 'validatedRows requis' },
        { status: 400 }
      );
    }

    if (!body.checkFields || !Array.isArray(body.checkFields)) {
      return NextResponse.json(
        { error: 'checkFields requis' },
        { status: 400 }
      );
    }

    // Validate checkFields against allowed values (security whitelist)
    const allowedFields = new Set<string>(DUPLICATE_CHECK_FIELDS);
    const invalidFields = body.checkFields.filter((f) => !allowedFields.has(f));
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: `Champs non autorises: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(LOG_PREFIX, 'Checking duplicates', {
      rowCount: body.validatedRows.length,
      checkFields: body.checkFields,
    });

    // Create admin client
    const supabase = createAdminClient();

    // Detect DB duplicates
    const result = await detectDbDuplicates(
      supabase,
      body.validatedRows,
      body.checkFields
    );

    console.log(LOG_PREFIX, 'Duplicates found', {
      duplicateCount: result.duplicateCount,
    });

    return NextResponse.json({
      success: true,
      duplicateRows: result.duplicateRows,
      duplicateCount: result.duplicateCount,
    });
  } catch (error) {
    console.error(LOG_PREFIX, 'Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
