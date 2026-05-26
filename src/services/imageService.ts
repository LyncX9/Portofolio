import type { ImageUploadResponse, ApiResponse } from '@/types'
import {
  apiDelete,
  API_ENDPOINTS,
  getCsrfToken,
  handleAuthExpired,
  isAuthExpiredResponse,
  isCsrfErrorResponse,
  refreshCsrfToken,
  resolveMediaUrl
} from '@/utils/api'

/**
 * Image Service
 * Handles image upload, deletion, and replacement operations
 * with file validation and progress tracking.
 */

/** Accepted image MIME types */
export const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
] as const

/** Maximum upload size in bytes (5 MB) */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

/** Progress callback type — receives a value between 0 and 100 */
export type UploadProgressCallback = (percent: number) => void

function normalizeUploadResponse(data: ImageUploadResponse): ImageUploadResponse {
  return {
    ...data,
    url: resolveMediaUrl(data.url)
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate an image file before upload.
 *
 * @param file       - The file to validate
 * @param maxSizeMB  - Maximum allowed size in megabytes (default: 5)
 * @returns `{ valid: true }` or `{ valid: false, error: string }`
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  if (!VALID_IMAGE_TYPES.includes(file.type as (typeof VALID_IMAGE_TYPES)[number])) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.'
    }
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit.`
    }
  }

  return { valid: true }
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Upload an image file with optional progress tracking.
 *
 * Validates the file client-side before sending it to the server.
 * Uses XMLHttpRequest so that upload progress events are available.
 *
 * @param file       - The image file to upload
 * @param category   - Category sub-directory (e.g. 'hero', 'projects')
 * @param onProgress - Optional callback receiving upload percentage (0–100)
 */
export function uploadImage(
  file: File,
  category: string,
  onProgress?: UploadProgressCallback,
  hasRetried = false
): Promise<ApiResponse<ImageUploadResponse>> {
  // Client-side validation before hitting the network
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return Promise.resolve({
      success: false,
      error: validation.error
    })
  }

  return new Promise((resolve) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    const xhr = new XMLHttpRequest()

    // Progress tracking
    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(percent)
        }
      })
    }

    xhr.addEventListener('load', async () => {
      try {
        const data = JSON.parse(xhr.responseText)

        if (xhr.status >= 200 && xhr.status < 300) {
          const responseData = data.data || data
          resolve({
            success: true,
            data: normalizeUploadResponse(responseData),
            message: data.message
          })
          return
        }

        if (isCsrfErrorResponse(xhr.status, data) && !hasRetried) {
          const refreshed = await refreshCsrfToken()
          if (refreshed) {
            resolve(uploadImage(file, category, onProgress, true))
            return
          }
        }

        if (isAuthExpiredResponse(xhr.status, data)) {
          handleAuthExpired()
          resolve({
            success: false,
            error: 'Session expired. Please login again.',
            message: data.message
          })
          return
        }

        resolve({
          success: false,
          error: data.error || data.message || `HTTP ${xhr.status}: ${xhr.statusText}`,
          message: data.message
        })
      } catch {
        resolve({
          success: false,
          error: 'Failed to parse server response'
        })
      }
    })

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: 'Network error during upload'
      })
    })

    xhr.addEventListener('abort', () => {
      resolve({
        success: false,
        error: 'Upload was aborted'
      })
    })

    xhr.open('POST', API_ENDPOINTS.IMAGES_UPLOAD)
    xhr.withCredentials = true
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      xhr.setRequestHeader('x-csrf-token', csrfToken)
    }
    xhr.send(formData)
  })
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete an uploaded image by filename.
 *
 * @param filename - The filename returned by the upload endpoint
 */
export async function deleteImage(filename: string): Promise<ApiResponse<{ message: string }>> {
  return apiDelete<{ message: string }>(API_ENDPOINTS.IMAGES_DELETE(filename))
}

// ---------------------------------------------------------------------------
// Replace
// ---------------------------------------------------------------------------

/**
 * Replace an existing image with a new one.
 *
 * Uploads the new image first, then deletes the old one.
 * If the upload fails the old image is left untouched.
 * If the deletion of the old image fails a warning is logged but the
 * operation is still considered successful (the new image is live).
 *
 * @param oldFilename - Filename of the image to remove after upload
 * @param newFile     - New image file to upload
 * @param category    - Category sub-directory for the new image
 * @param onProgress  - Optional upload progress callback (0–100)
 */
export async function replaceImage(
  oldFilename: string,
  newFile: File,
  category: string,
  onProgress?: UploadProgressCallback
): Promise<ApiResponse<ImageUploadResponse>> {
  // Upload new image first — if this fails we abort without touching the old file
  const uploadResponse = await uploadImage(newFile, category, onProgress)

  if (!uploadResponse.success || !uploadResponse.data) {
    return uploadResponse
  }

  // Best-effort deletion of the old image
  if (oldFilename) {
    try {
      await deleteImage(oldFilename)
    } catch (error) {
      console.warn('Failed to delete old image:', error)
    }
  }

  return uploadResponse
}

// ---------------------------------------------------------------------------
// Named export object (for consumers that prefer object-style imports)
// ---------------------------------------------------------------------------

export const imageService = {
  uploadImage,
  deleteImage,
  replaceImage,
  validateImageFile
}
