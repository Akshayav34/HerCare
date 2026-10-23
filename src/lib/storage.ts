import { supabase, isSupabaseConfigured } from './supabase';

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateMedicalFile(file: File): FileValidationResult {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file format. Only PDF, JPG, and PNG documents are allowed for medical security.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'File size exceeds maximum allowed limit of 10 MB.',
    };
  }

  return { isValid: true };
}

/**
 * Uploads a file to private Supabase storage or demo storage.
 * Returns the storage path.
 */
export async function uploadMedicalDocument(
  userId: string,
  file: File
): Promise<{ path: string; fileName: string; fileSize: number; fileType: string }> {
  const validation = validateMedicalFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${userId}/${safeFileName}`;

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.storage
      .from('medical-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  } else {
    // Demo Mode: store base64 data URL in demo storage for in-browser view & test
    await new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const storedFiles = JSON.parse(localStorage.getItem('hercare_demo_files') || '{}');
          storedFiles[filePath] = {
            dataUrl: reader.result,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          };
          localStorage.setItem('hercare_demo_files', JSON.stringify(storedFiles));
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return {
    path: filePath,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
}

/**
 * Creates a temporary signed URL with short TTL (e.g. 5 minutes) for private viewing
 */
export async function getSignedFileUrl(filePath: string): Promise<string> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(filePath, 300); // 300 seconds = 5 mins

    if (error || !data) {
      throw new Error(`Unable to generate secure download link: ${error?.message}`);
    }
    return data.signedUrl;
  }

  // Demo fallback
  const storedFiles = JSON.parse(localStorage.getItem('hercare_demo_files') || '{}');
  if (storedFiles[filePath]?.dataUrl) {
    return storedFiles[filePath].dataUrl;
  }

  // Fallback demo sample document
  return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800';
}
