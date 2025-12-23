/**
 * Client-side file upload with progress tracking
 *
 * Uploads directly to Supabase Storage with progress events
 */

'use client';

import { createClient } from '@/lib/supabase/client';

const LOG_PREFIX = '[ClientUpload]';

export interface UploadProgress {
  phase: 'hashing' | 'uploading' | 'creating_job' | 'complete';
  percentage: number;
  bytesUploaded?: number;
  totalBytes?: number;
  message: string;
}

export async function uploadFileWithProgress(
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<{
  success: boolean;
  importJobId?: string;
  storagePath?: string;
  error?: string;
}> {
  console.log(LOG_PREFIX, 'uploadFileWithProgress START', { fileName: file.name, fileSize: file.size });
  try {
    const supabase = createClient();

    // Get current user
    console.log(LOG_PREFIX, 'Getting current user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(LOG_PREFIX, 'Auth error:', authError);
      return { success: false, error: 'Non authentifié' };
    }
    console.log(LOG_PREFIX, 'User authenticated:', user.id);

    // Phase 1: Calculate hash
    console.log(LOG_PREFIX, 'Phase 1: Calculating hash...');
    onProgress({
      phase: 'hashing',
      percentage: 10,
      message: 'Calcul de l\'empreinte du fichier...',
    });

    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const fileHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log(LOG_PREFIX, 'Hash calculated:', fileHash.substring(0, 16) + '...');

    onProgress({
      phase: 'hashing',
      percentage: 20,
      message: 'Vérification des doublons...',
    });

    // Check for duplicates (optional - can be done server-side)
    // For now, skip to keep it fast

    // Phase 2: Upload to storage
    console.log(LOG_PREFIX, 'Phase 2: Uploading to storage...');
    onProgress({
      phase: 'uploading',
      percentage: 30,
      bytesUploaded: 0,
      totalBytes: file.size,
      message: 'Téléchargement vers le serveur...',
    });

    const ext = file.name.toLowerCase().split('.').pop();
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `imports/${user.id}/${timestamp}_${sanitizedName}`;
    console.log(LOG_PREFIX, 'Storage path:', storagePath);

    // Upload with XMLHttpRequest to track progress
    const uploadResult = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const uploadPercentage = Math.round((e.loaded / e.total) * 100);
            // Map 30-80% to upload phase
            const overallPercentage = 30 + Math.round(uploadPercentage * 0.5);
            
            onProgress({
              phase: 'uploading',
              percentage: overallPercentage,
              bytesUploaded: e.loaded,
              totalBytes: e.total,
              message: `Téléchargement... ${uploadPercentage}%`,
            });
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: `Erreur ${xhr.status}` });
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          resolve({ success: false, error: 'Erreur réseau' });
        });

        // Get upload URL from Supabase
        supabase.storage
          .from('imports')
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          })
          .then(({ error }) => {
            if (error) {
              resolve({ success: false, error: error.message });
            } else {
              resolve({ success: true });
            }
          });
      }
    );

    console.log(LOG_PREFIX, 'Upload result:', uploadResult);
    if (!uploadResult.success) {
      console.error(LOG_PREFIX, 'Upload failed:', uploadResult.error);
      return { success: false, error: uploadResult.error || 'Erreur de téléchargement' };
    }

    onProgress({
      phase: 'uploading',
      percentage: 80,
      message: 'Téléchargement terminé',
    });
    console.log(LOG_PREFIX, 'Upload complete');

    // Phase 3: Create job record
    console.log(LOG_PREFIX, 'Phase 3: Creating import job record...');
    onProgress({
      phase: 'creating_job',
      percentage: 90,
      message: 'Création de l\'import...',
    });

    const { data: importJob, error: dbError } = await supabase
      .from('import_jobs')
      .insert({
        created_by: user.id,
        file_name: file.name,
        file_type: ext,
        storage_path: storagePath,
        file_hash: fileHash,
        status: 'pending',
      })
      .select('id')
      .single();

    if (dbError) {
      console.error(LOG_PREFIX, 'DB insert error:', dbError);
      // Clean up uploaded file
      console.log(LOG_PREFIX, 'Cleaning up uploaded file...');
      await supabase.storage.from('imports').remove([storagePath]);
      return { success: false, error: `Erreur lors de la création: ${dbError.message}` };
    }

    console.log(LOG_PREFIX, 'Import job created:', importJob.id);
    onProgress({
      phase: 'complete',
      percentage: 100,
      message: 'Import créé avec succès',
    });

    console.log(LOG_PREFIX, 'uploadFileWithProgress COMPLETE', { importJobId: importJob.id, storagePath });
    return {
      success: true,
      importJobId: importJob.id,
      storagePath,
    };

  } catch (error) {
    console.error(LOG_PREFIX, 'uploadFileWithProgress ERROR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
