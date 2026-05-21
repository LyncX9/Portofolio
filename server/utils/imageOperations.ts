import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { dataService, PortfolioData } from '../services/dataService'

/**
 * Result of an image replacement operation
 */
export interface ImageReplaceResult {
  success: boolean
  newImageUrl: string
  oldImageUrl: string
  message: string
}

/**
 * Error thrown when image replacement fails
 */
export class ImageReplaceError extends Error {
  constructor(
    message: string,
    public readonly phase: 'upload' | 'update' | 'delete' | 'rollback',
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'ImageReplaceError'
  }
}

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]

/**
 * Maximum file size: 5MB
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Extract the filename from a URL or path
 * @param urlOrPath - URL or file path
 * @returns Filename only
 */
function extractFilename(urlOrPath: string): string {
  // Handle URLs like "/uploads/hero/hero-123456-uuid.jpg"
  // Handle paths like "public/uploads/hero/hero-123456-uuid.jpg"
  const parts = urlOrPath.split('/')
  return parts[parts.length - 1]
}

/**
 * Extract the category from a filename
 * @param filename - Filename in format "category-timestamp-uuid.ext"
 * @returns Category name
 */
function extractCategory(filename: string): string {
  const parts = filename.split('-')
  if (parts.length < 3) {
    throw new Error('Invalid filename format')
  }
  return parts[0]
}

/**
 * Get the full file path for an image
 * @param filename - Image filename
 * @param category - Image category
 * @returns Absolute file path
 */
function getImagePath(filename: string, category: string): string {
  return path.join(process.cwd(), 'public', 'uploads', category, filename)
}

/**
 * Validate image file
 * @param buffer - File buffer
 * @param mimetype - File MIME type
 * @param size - File size in bytes
 * @throws Error if validation fails
 */
