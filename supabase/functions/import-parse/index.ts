import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// NOTE: This Edge Function only handles CSV files.
// Excel files are converted to CSV client-side using SheetJS before upload.
// This avoids Deno compatibility issues with the xlsx npm package.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ParseRequest {
  importJobId: string;
}

interface ColumnMapping {
  sourceColumn: string;
  sourceIndex: number;
  targetField: string | null;
  confidence: number;
  isManual: boolean;
}

interface ColumnMappingConfig {
  mappings: ColumnMapping[];
  hasHeaderRow: boolean;
  headerRowIndex: number;
  encoding: string;
  delimiter: string;
}

// Lead field validation
const REQUIRED_CONTACT_FIELDS = ["email", "phone", "external_id"];

// Chunk size for batch inserts - larger chunks = fewer DB calls
const CHUNK_SIZE = 1000;

// Max file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
    const { importJobId }: ParseRequest = await req.json();

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

    // Check if we should resume from a previous chunk
    const startChunk = job.current_chunk || 0;
    const isResume = startChunk > 0;

    // Update status to parsing
    await supabaseAdmin
      .from("import_jobs")
      .update({
        status: "parsing",
        error_message: null,
        error_details: null,
      })
      .eq("id", importJobId);

    // Download file from storage
    console.log(`Downloading file from: ${job.storage_path}`);
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("imports")
      .download(job.storage_path);

    if (downloadError || !fileData) {
      await updateJobError(supabaseAdmin, importJobId, "Impossible de télécharger le fichier");
      return new Response(
        JSON.stringify({ error: "Impossible de télécharger le fichier" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check file size
    if (fileData.size > MAX_FILE_SIZE) {
      await updateJobError(supabaseAdmin, importJobId, `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      return new Response(
        JSON.stringify({ error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse CSV file (all files are CSV - Excel converted client-side)
    console.log(`Parsing CSV file, size: ${fileData.size} bytes`);
    const content = await fileData.text();
    const { headers, rows } = parseCSV(content);
    console.log(`Parsed CSV: ${headers.length} columns, ${rows.length} rows`);

    if (headers.length === 0) {
      await updateJobError(supabaseAdmin, importJobId, "Fichier vide ou invalide");
      return new Response(
        JSON.stringify({ error: "Fichier vide ou invalide" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get or create column mapping
    let mappingConfig: ColumnMappingConfig;
    if (job.column_mapping && !isResume) {
      mappingConfig = job.column_mapping as ColumnMappingConfig;
    } else {
      // Auto-generate mapping
      mappingConfig = {
        mappings: autoMapColumns(headers),
        hasHeaderRow: true,
        headerRowIndex: 0,
        encoding: "UTF-8",
        delimiter: ",",
      };
    }

    // Save mapping to job immediately
    await supabaseAdmin
      .from("import_jobs")
      .update({
        column_mapping: mappingConfig,
        total_rows: rows.length,
      })
      .eq("id", importJobId);

    // If resuming, clear existing rows from the resume point
    if (isResume) {
      console.log(`Resuming from chunk ${startChunk}, clearing subsequent rows...`);
      const startRowNumber = startChunk * CHUNK_SIZE + 2; // +2 for 1-based and header
      await supabaseAdmin
        .from("import_rows")
        .delete()
        .eq("import_job_id", importJobId)
        .gte("row_number", startRowNumber);
    }

    // Process rows in chunks
    const totalRows = rows.length;
    let validCount = 0;
    let invalidCount = 0;
    const startIndex = isResume ? startChunk * CHUNK_SIZE : 0;

    console.log(`Processing ${totalRows} rows in chunks of ${CHUNK_SIZE}...`);

    for (let i = startIndex; i < totalRows; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const chunkNumber = Math.floor(i / CHUNK_SIZE);

      const importRows = [];
      for (let idx = 0; idx < chunk.length; idx++) {
        const row = chunk[idx];
        const rowNumber = i + idx + 2; // +2 for 1-based and header row
        const rawData: Record<string, string> = {};
        const normalizedData: Record<string, string | null> = {};
        const errors: Record<string, string> = {};

        // Map columns
        for (const mapping of mappingConfig.mappings) {
          const value = row[mapping.sourceIndex]?.trim() || "";
          rawData[mapping.sourceColumn] = value;

          if (mapping.targetField && value) {
            normalizedData[mapping.targetField] = normalizeValue(
              mapping.targetField,
              value
            );
          }
        }

        // Validate: must have at least one contact field
        const hasContact = REQUIRED_CONTACT_FIELDS.some(
          (field) => normalizedData[field]
        );
        if (!hasContact) {
          errors["contact"] =
            "Au moins un champ de contact requis (email, téléphone ou ID externe)";
        }

        // Validate email format
        if (normalizedData["email"]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(normalizedData["email"])) {
            errors["email"] = "Format email invalide";
          }
        }

        const isValid = Object.keys(errors).length === 0;
        if (isValid) validCount++;
        else invalidCount++;

        importRows.push({
          import_job_id: importJobId,
          row_number: rowNumber,
          chunk_number: chunkNumber,
          status: isValid ? "valid" : "invalid",
          raw_data: rawData,
          normalized_data: normalizedData,
          validation_errors: Object.keys(errors).length > 0 ? errors : null,
        });
      }

      // Batch insert chunk
      const { error: insertError } = await supabaseAdmin
        .from("import_rows")
        .insert(importRows);

      if (insertError) {
        console.error("Insert error:", insertError);
        await updateJobError(
          supabaseAdmin,
          importJobId,
          `Erreur lors de l'insertion (chunk ${chunkNumber}): ${insertError.message}`
        );
        return new Response(
          JSON.stringify({ error: insertError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update progress
      await supabaseAdmin
        .from("import_jobs")
        .update({
          current_chunk: chunkNumber + 1,
          total_rows: totalRows,
          valid_rows: validCount,
          invalid_rows: invalidCount,
        })
        .eq("id", importJobId);

      console.log(`Processed chunk ${chunkNumber + 1}/${Math.ceil(totalRows / CHUNK_SIZE)}: ${validCount} valid, ${invalidCount} invalid`);
    }

    // Mark as ready
    await supabaseAdmin
      .from("import_jobs")
      .update({
        status: "ready",
        total_rows: totalRows,
        valid_rows: validCount,
        invalid_rows: invalidCount,
      })
      .eq("id", importJobId);

    console.log(`Parse complete: ${totalRows} rows, ${validCount} valid, ${invalidCount} invalid`);

    return new Response(
      JSON.stringify({
        success: true,
        totalRows,
        validRows: validCount,
        invalidRows: invalidCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Parse error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  // Detect delimiter
  const firstLine = content.split("\n")[0] || "";
  const delimiters = [",", ";", "\t", "|"];
  let delimiter = ",";
  let maxCount = 0;

  for (const d of delimiters) {
    const escapedD = d === "|" ? "\\|" : d === "\t" ? "\t" : d;
    const count = (firstLine.match(new RegExp(escapedD, "g")) || []).length;
    if (count > maxCount) {
      maxCount = count;
      delimiter = d;
    }
  }

  // Parse lines
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => parseCSVLine(line, delimiter));

  // Filter out completely empty rows
  const filteredRows = rows.filter(row => row.some(cell => cell.trim() !== ""));

  return { headers, rows: filteredRows };
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function autoMapColumns(headers: string[]): ColumnMapping[] {
  const aliases: Record<string, string[]> = {
    external_id: [
      "id", "external_id", "identifiant", "reference", "ref", "lead_id",
      "customer_id", "client_id", "numero", "numéro", "n°", "id_client"
    ],
    first_name: [
      "prenom", "prénom", "firstname", "first_name", "first name",
      "given_name", "prenom_contact", "prénom_contact"
    ],
    last_name: [
      "nom", "nom_de_famille", "lastname", "last_name", "surname",
      "full_name", "fullname", "name", "nom_contact", "nom_famille"
    ],
    email: [
      "email", "e-mail", "mail", "courriel", "e_mail_principale",
      "email_principale", "main_email", "adresse_email", "email_contact"
    ],
    phone: [
      "telephone", "téléphone", "tel", "phone", "mobile", "portable",
      "gsm", "telephone_principal", "main_phone", "cell", "tel_mobile",
      "numero_telephone", "numéro_téléphone", "phone_number"
    ],
    company: [
      "entreprise", "societe", "société", "company", "raison_sociale",
      "organization", "organisation", "nom_entreprise", "societe_nom"
    ],
    job_title: [
      "fonction", "poste", "titre", "job_title", "role", "position",
      "profession", "metier", "métier", "titre_poste"
    ],
    address: [
      "adresse", "address", "rue", "street", "full_address", "location",
      "adresse_complete", "adresse_postale", "voie"
    ],
    city: [
      "ville", "city", "commune", "localite", "localité", "town",
      "municipality", "ville_residence"
    ],
    postal_code: [
      "code_postal", "code postal", "cp", "postal_code", "zip",
      "zipcode", "postcode", "code", "codepostal"
    ],
    country: [
      "pays", "country", "nation", "region", "territoire"
    ],
    status: [
      "statut", "status", "etat", "état", "lead_status", "contact_status",
      "status_lead", "etat_lead"
    ],
    source: [
      "source", "origine", "campaign", "campagne", "campaign_name",
      "form_name", "platform", "provenance", "canal", "source_lead"
    ],
    notes: [
      "notes", "note", "commentaire", "commentaires", "description",
      "observations", "info", "details", "remarques", "remarque"
    ],
    assigned_to: [
      "commercial", "vendeur", "assigné", "assigne", "assigned_to",
      "owner", "responsable", "assigné_à", "attribue_a", "conseiller"
    ],
  };

  return headers.map((header, index) => {
    const normalizedHeader = header
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    let matchedField: string | null = null;
    let confidence = 0;

    for (const [field, fieldAliases] of Object.entries(aliases)) {
      for (const alias of fieldAliases) {
        const normalizedAlias = alias
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");

        if (normalizedHeader === normalizedAlias) {
          matchedField = field;
          confidence = 1;
          break;
        } else if (
          normalizedHeader.includes(normalizedAlias) ||
          normalizedAlias.includes(normalizedHeader)
        ) {
          if (confidence < 0.7) {
            matchedField = field;
            confidence = 0.7;
          }
        }
      }
      if (confidence === 1) break;
    }

    return {
      sourceColumn: header,
      sourceIndex: index,
      targetField: confidence >= 0.7 ? matchedField : null,
      confidence,
      isManual: false,
    };
  });
}

function normalizeValue(field: string, value: string): string | null {
  if (!value || value.trim() === "") return null;

  const trimmed = value.trim();

  switch (field) {
    case "email":
      return trimmed.toLowerCase();

    case "phone": {
      // Normalize phone numbers
      let normalized = trimmed;
      // Remove common prefixes like "p:" or "t:"
      if (/^[pt]:/.test(normalized.toLowerCase())) {
        normalized = normalized.slice(2);
      }
      // Remove spaces, dots, dashes, parentheses
      normalized = normalized.replace(/[\s.\-()]/g, "");
      // Convert French 0x format to +33
      if (normalized.startsWith("0") && normalized.length === 10) {
        normalized = "+33" + normalized.slice(1);
      }
      return normalized;
    }

    case "postal_code": {
      const digits = trimmed.replace(/\s/g, "");
      // Pad French postal codes
      if (/^\d{4}$/.test(digits)) {
        return "0" + digits;
      }
      return digits;
    }

    default:
      return trimmed.replace(/\s+/g, " ");
  }
}
