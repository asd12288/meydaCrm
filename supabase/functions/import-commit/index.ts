import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CommitRequest {
  importJobId: string;
  assignment: {
    mode: "none" | "single" | "round_robin" | "by_column";
    singleUserId?: string;
    roundRobinUserIds?: string[];
    assignmentColumn?: string;
  };
  duplicates: {
    strategy: "skip" | "update" | "create";
    checkFields: string[];
    checkDatabase: boolean;
    checkWithinFile: boolean;
  };
  defaultStatus?: string;
  defaultSource?: string;
}

// Batch size for processing - optimized for performance
const BATCH_SIZE = 500;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization requise" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
    } = await supabaseAdmin.auth.getUser(token);

    if (!caller) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Accès non autorisé" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request
    const {
      importJobId,
      assignment,
      duplicates,
      defaultStatus = "new",
      defaultSource,
    }: CommitRequest = await req.json();

    if (!importJobId) {
      return new Response(
        JSON.stringify({ error: "importJobId requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get import job
    const { data: job, error: jobError } = await supabaseAdmin
      .from("import_jobs")
      .select("*")
      .eq("id", importJobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job non trouvé" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (job.status !== "ready") {
      return new Response(
        JSON.stringify({ error: "Le job n'est pas prêt pour l'import" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update status to importing
    await supabaseAdmin
      .from("import_jobs")
      .update({
        status: "importing",
        started_at: new Date().toISOString(),
      })
      .eq("id", importJobId);

    console.log(`Starting import for job ${importJobId}`);

    // =========================================================================
    // PRE-FETCH PHASE: Load all lookup data once
    // =========================================================================

    // 1. Pre-fetch existing leads for duplicate detection (OPTIMIZED)
    const duplicateSet = new Set<string>();
    if (duplicates.checkDatabase && duplicates.checkFields.length > 0) {
      console.log(`Pre-fetching duplicates for fields: ${duplicates.checkFields.join(", ")}`);

      for (const field of duplicates.checkFields) {
        // Use indexed queries with only the field we need
        const { data: existing, error: fetchError } = await supabaseAdmin
          .from("leads")
          .select(field)
          .not(field, "is", null)
          .limit(100000); // Safety limit

        if (fetchError) {
          console.error(`Error fetching ${field} for duplicates:`, fetchError);
          continue;
        }

        if (existing) {
          for (const lead of existing) {
            const value = (lead[field] as string)?.toLowerCase?.();
            if (value) {
              duplicateSet.add(`${field}:${value}`);
            }
          }
        }
      }
      console.log(`Loaded ${duplicateSet.size} existing values for duplicate detection`);
    }

    // 2. Pre-fetch user mapping for by_column assignment
    const userMap = new Map<string, string>();
    if (assignment.mode === "by_column") {
      console.log("Pre-fetching users for by_column assignment");
      const { data: users } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name");

      if (users) {
        for (const user of users) {
          if (user.display_name) {
            // Map by lowercase display name
            userMap.set(user.display_name.toLowerCase(), user.id);
            // Also map by ID for direct ID references
            userMap.set(user.id.toLowerCase(), user.id);
          }
        }
      }
      console.log(`Loaded ${userMap.size} users for assignment lookup`);
    }

    // =========================================================================
    // PROCESSING PHASE: Process rows in batches
    // =========================================================================

    // Get valid rows in batches using pagination
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let roundRobinIndex = 0;
    let offset = 0;
    let hasMore = true;

    // Track duplicates within file
    const fileDedupeSet = new Set<string>();

    while (hasMore) {
      // Fetch batch of valid rows
      const { data: batch, error: batchError } = await supabaseAdmin
        .from("import_rows")
        .select("*")
        .eq("import_job_id", importJobId)
        .eq("status", "valid")
        .order("row_number", { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1);

      if (batchError) {
        console.error("Batch fetch error:", batchError);
        await updateJobError(supabaseAdmin, importJobId, `Erreur lors de la lecture: ${batchError.message}`);
        return new Response(
          JSON.stringify({ error: batchError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Processing batch at offset ${offset}, ${batch.length} rows`);

      const leadsToInsert: Array<Record<string, unknown> & { _row_id: string }> = [];
      const leadsToUpdate: Array<{ leadId: string; data: Record<string, unknown>; rowId: string }> = [];
      const skippedRowIds: string[] = [];

      for (const row of batch) {
        const data = row.normalized_data as Record<string, string | null>;
        const rawData = row.raw_data as Record<string, string>;

        // Check for duplicates in database
        let isDuplicate = false;
        let existingLeadId: string | null = null;

        for (const field of duplicates.checkFields) {
          const value = data[field]?.toLowerCase();
          if (value) {
            const key = `${field}:${value}`;

            // Check database duplicates
            if (duplicates.checkDatabase && duplicateSet.has(key)) {
              isDuplicate = true;
              // We don't have the lead ID in the set, need to query
              if (duplicates.strategy === "update") {
                const { data: existingLead } = await supabaseAdmin
                  .from("leads")
                  .select("id")
                  .eq(field, data[field])
                  .limit(1)
                  .single();
                if (existingLead) {
                  existingLeadId = existingLead.id;
                }
              }
              break;
            }

            // Check within-file duplicates
            if (duplicates.checkWithinFile && fileDedupeSet.has(key)) {
              isDuplicate = true;
              break;
            }
          }
        }

        if (isDuplicate) {
          if (duplicates.strategy === "skip") {
            skippedCount++;
            skippedRowIds.push(row.id);
            continue;
          } else if (duplicates.strategy === "update" && existingLeadId) {
            // Queue for update
            const updateData = buildLeadData(
              data,
              defaultStatus,
              defaultSource || job.file_name,
              null, // Don't change assignment on update
              importJobId
            );
            leadsToUpdate.push({
              leadId: existingLeadId,
              data: updateData,
              rowId: row.id,
            });
            continue;
          }
          // strategy === "create" falls through to insert
        }

        // Determine assignment
        let assignedTo: string | null = null;
        if (assignment.mode === "single" && assignment.singleUserId) {
          assignedTo = assignment.singleUserId;
        } else if (
          assignment.mode === "round_robin" &&
          assignment.roundRobinUserIds &&
          assignment.roundRobinUserIds.length > 0
        ) {
          assignedTo = assignment.roundRobinUserIds[
            roundRobinIndex % assignment.roundRobinUserIds.length
          ];
          roundRobinIndex++;
        } else if (assignment.mode === "by_column" && assignment.assignmentColumn) {
          // Use pre-fetched user map
          const columnValue = rawData?.[assignment.assignmentColumn];
          if (columnValue) {
            const userId = userMap.get(columnValue.toLowerCase());
            if (userId) {
              assignedTo = userId;
            }
          }
        }

        // Build lead data
        const leadData = buildLeadData(
          data,
          defaultStatus,
          defaultSource || job.file_name,
          assignedTo,
          importJobId
        );

        leadsToInsert.push({
          ...leadData,
          _row_id: row.id,
        });

        // Add to file dedupe set
        if (duplicates.checkWithinFile) {
          for (const field of duplicates.checkFields) {
            const value = data[field]?.toLowerCase();
            if (value) {
              fileDedupeSet.add(`${field}:${value}`);
            }
          }
        }
      }

      // =====================================================================
      // BATCH INSERT new leads
      // =====================================================================
      if (leadsToInsert.length > 0) {
        const leadsWithoutRowId = leadsToInsert.map(({ _row_id, ...lead }) => lead);

        const { data: insertedLeads, error: insertError } = await supabaseAdmin
          .from("leads")
          .insert(leadsWithoutRowId)
          .select("id");

        if (insertError) {
          console.error("Insert error:", insertError);
          errorCount += leadsToInsert.length;
        } else if (insertedLeads) {
          // Create history events in batch
          const historyEvents = insertedLeads.map((lead, idx) => ({
            lead_id: lead.id,
            actor_id: caller.id,
            event_type: "imported",
            before_data: null,
            after_data: leadsWithoutRowId[idx],
            metadata: {
              import_job_id: importJobId,
              source: job.file_name,
            },
          }));

          await supabaseAdmin.from("lead_history").insert(historyEvents);

          // Batch update import_rows with lead_id
          const rowUpdates = insertedLeads.map((lead, idx) => ({
            id: leadsToInsert[idx]._row_id,
            lead_id: lead.id,
            status: "imported",
          }));

          // Update rows in batch using upsert
          for (const update of rowUpdates) {
            await supabaseAdmin
              .from("import_rows")
              .update({ status: update.status, lead_id: update.lead_id })
              .eq("id", update.id);
          }

          importedCount += insertedLeads.length;

          // Add to duplicate set for within-file detection
          for (let i = 0; i < insertedLeads.length; i++) {
            const leadData = leadsWithoutRowId[i];
            for (const field of duplicates.checkFields) {
              const value = (leadData[field] as string)?.toLowerCase();
              if (value) {
                duplicateSet.add(`${field}:${value}`);
              }
            }
          }
        }
      }

      // =====================================================================
      // BATCH UPDATE existing leads
      // =====================================================================
      if (leadsToUpdate.length > 0) {
        const historyEvents: Array<Record<string, unknown>> = [];

        for (const update of leadsToUpdate) {
          const { error: updateError } = await supabaseAdmin
            .from("leads")
            .update(update.data)
            .eq("id", update.leadId);

          if (!updateError) {
            historyEvents.push({
              lead_id: update.leadId,
              actor_id: caller.id,
              event_type: "updated",
              before_data: null,
              after_data: update.data,
              metadata: {
                import_job_id: importJobId,
                action: "update_existing",
              },
            });

            await supabaseAdmin
              .from("import_rows")
              .update({ status: "imported", lead_id: update.leadId })
              .eq("id", update.rowId);

            importedCount++;
          } else {
            errorCount++;
          }
        }

        if (historyEvents.length > 0) {
          await supabaseAdmin.from("lead_history").insert(historyEvents);
        }
      }

      // =====================================================================
      // BATCH UPDATE skipped rows
      // =====================================================================
      if (skippedRowIds.length > 0) {
        // Update in chunks of 100 IDs for the IN clause
        for (let i = 0; i < skippedRowIds.length; i += 100) {
          const chunk = skippedRowIds.slice(i, i + 100);
          await supabaseAdmin
            .from("import_rows")
            .update({ status: "skipped" })
            .in("id", chunk);
        }
      }

      // Update job progress
      await supabaseAdmin
        .from("import_jobs")
        .update({
          imported_rows: importedCount,
          skipped_rows: skippedCount,
        })
        .eq("id", importJobId);

      console.log(`Batch complete: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`);

      offset += batch.length;
      hasMore = batch.length === BATCH_SIZE;
    }

    // Mark job as completed
    await supabaseAdmin
      .from("import_jobs")
      .update({
        status: "completed",
        imported_rows: importedCount,
        skipped_rows: skippedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", importJobId);

    console.log(`Import complete: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        importedCount,
        skippedCount,
        errorCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Commit error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function updateJobError(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  errorMessage: string
) {
  await supabase
    .from("import_jobs")
    .update({
      status: "failed",
      error_message: errorMessage,
    })
    .eq("id", jobId);
}

function buildLeadData(
  data: Record<string, string | null>,
  defaultStatus: string,
  defaultSource: string,
  assignedTo: string | null,
  importJobId: string
): Record<string, unknown> {
  // Map status label to status key
  const statusMap: Record<string, string> = {
    rdv: "rdv",
    "pas de reponse 1": "no_answer_1",
    "pas de reponse 2": "no_answer_2",
    "pas de réponse 1": "no_answer_1",
    "pas de réponse 2": "no_answer_2",
    "faux numero": "wrong_number",
    "faux numéro": "wrong_number",
    "pas interesse": "not_interested",
    "pas intéressé": "not_interested",
    depot: "deposit",
    dépôt: "deposit",
    rappeler: "callback",
    relance: "relance",
    mail: "mail",
    nouveau: "new",
    contacte: "contacted",
    contacté: "contacted",
    qualifie: "qualified",
    qualifié: "qualified",
    proposition: "proposal",
    negociation: "negotiation",
    négociation: "negotiation",
    gagne: "won",
    gagné: "won",
    perdu: "lost",
  };

  let status = defaultStatus;
  let statusLabel = getStatusLabel(defaultStatus);

  if (data.status) {
    const normalizedStatus = data.status.toLowerCase().trim();
    if (statusMap[normalizedStatus]) {
      status = statusMap[normalizedStatus];
      statusLabel = getStatusLabel(status);
    } else {
      // Try to use as-is if it matches a valid status key
      const validStatuses = Object.values(statusMap);
      if (validStatuses.includes(normalizedStatus)) {
        status = normalizedStatus;
        statusLabel = getStatusLabel(status);
      }
    }
  }

  return {
    external_id: data.external_id || null,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    email: data.email || null,
    phone: data.phone || null,
    company: data.company || null,
    job_title: data.job_title || null,
    address: data.address || null,
    city: data.city || null,
    postal_code: data.postal_code || null,
    country: data.country || "France",
    status,
    status_label: statusLabel,
    source: data.source || defaultSource,
    notes: data.notes || null,
    assigned_to: assignedTo,
    import_job_id: importJobId,
  };
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    rdv: "RDV",
    no_answer_1: "Pas de réponse 1",
    no_answer_2: "Pas de réponse 2",
    wrong_number: "Faux numéro",
    not_interested: "Pas intéressé",
    deposit: "Dépôt",
    callback: "Rappeler",
    relance: "Relance",
    mail: "Mail",
    new: "Nouveau",
    contacted: "Contacté",
    qualified: "Qualifié",
    proposal: "Proposition envoyée",
    negotiation: "Négociation",
    won: "Gagné",
    lost: "Perdu",
    no_answer: "Pas de réponse",
  };
  return labels[status] || status;
}