function validateImageFile(buffer: Buffer, mimetype: string, size: number): void {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    throw new Error(
      `Invalid file type: ${mimetype}. Only JPG, PNG, GIF, and WebP are allowed.`
    )
  }

  // Validate file size
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 5MB limit. File size: ${(size / 1024 / 1024).toFixed(2)}MB`)
  }

  // Validate buffer is not empty
  if (buffer.length === 0) {
    throw new Error('File buffer is empty')
  }
}

/**
 * Save an image file to disk
 * @param buffer - File buffer
 * @param filename - Target filename
 * @param category - Image category
 * @returns Public URL of the saved image
 */
async function saveImageFile(
  buffer: Buffer,
  filename: string,
  category: string
): Promise<string> {
  // Create uploads directory structure if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', category)
  await fs.mkdir(uploadsDir, { recursive: true })

  // Save file
  const filePath = getImagePath(filename, category)
  await fs.writeFile(filePath, buffer)

  // Generate public URL
  return `/uploads/${category}/${filename}`
}

/**
 * Delete an image file from disk
 * @param filename - Filename to delete
 * @param category - Image category
 * @returns True if file was deleted, false if file didn't exist
 */
async function deleteImageFile(filename: string, category: string): Promise<boolean> {
  try {
    const filePath = getImagePath(filename, category)
    
    // Check if file exists
    await fs.access(filePath)
    
    // Delete file
    await fs.unlink(filePath)
    
    return true
  } catch (error) {
    // File doesn't exist or couldn't be deleted
    return false
  }
}

/**
 * Update content reference to point to new image
 * @param section - Content section to update
 * @param field - Field name containing the image URL
 * @param newImageUrl - New image URL
 * @param itemId - Optional item ID for array-based sections (projects, skills, etc.)
 * @returns Old image URL
 */
async function updateContentReference(
  section: keyof Omit<PortfolioData, 'metadata'>,
  field: string,
  newImageUrl: string,
  itemId?: string
): Promise<string> {
  // Load current data
  const data = await dataService.loadData()

  let oldImageUrl: string

  // Handle different section types
  if (section === 'hero' || section === 'about' || section === 'contact') {
    // Simple object sections
    const sectionData = data[section] as any
    oldImageUrl = sectionData[field] || ''
    sectionData[field] = newImageUrl
  } else if (section === 'skills' || section === 'projects' || section === 'experience') {
    // Array-based sections
    if (!itemId) {
      throw new Error(`Item ID is required for ${section} section`)
    }

    const items = data[section] as any[]
    const item = items.find((i: any) => i.id === itemId)

    if (!item) {
      throw new Error(`Item with ID ${itemId} not found in ${section} section`)
    }

    oldImageUrl = item[field] || ''
    item[field] = newImageUrl
  } else {
    throw new Error(`Unsupported section: ${section}`)
  }

  // Save updated data
  await dataService.saveData(data, { createBackup: true, updateMetadata: true })

  return oldImageUrl
}

/**
 * Replace an image with proper error handling and rollback
 * 
 * This function orchestrates the image replacement process:
 * 1. Validates and uploads the new image
 * 2. Updates the content reference to point to the new image
 * 3. Deletes the old image file
 * 4. Handles errors with automatic rollback
 * 
 * @param options - Replacement options
 * @param options.newImageBuffer - Buffer containing the new image data
 * @param options.newImageMimetype - MIME type of the new image
 * @param options.newImageOriginalName - Original filename of the new image
 * @param options.oldImageUrl - URL or path of the image to replace
 * @param options.category - Image category (hero, about, projects, etc.)
 * @param options.section - Content section to update
 * @param options.field - Field name containing the image URL
 * @param options.itemId - Optional item ID for array-based sections
 * 
 * @returns Result object with success status and URLs
 * @throws ImageReplaceError if replacement fails
 * 
 * @example
 * ```typescript
 * const result = await replaceImage({
 *   newImageBuffer: fileBuffer,
 *   newImageMimetype: 'image/jpeg',
 *   newImageOriginalName: 'profile.jpg',
 *   oldImageUrl: '/uploads/hero/hero-123456-old.jpg',
 *   category: 'hero',
 *   section: 'hero',
 *   field: 'profileImage'
 * })
 * ```
 */
export async function replaceImage(options: {
  newImageBuffer: Buffer
  newImageMimetype: string
  newImageOriginalName: string
  oldImageUrl: string
  category: string
  section: keyof Omit<PortfolioData, 'metadata'>
  field: string
  itemId?: string
}): Promise<ImageReplaceResult> {
  const {
    newImageBuffer,
    newImageMimetype,
    newImageOriginalName,
    oldImageUrl,
    category,
    section,
    field,
    itemId
  } = options

  let newImageUrl: string | null = null
  let newFilename: string | null = null
  let contentUpdated = false
  let previousImageUrl: string | null = null

  try {
    // Phase 1: Validate and upload new image
    try {
      // Validate the new image
      validateImageFile(newImageBuffer, newImageMimetype, newImageBuffer.length)

      // Generate unique filename
      const timestamp = Date.now()
      const uuid = uuidv4()
      const extension = path.extname(newImageOriginalName).toLowerCase()
      newFilename = `${category}-${timestamp}-${uuid}${extension}`

      // Save the new image
      newImageUrl = await saveImageFile(newImageBuffer, newFilename, category)
    } catch (error) {
      throw new ImageReplaceError(
        `Failed to upload new image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'upload',
        error instanceof Error ? error : undefined
      )
    }

    // Phase 2: Update content reference
    try {
      previousImageUrl = await updateContentReference(section, field, newImageUrl, itemId)
      contentUpdated = true
    } catch (error) {
      throw new ImageReplaceError(
        `Failed to update content reference: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'update',
        error instanceof Error ? error : undefined
      )
    }

    // Phase 3: Delete old image file
    try {
      if (oldImageUrl && oldImageUrl !== previousImageUrl) {
        console.warn(
          `Warning: oldImageUrl (${oldImageUrl}) doesn't match previousImageUrl (${previousImageUrl})`
        )
      }

      const imageUrlToDelete = previousImageUrl || oldImageUrl

      if (imageUrlToDelete) {
        const oldFilename = extractFilename(imageUrlToDelete)
        const oldCategory = extractCategory(oldFilename)
        
        const deleted = await deleteImageFile(oldFilename, oldCategory)
        
        if (!deleted) {
          console.warn(`Old image file not found or couldn't be deleted: ${oldFilename}`)
        }
      }
    } catch (error) {
      // Log error but don't fail the operation since the new image is already in place
      console.error('Failed to delete old image:', error)
      throw new ImageReplaceError(
        `Failed to delete old image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'delete',
        error instanceof Error ? error : undefined
      )
    }

    // Success!
    return {
      success: true,
      newImageUrl,
      oldImageUrl: previousImageUrl || oldImageUrl,
      message: 'Image replaced successfully'
    }
  } catch (error) {
    // Rollback on error
    if (error instanceof ImageReplaceError) {
      // Attempt rollback based on which phase failed
      try {
        if (contentUpdated && previousImageUrl) {
          // Rollback content reference
          await updateContentReference(section, field, previousImageUrl, itemId)
        }

        if (newFilename && newImageUrl) {
          // Delete the newly uploaded image
          await deleteImageFile(newFilename, category)
        }
      } catch (rollbackError) {
        // Rollback failed - log error
        console.error('Rollback failed:', rollbackError)
        throw new ImageReplaceError(
          `Image replacement failed and rollback also failed: ${error.message}`,
          'rollback',
          rollbackError instanceof Error ? rollbackError : undefined
        )
      }

      // Re-throw the original error
      throw error
    }

    // Unknown error
    throw new ImageReplaceError(
      `Unexpected error during image replacement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'upload',
      error instanceof Error ? error : undefined
    )
  }
}
