import express, { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '../middleware/auth'
import { validateCsrfToken } from '../middleware/csrf'

const router = express.Router()

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Configure multer for memory storage (we'll handle file saving manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.'))
    }
  }
})

/**
 * POST /api/images/upload
 * Upload an image file
 * Requires authentication
 */
router.post('/upload', requireAuth, validateCsrfToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      })
    }

    // Get category from request body (default to 'general')
    const category = req.body.category || 'general'

    // Validate category (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category name'
      })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const uuid = uuidv4()
    const extension = path.extname(req.file.originalname).toLowerCase()
    const filename = `${category}-${timestamp}-${uuid}${extension}`

    // Create uploads directory structure if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', category)
    await fs.mkdir(uploadsDir, { recursive: true })

    // Save file
    const filePath = path.join(uploadsDir, filename)
    await fs.writeFile(filePath, req.file.buffer)

    // Generate public URL
    const url = `/uploads/${category}/${filename}`

    res.json({
      success: true,
      data: {
        filename,
        url,
        size: req.file.size
      }
    })
  } catch (error) {
    console.error('Image upload error:', error)
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds 5MB limit'
        })
      }
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    })
  }
})

/**
 * DELETE /api/images/:filename
 * Delete an uploaded image
 * Requires authentication
 */
router.delete('/:filename', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params

    // Validate filename format (category-timestamp-uuid.ext)
    if (!/^[a-zA-Z0-9-]+\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename format'
      })
    }

    // Extract category from filename
    const parts = filename.split('-')
    if (parts.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename format'
      })
    }
    const category = parts[0]

    // Construct file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', category, filename)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    // Delete file
    await fs.unlink(filePath)

    res.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Image deletion error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    })
  }
})

export default router
