/**
 * Direct Commit Worker (for local development)
 *
 * This endpoint bypasses QStash for local testing.
 * In production, use /api/import/commit with QStash.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  buildDedupeSet,
  checkDuplicate,
  addToFileSet,
  findExistingLeadIds,
  type DedupeField,
} from '@/modules/import/lib/processors/dedupe';
import {
  buildAssignmentContext,
  getAssignment,
} from '@/modules/import/lib/processors/assignment';
import type { AssignmentConfig, DuplicateConfig } from '@/modules/import/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const FETCH_BATCH_SIZE = 500;
const INSERT_BATCH_SIZE = 100;

const STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  proposal: 'Proposition envoyée',
  negotiation: 'Négociation',
  won: 'Gagné',
  lost: 'Perdu',
  no_answer_1: 'Pas de réponse 1',
  no_answer_2: 'Pas de réponse 2',
  wrong_number: 'Faux numéro',
  not_interested: 'Pas intéressé',
  callback: 'Rappeler',
  rdv: 'RDV',
  deposit: 'Dépôt',
  relance: 'Relance',
  mail: 'Mail',
};

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

export async function POST(request: NextRequest) {
  try {
    const {
      importJobId,
      assignment,
      duplicates,
      defaultStatus = 'new',
      defaultSource,
    } = await request.json();

    if (!importJobId) {
      return NextResponse.json(
        { error: 'Missing importJobId' },
        { status: 400 }
      );
    }

    console.log(`[Commit Direct] Starting job ${importJobId}`);

    const supabase = createAdminClient();

    // Get the import job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: `Job not found: ${importJobId}` },
        { status: 404 }
      );
    }

    if (job.status !== 'ready') {
      return NextResponse.json(
        { error: `Job is not ready: ${job.status}` },
        { status: 400 }
      );
    }

    const actorId = job.created_by;

    // Update status to importing
    await supabase
      .from('import_jobs')
      .update({
        status: 'importing',
        started_at: new Date().toISOString(),
        assignment_config: assignment,
        duplicate_config: duplicates,
        worker_id: 'direct-commit',
      })
      .eq('id', importJobId);

    // Build dedupe set
    const databaseDedupeSet = await buildDedupeSet(supabase, {
      checkFields: duplicates.checkFields as DedupeField[],
      checkDatabase: duplicates.checkDatabase,
      checkWithinFile: false,
    });

    const fileDedupeSet = new Set<string>();
    const assignmentContext = await buildAssignmentContext(supabase, assignment);

    let importedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    let offset = 0;

    // Process valid rows in batches
    while (true) {
      const { data: batch, error: batchError } = await supabase
        .from('import_rows')
        .select('*')
        .eq('import_job_id', importJobId)
        .eq('status', 'valid')
        .order('row_number', { ascending: true })
        .range(offset, offset + FETCH_BATCH_SIZE - 1);

      if (batchError || !batch || batch.length === 0) break;

      const leadsToInsert: Array<{ data: Record<string, unknown>; rowId: string }> = [];
      const duplicatesToLookup: Array<{ rowId: string; field: DedupeField; value: string }> = [];
      const skippedRowIds: string[] = [];

      for (const row of batch) {
        const normalizedData = row.normalized_data as Record<string, string | null>;
        const rawData = row.raw_data as Record<string, string>;

        const dedupeResult = checkDuplicate(
          normalizedData,
          duplicates.checkFields as DedupeField[],
          databaseDedupeSet,
          duplicates.checkWithinFile ? fileDedupeSet : new Set()
        );

        if (dedupeResult.isDuplicate) {
          if (duplicates.strategy === 'skip') {
            skippedCount++;
            skippedRowIds.push(row.id);
            continue;
          } else if (duplicates.strategy === 'update') {
            duplicatesToLookup.push({
              rowId: row.id,
              field: dedupeResult.duplicateField!,
              value: dedupeResult.duplicateValue!,
            });
            continue;
          }
        }

        const assignedTo = getAssignment(assignmentContext, rawData);

        const leadData = {
          external_id: normalizedData.external_id || null,
          first_name: normalizedData.first_name || null,
          last_name: normalizedData.last_name || null,
          email: normalizedData.email || null,
          phone: normalizedData.phone || null,
          company: normalizedData.company || null,
          job_title: normalizedData.job_title || null,
          address: normalizedData.address || null,
          city: normalizedData.city || null,
          postal_code: normalizedData.postal_code || null,
          country: normalizedData.country || 'France',
          status: normalizedData.status || defaultStatus,
          status_label: STATUS_LABELS[normalizedData.status || defaultStatus] || defaultStatus,
          source: normalizedData.source || defaultSource || job.file_name,
          notes: normalizedData.notes || null,
          assigned_to: assignedTo,
          import_job_id: importJobId,
        };

        leadsToInsert.push({ data: leadData, rowId: row.id });

        if (duplicates.checkWithinFile) {
          addToFileSet(normalizedData, duplicates.checkFields as DedupeField[], fileDedupeSet);
        }
      }

      // Handle updates
      if (duplicatesToLookup.length > 0) {
        const leadIdMap = await findExistingLeadIds(
          supabase,
          duplicatesToLookup.map((d) => ({ field: d.field, value: d.value }))
        );

        for (const dup of duplicatesToLookup) {
          const key = `${dup.field}:${dup.value.toLowerCase().trim()}`;
          const leadId = leadIdMap.get(key);

          if (!leadId) {
            skippedCount++;
            skippedRowIds.push(dup.rowId);
          }
        }
      }

      // Batch insert
      if (leadsToInsert.length > 0) {
        for (let i = 0; i < leadsToInsert.length; i += INSERT_BATCH_SIZE) {
          const insertBatch = leadsToInsert.slice(i, i + INSERT_BATCH_SIZE);
          const leadsData = insertBatch.map((l) => l.data);

          const { data: insertedLeads, error: insertError } = await supabase
            .from('leads')
            .insert(leadsData)
            .select('id');

          if (insertError) {
            console.error('[Commit Direct] Insert error:', insertError);
            continue;
          }

          if (insertedLeads) {
            const historyEvents = insertedLeads.map((lead, idx) => ({
              lead_id: lead.id,
              actor_id: actorId,
              event_type: 'imported',
              before_data: null,
              after_data: leadsData[idx],
              metadata: {
                import_job_id: importJobId,
                source: job.file_name,
              },
            }));

            await supabase.from('lead_history').insert(historyEvents);

            for (let j = 0; j < insertedLeads.length; j++) {
              await supabase
                .from('import_rows')
                .update({
                  status: 'imported',
                  lead_id: insertedLeads[j].id,
                })
                .eq('id', insertBatch[j].rowId);
            }

            importedCount += insertedLeads.length;

            for (let j = 0; j < insertedLeads.length; j++) {
              addToFileSet(
                leadsData[j] as Record<string, string | null>,
                duplicates.checkFields as DedupeField[],
                databaseDedupeSet
              );
            }
          }
        }
      }

      // Update skipped rows
      if (skippedRowIds.length > 0) {
        for (let i = 0; i < skippedRowIds.length; i += 100) {
          const chunk = skippedRowIds.slice(i, i + 100);
          await supabase
            .from('import_rows')
            .update({ status: 'skipped' })
            .in('id', chunk);
        }
      }

      // Update progress
      await supabase
        .from('import_jobs')
        .update({
          imported_rows: importedCount,
          skipped_rows: skippedCount,
        })
        .eq('id', importJobId);

      console.log(`[Commit Direct] Progress: ${importedCount} imported, ${skippedCount} skipped`);

      offset += batch.length;

      if (batch.length < FETCH_BATCH_SIZE) break;
    }

    // Mark complete
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        imported_rows: importedCount,
        skipped_rows: skippedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importJobId);

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      updatedCount,
    });

  } catch (error) {
    console.error('[Commit Direct] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    worker: 'commit-direct',
    note: 'Local development endpoint - bypasses QStash',
  });
}
