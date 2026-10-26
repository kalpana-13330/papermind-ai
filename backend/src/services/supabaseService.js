const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

/**
 * Supabase Storage Service for PaperMind.AI
 * Manages secure cloud PDF uploads, private bucket retrieval, signed URLs, and cleanup.
 * Falls back gracefully to local disk storage if credentials are not configured.
 */

function getNormalizedUrl() {
  const raw = process.env.SUPABASE_URL || '';
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'papers';

let supabaseClient = null;
let bucketVerified = false;

function isConfigured() {
  const url = getNormalizedUrl();
  return (
    Boolean(url) &&
    Boolean(SUPABASE_KEY) &&
    !url.includes('YOUR_SUPABASE') &&
    !SUPABASE_KEY.includes('YOUR_SUPABASE')
  );
}

function getClient() {
  if (!isConfigured()) return null;
  if (!supabaseClient) {
    const url = getNormalizedUrl();
    supabaseClient = createClient(url, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Ensure private storage bucket exists (attempt creation if missing and permitted)
 */
async function ensureBucket() {
  if (bucketVerified) return true;
  const client = getClient();
  if (!client) return false;

  try {
    const { data: buckets, error: listErr } = await client.storage.listBuckets();
    if (!listErr && buckets) {
      const exists = buckets.some((b) => b.name === BUCKET_NAME);
      if (exists) {
        bucketVerified = true;
        return true;
      }
    }

    // Attempt to create private bucket for papers and summaries
    const { error: createErr } = await client.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes: ['application/pdf', 'application/json', 'text/plain'],
    });

    if (!createErr) {
      bucketVerified = true;
      console.log(`[Supabase Storage] Bucket "${BUCKET_NAME}" created or verified successfully.`);
      return true;
    }

    // Try updating bucket allowed MIME types in case it was created earlier with only PDF
    try {
      await client.storage.updateBucket(BUCKET_NAME, {
        public: false,
        allowedMimeTypes: ['application/pdf', 'application/json', 'text/plain'],
      });
    } catch (_) {}
  } catch (err) {
    console.warn('[Supabase Storage] Bucket check notice:', err.message);
  }

  bucketVerified = true;
  return true;
}

/**
 * Upload a PDF file buffer to Supabase private storage
 * @param {Buffer|Uint8Array} fileBuffer
 * @param {string} storagePath - e.g. "users/userId/papers/paperId.pdf"
 * @param {string} mimeType
 */
async function uploadPdfBuffer(fileBuffer, storagePath, mimeType = 'application/pdf') {
  const client = getClient();
  if (!client) {
    throw new Error('Supabase Storage is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  await ensureBucket();

  const { data, error } = await client.storage.from(BUCKET_NAME).upload(storagePath, fileBuffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload PDF to Supabase Storage: ${error.message}`);
  }

  return {
    path: storagePath,
    fullPath: data ? data.path : storagePath,
    bucket: BUCKET_NAME,
  };
}

/**
 * Upload a local PDF file path to Supabase private storage
 * @param {string} localFilePath
 * @param {string} storagePath
 * @param {string} mimeType
 */
async function uploadPdfFromFile(localFilePath, storagePath, mimeType = 'application/pdf') {
  const buffer = fs.readFileSync(localFilePath);
  return uploadPdfBuffer(buffer, storagePath, mimeType);
}

/**
 * Download a PDF from Supabase Storage as a Buffer
 * @param {string} storagePath
 * @returns {Promise<Buffer>}
 */
async function downloadPdfBuffer(storagePath) {
  const client = getClient();
  if (!client) {
    throw new Error('Supabase Storage is not configured.');
  }

  const { data, error } = await client.storage.from(BUCKET_NAME).download(storagePath);
  if (error || !data) {
    throw new Error(`Failed to download PDF from Supabase Storage: ${error ? error.message : 'No data returned'}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload structured Research Paper Summary to Supabase Storage as JSON
 * Path: users/{userId}/summaries/{paperId}.json
 * @param {string} userId
 * @param {string} paperId
 * @param {object} summaryData
 * @returns {Promise<{ path: string, storageProvider: string }>}
 */
async function uploadSummary(userId, paperId, summaryData) {
  const storagePath = `users/${userId}/summaries/${paperId}.json`;
  const jsonContent = JSON.stringify(summaryData, null, 2);
  const buffer = Buffer.from(jsonContent, 'utf-8');

  const client = getClient();
  if (client) {
    try {
      await ensureBucket();
      const { data, error } = await client.storage.from(BUCKET_NAME).upload(storagePath, buffer, {
        contentType: 'application/json',
        upsert: true,
      });

      if (!error) {
        console.log(`[Supabase Storage] Summary saved to Supabase: ${storagePath}`);
        return {
          path: storagePath,
          fullPath: data ? data.path : storagePath,
          storageProvider: 'supabase',
        };
      }
      console.warn(`[Supabase Storage] Cloud summary upload notice: ${error.message}. Saving to local backup...`);
    } catch (err) {
      console.warn(`[Supabase Storage] Cloud summary upload error: ${err.message}. Saving to local backup...`);
    }
  }

  // Local filesystem fallback
  const localDir = path.join(__dirname, '../../uploads/summaries', String(userId));
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localFile = path.join(localDir, `${paperId}.json`);
  fs.writeFileSync(localFile, jsonContent, 'utf-8');
  console.log(`[Storage Fallback] Summary saved to local file: ${localFile}`);

  return {
    path: storagePath,
    localFile,
    storageProvider: 'local',
  };
}

/**
 * Retrieve structured Research Paper Summary JSON from Supabase Storage
 * @param {string} userId
 * @param {string} paperId
 * @returns {Promise<object|null>}
 */
async function getSummary(userId, paperId) {
  const storagePath = `users/${userId}/summaries/${paperId}.json`;
  const client = getClient();

  if (client) {
    try {
      const { data, error } = await client.storage.from(BUCKET_NAME).download(storagePath);
      if (!error && data) {
        const text = await data.text();
        return JSON.parse(text);
      }
    } catch (err) {
      // Not an error if file does not exist yet
      if (!err.message?.includes('not found') && !err.message?.includes('404')) {
        console.warn(`[Supabase Storage] getSummary notice for ${storagePath}:`, err.message);
      }
    }
  }

  // Check local filesystem fallback
  const localFile = path.join(__dirname, '../../uploads/summaries', String(userId), `${paperId}.json`);
  if (fs.existsSync(localFile)) {
    try {
      const raw = fs.readFileSync(localFile, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[Storage Fallback] Failed to read local summary file:`, err.message);
    }
  }

  return null;
}

/**
 * Delete Research Paper Summary from Supabase Storage and local fallback
 * @param {string} userId
 * @param {string} paperId
 */
async function deleteSummary(userId, paperId) {
  const storagePath = `users/${userId}/summaries/${paperId}.json`;
  const client = getClient();
  let deleted = false;

  if (client) {
    try {
      const { error } = await client.storage.from(BUCKET_NAME).remove([storagePath]);
      if (!error) {
        deleted = true;
        console.log(`[Supabase Storage] Summary removed: ${storagePath}`);
      }
    } catch (err) {
      console.warn(`[Supabase Storage] deleteSummary error for ${storagePath}:`, err.message);
    }
  }

  // Also remove local file if present
  const localFile = path.join(__dirname, '../../uploads/summaries', String(userId), `${paperId}.json`);
  if (fs.existsSync(localFile)) {
    try {
      fs.unlinkSync(localFile);
      deleted = true;
    } catch (_) {}
  }

  return deleted;
}

/**
 * Generate a temporary signed URL for private PDF access
 * @param {string} storagePath
 * @param {number} expiresInSeconds - Default 3600 (1 hour)
 */
async function createSignedUrl(storagePath, expiresInSeconds = 3600) {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    console.warn('[Supabase Storage] createSignedUrl failed:', error ? error.message : 'Unknown');
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete a PDF from Supabase Storage
 * @param {string} storagePath
 */
async function deletePdf(storagePath) {
  const client = getClient();
  if (!client || !storagePath) return false;

  try {
    const { error } = await client.storage.from(BUCKET_NAME).remove([storagePath]);
    if (error) {
      console.warn('[Supabase Storage] deletePdf warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Storage] deletePdf error:', err.message);
    return false;
  }
}

module.exports = {
  isConfigured,
  BUCKET_NAME,
  uploadPdfBuffer,
  uploadPdfFromFile,
  downloadPdfBuffer,
  createSignedUrl,
  deletePdf,
  uploadSummary,
  getSummary,
  deleteSummary,
};
