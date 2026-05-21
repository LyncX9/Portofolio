import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import fs from 'fs/promises'
import path from 'path'
import imageRoutes from './images'
import { createSession } from '../auth/sessions'

// Mock the auth middleware
vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => next()
}))

// Mock the CSRF middleware so unit tests don't need a CSRF token
vi.mock('../middleware/csrf', () => ({
  validateCsrfToken: (req: any, res: any, next: any) => next(),
  setCsrfToken: (req: any, res: any, next: any) => next(),
  clearCsrfToken: (req: any, res: any, next: any) => next(),
  generateCsrfToken: () => 'test-csrf-token'
}))

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/images', imageRoutes)

describe('Image Upload API', () => {
  const testUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'test')

  beforeEach(async () => {
    // Clean up test uploads directory
    try {
      await fs.rm(testUploadsDir, { recursive: true, force: true })
    } catch (error) {
      // Directory might not exist
    }
  })

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(testUploadsDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('POST /api/images/upload', () => {
    it('should upload a valid JPG image', async () => {
      // Create a small test image buffer (1x1 pixel JPG)
      const imageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43
      ])

      const response = await request(app)
        .post('/api/images/upload')
        .field('category', 'test')
        .attach('file', imageBuffer, 'test.jpg')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('filename')
      expect(response.body.data).toHaveProperty('url')
      expect(response.body.data).toHaveProperty('size')
      expect(response.body.data.url).toMatch(/^\/uploads\/test\/test-\d+-[a-f0-9-]+\.jpg$/)
    })

    it('should upload a valid PNG image', async () => {
      // Create a small test PNG buffer
      const imageBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
      ])

      const response = await request(app)
        .post('/api/images/upload')
        .field('category', 'test')
        .attach('file', imageBuffer, 'test.png')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.url).toMatch(/\.png$/)
    })

    it('should reject non-image files', async () => {
      const textBuffer = Buffer.from('This is not an image')

      const response = await request(app)
        .post('/api/images/upload')
        .field('category', 'test')
        .attach('file', textBuffer, 'test.txt')

      // Multer rejects the file before it reaches the route handler
      expect(response.status).toBe(500)
      // The error message is in the response body
      expect(response.body).toBeDefined()
    })

    it('should reject files exceeding 5MB', async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024)

      const response = await request(app)
        .post('/api/images/upload')
        .field('category', 'test')
        .attach('file', largeBuffer, 'large.jpg')

      // Multer returns 500 for file size errors
      expect(response.status).toBe(500)
      expect(response.body).toBeDefined()
    })

    it('should return error when no file is provided', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .field('category', 'test')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('No file provided')
    })

    it('should use default category when not provided', async () => {
      const imageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43
      ])

      const response = await request(app)
        .post('/api/images/upload')
        .attach('file', imageBuffer, 'test.jpg')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.url).toMatch(/^\/uploads\/general\//)
    })

    it('should reject invalid category names', async () => {
      const imageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43
      ])

      const response = await request(app)
        .post('/api/images/upload')
        .field('category', '../../../etc')
        .attach('file', imageBuffer, 'test.jpg')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid category name')
    })

    it('should generate unique filenames for multiple uploads', async () => {
      const imageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43
      ])

      const response1 = await request(app)
        .post('/api/images/upload')
        .field('category', 'test')
        .attach('file', imageBuffer, 'test.jpg')

      const response2 = await request(app)
        .post('/api/images/upload')
        .field('category', 'test')
        .attach('file', imageBuffer, 'test.jpg')

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(response1.body.data.filename).not.toBe(response2.body.data.filename)
    })

    it('should create category directory if it does not exist', async () => {
      const imageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43
      ])

      const response = await request(app)
        .post('/api/images/upload')
        .field('category', 'newcategory')
        .attach('file', imageBuffer, 'test.jpg')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)

      // Verify directory was created
      const dirPath = path.join(process.cwd(), 'public', 'uploads', 'newcategory')
      const dirExists = await fs.access(dirPath).then(() => true).catch(() => false)
      expect(dirExists).toBe(true)

      // Clean up
      await fs.rm(dirPath, { recursive: true, force: true })
    })
  })

  describe('DELETE /api/images/:filename', () => {
    it('should delete an existing image', async () => {
      // First upload an image
      const imageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43
      ])

      const uploadResponse = await request(app)
        .post('/api/images/upload')
        .field('category', 'test')
        .attach('file', imageBuffer, 'test.jpg')

      const filename = uploadResponse.body.data.filename

      // Now delete it
      const deleteResponse = await request(app)
        .delete(`/api/images/${filename}`)

      expect(deleteResponse.status).toBe(200)
      expect(deleteResponse.body.success).toBe(true)
      expect(deleteResponse.body.message).toBe('Image deleted successfully')

      // Verify file was deleted
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'test', filename)
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false)
      expect(fileExists).toBe(false)
    })

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/api/images/test-1234567890-abc123.jpg')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('File not found')
    })

    it('should reject invalid filename format', async () => {
      const response = await request(app)
        .delete('/api/images/invalid-filename')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid filename format')
    })

    it('should reject filenames with path traversal attempts', async () => {
      const response = await request(app)
        .delete('/api/images/../../../etc/passwd')

      // Express routing doesn't match this pattern, returns 404
      expect(response.status).toBe(404)
    })
  })
})
