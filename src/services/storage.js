/**
 * Wrapper around Supabase Storage for file uploads. Centralizes bucket names,
 * path conventions, and upload/delete logic so features never touch Supabase
 * storage APIs directly.
 */
import { supabase } from "./apiClient";

export const BUCKETS = {
  AVATARS: "avatars",
  THUMBNAILS: "course-thumbnails",
  LESSON_MEDIA: "lesson-media",
  CERTIFICATES: "certificates",
};

const MIME_LISTS = {
  [BUCKETS.AVATARS]: ["image/jpeg", "image/png", "image/webp"],
  [BUCKETS.THUMBNAILS]: ["image/jpeg", "image/png", "image/webp"],
  [BUCKETS.LESSON_MEDIA]: ["video/mp4", "video/webm"],
  [BUCKETS.CERTIFICATES]: ["image/jpeg", "image/png", "application/pdf"],
};

const DEFAULT_MAX_SIZE_MB = 5;

export async function uploadFile(bucket, path, file, options = {}) {
  try {
    if (!file) {
      return { url: null, error: "No file provided." };
    }

    const maxSizeMB = options.maxSizeMB ?? DEFAULT_MAX_SIZE_MB;
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        url: null,
        error: `File exceeds the ${maxSizeMB}MB size limit.`,
      };
    }

    const allowedMimes = MIME_LISTS[bucket];
    if (allowedMimes && !allowedMimes.includes(file.type)) {
      return { url: null, error: `Unsupported file type: ${file.type || "unknown"}.` };
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: options.upsert ?? false });

    if (error) {
      return { url: null, error: normalizeError(error) };
    }

    return { url: getPublicUrl(bucket, path), error: null };
  } catch (err) {
    return { url: null, error: normalizeError(err) };
  }
}

export async function deleteFile(bucket, path) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      return { success: false, error: normalizeError(error) };
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: normalizeError(err) };
  }
}

export function getPublicUrl(bucket, path) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function getSignedUrl(bucket, path, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    return { url: null, error: normalizeError(error) };
  }
  return { url: data.signedUrl, error: null };
}

function normalizeError(error) {
  return {
    message: error?.message || "Upload failed. Please try again.",
    code: error?.code || "UNKNOWN",
  };
}
