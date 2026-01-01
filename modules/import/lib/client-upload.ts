/**
 * Client-side file upload with progress tracking
 * 
 * Uploads directly to Supabase Storage with progress events
 */

'use client';

import { createClient } from '@/lib/supabase/client';

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
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Non authentifié' };
    }

    // Phase 1: Calculate hash
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

    onProgress({
      phase: 'hashing',
      percentage: 20,
      message: 'Vérification des doublons...',
    });

    // Check for duplicates (optional - can be done server-side)
    // For now, skip to keep it fast

    // Phase 2: Upload to storage
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

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error || 'Erreur de téléchargement' };
    }

    onProgress({
      phase: 'uploading',
      percentage: 80,
      message: 'Téléchargement terminé',
    });

    // Phase 3: Create job record
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
      // Clean up uploaded file
      await supabase.storage.from('imports').remove([storagePath]);
      return { success: false, error: `Erreur lors de la création: ${dbError.message}` };
    }

    onProgress({
      phase: 'complete',
      percentage: 100,
      message: 'Import créé avec succès',
    });

    return {
      success: true,
      importJobId: importJob.id,
      storagePath,
    };

  } catch (error) {
    console.error('[ClientUpload] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}


