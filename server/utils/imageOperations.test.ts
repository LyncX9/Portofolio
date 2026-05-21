import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { replaceImage, ImageReplaceError } from './imageOperations'
import { dataService } from '../services/dataService'

// Mock the data service
vi.mock('../services/dataService', () => {
  const mockData = {
    hero: {
      greeting: 'Hello',
      name: 'Test User',
      title: 'Developer',
      description: 'Test description',
      bio: 'Test bio',
      profileImage: '/uploads/hero/hero-1234567890-old-uuid.jpg',
      universityLink: 'https://example.com'
    },
    about: {
      paragraphs: ['Test paragraph'],
      skills: ['JavaScript'],
      aboutImage: '/uploads/about/about-1234567890-old-uuid.jpg'
    },
    skills: [],
    projects: [
      {
        id: 'project-1',
        title: 'Test Project',
        category: 'Web',
        description: 'Test description',
        features: ['Feature 1'],
        image: '/uploads/projects/projects-1234567890-old-uuid.jpg',
        link: 'https://example.com',
        featured: false,
        order: 1
      }
    ],
    experience: [],
    contact: {
      email: 'test@example.com',
      subtitle: 'Get in touch',
      socialLinks: []
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    }
  }

  return {
    dataService: {
      loadData: vi.fn().mockResolvedValue(mockData),
      saveData: vi.fn().mockResolvedValue(undefined)
    },
    PortfolioData: {}
  }
})

describe('Image Operations - replaceImage', () => {
  const testUploadsDir = path.join(process.cwd(), 'public', 'uploads')

  // Create a valid test image buffer (1x1 pixel JPG)
  const validImageBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43
  ])

  beforeEach(async () => {
    // Clean up test uploads directory
    try {
      await fs.rm(testUploadsDir, { recursive: true, force: true })
    } catch (error) {
      // Directory might not exist
    }

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(testUploadsDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('Successful image replacement', () => {
    it('should replace hero profile image successfully', async () => {
      // Create old image file
      const oldImagePath = path.join(testUploadsDir, 'hero', 'hero-1234567890-old-uuid.jpg')
      await fs.mkdir(path.dirname(oldImagePath), { recursive: true })
      await fs.writeFile(oldImagePath, validImageBuffer)

      const result = await replaceImage({
        newImageBuffer: validImageBuffer,
        newImageMimetype: 'image/jpeg',
        newImageOriginalName: 'new-profile.jpg',
        oldImageUrl: '/uploads/hero/hero-1234567890-old-uuid.jpg',
        category: 'hero',
        section: 'hero',
        field: 'profileImage'
      })

      expect(result.success).toBe(true)
      expect(result.newImageUrl).toMatch(/^\/uploads\/hero\/hero-\d+-[a-f0-9-]+\.jpg$/)
      expect(result.oldImageUrl).toBe('/uploads/hero/hero-1234567890-old-uuid.jpg')
      expect(result.message).toBe('Image replaced successfully')

      // Verify new image was created
      const newFilename = result.newImageUrl.split('/').pop()!
      const newImagePath = path.join(testUploadsDir, 'hero', newFilename)
      const newImageExists = await fs.access(newImagePath).then(() => true).catch(() => false)
      expect(newImageExists).toBe(true)

      // Verify old image was deleted
      const oldImageExists = await fs.access(oldImagePath).then(() => true).catch(() => false)
      expect(oldImageExists).toBe(false)

      // Verify content was updated
      expect(dataService.saveData).toHaveBeenCalledWith(
        expect.objectContaining({
          hero: expect.objectContaining({
            profileImage: result.newImageUrl
          })
        }),
        expect.objectContaining({
          createBackup: true,
          updateMetadata: true
        })
      )
    })

    it('should replace about image successfully', async () => {
      // Create old image file
      const oldImagePath = path.join(testUploadsDir, 'about', 'about-1234567890-old-uuid.jpg')
      await fs.mkdir(path.dirname(oldImagePath), { recursive: true })
      await fs.writeFile(oldImagePath, validImageBuffer)

      const result = await replaceImage({
        newImageBuffer: validImageBuffer,
        newImageMimetype: 'image/png',
        newImageOriginalName: 'new-about.png',
        oldImageUrl: '/uploads/about/about-1234567890-old-uuid.jpg',
        category: 'about',
        section: 'about',
        field: 'aboutImage'
      })

      expect(result.success).toBe(true)
      expect(result.newImageUrl).toMatch(/^\/uploads\/about\/about-\d+-[a-f0-9-]+\.png$/)
    })

    it('should replace project image successfully', async () => {
      // Create old image file
      const oldImagePath = path.join(testUploadsDir, 'projects', 'projects-1234567890-old-uuid.jpg')
      await fs.mkdir(path.dirname(oldImagePath), { recursive: true })
      await fs.writeFile(oldImagePath, validImageBuffer)

      const result = await replaceImage({
        newImageBuffer: validImageBuffer,
        newImageMimetype: 'image/jpeg',
        newImageOriginalName: 'new-project.jpg',
        oldImageUrl: '/uploads/projects/projects-1234567890-old-uuid.jpg',
        category: 'projects',
        section: 'projects',
        field: 'image',
        itemId: 'project-1'
      })

      expect(result.success).toBe(true)
      expect(result.newImageUrl).toMatch(/^\/uploads\/projects\/projects-\d+-[a-f0-9-]+\.jpg$/)
    })

    it('should handle case when old image does not exist', async () => {
      // Don't create old image file - it doesn't exist

      const result = await replaceImage({
        newImageBuffer: validImageBuffer,
        newImageMimetype: 'image/jpeg',
        newImageOriginalName: 'new-profile.jpg',
        oldImageUrl: '/uploads/hero/hero-1234567890-nonexistent.jpg',
        category: 'hero',
        section: 'hero',
        field: 'profileImage'
      })

      expect(result.success).toBe(true)
      expect(result.newImageUrl).toMatch(/^\/uploads\/hero\/hero-\d+-[a-f0-9-]+\.jpg$/)
      
      // Should still succeed even though old image didn't exist
      const newFilename = result.newImageUrl.split('/').pop()!
      const newImagePath = path.join(testUploadsDir, 'hero', newFilename)
      const newImageExists = await fs.access(newImagePath).then(() => true).catch(() => false)
      expect(newImageExists).toBe(true)
    })

    it('should support different image formats', async () => {
      const formats = [
        { mimetype: 'image/jpeg', ext: '.jpg' },
        { mimetype: 'image/png', ext: '.png' },
        { mimetype: 'image/gif', ext: '.gif' },
        { mimetype: 'image/webp', ext: '.webp' }
      ]

      for (const format of formats) {
        const result = await replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: format.mimetype,
          newImageOriginalName: `test${format.ext}`,
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })

        expect(result.success).toBe(true)
        expect(result.newImageUrl).toContain(format.ext)
      }
    })
  })

  describe('Validation errors', () => {
    it('should reject invalid MIME type', async () => {
      await expect(
        replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: 'text/plain',
          newImageOriginalName: 'test.txt',
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })
      ).rejects.toThrow(ImageReplaceError)

      await expect(
        replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: 'text/plain',
          newImageOriginalName: 'test.txt',
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })
      ).rejects.toThrow(/Invalid file type/)
    })

    it('should reject file exceeding size limit', async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024)

      await expect(
        replaceImage({
          newImageBuffer: largeBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'large.jpg',
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })
      ).rejects.toThrow(ImageReplaceError)

      await expect(
        replaceImage({
          newImageBuffer: largeBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'large.jpg',
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })
      ).rejects.toThrow(/File size exceeds 5MB limit/)
    })

    it('should reject empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0)

      await expect(
        replaceImage({
          newImageBuffer: emptyBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'empty.jpg',
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })
      ).rejects.toThrow(ImageReplaceError)

      await expect(
        replaceImage({
          newImageBuffer: emptyBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'empty.jpg',
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })
      ).rejects.toThrow(/File buffer is empty/)
    })
  })

  describe('Content update errors', () => {
    it('should require itemId for array-based sections', async () => {
      await expect(
        replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'test.jpg',
          oldImageUrl: '/uploads/projects/projects-1234567890-old.jpg',
          category: 'projects',
          section: 'projects',
          field: 'image'
          // Missing itemId
        })
      ).rejects.toThrow(ImageReplaceError)

      await expect(
        replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'test.jpg',
          oldImageUrl: '/uploads/projects/projects-1234567890-old.jpg',
          category: 'projects',
          section: 'projects',
          field: 'image'
        })
      ).rejects.toThrow(/Item ID is required/)
    })

    it('should handle non-existent item ID', async () => {
      await expect(
        replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'test.jpg',
          oldImageUrl: '/uploads/projects/projects-1234567890-old.jpg',
          category: 'projects',
          section: 'projects',
          field: 'image',
          itemId: 'non-existent-id'
        })
      ).rejects.toThrow(ImageReplaceError)

      await expect(
        replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'test.jpg',
          oldImageUrl: '/uploads/projects/projects-1234567890-old.jpg',
          category: 'projects',
          section: 'projects',
          field: 'image',
          itemId: 'non-existent-id'
        })
      ).rejects.toThrow(/not found/)
    })
  })

  describe('Rollback on failure', () => {
    it('should rollback when content update fails', async () => {
      // Mock saveData to fail
      vi.mocked(dataService.saveData).mockRejectedValueOnce(new Error('Save failed'))

      await expect(
        replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'test.jpg',
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })
      ).rejects.toThrow(ImageReplaceError)

      // Verify new image was cleaned up (rollback)
      const files = await fs.readdir(path.join(testUploadsDir, 'hero')).catch(() => [])
      expect(files.length).toBe(0)
    })

    it('should include phase information in error', async () => {
      // Mock saveData to fail
      vi.mocked(dataService.saveData).mockRejectedValueOnce(new Error('Save failed'))

      try {
        await replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'test.jpg',
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(ImageReplaceError)
        expect((error as ImageReplaceError).phase).toBe('update')
      }
    })

    it('should handle rollback when content update fails', async () => {
      // Mock saveData to fail
      vi.mocked(dataService.saveData).mockRejectedValueOnce(new Error('Save failed'))

      await expect(
        replaceImage({
          newImageBuffer: validImageBuffer,
          newImageMimetype: 'image/jpeg',
          newImageOriginalName: 'test.jpg',
          oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
          category: 'hero',
          section: 'hero',
          field: 'profileImage'
        })
      ).rejects.toThrow(ImageReplaceError)

      // Verify new image was cleaned up (rollback)
      const files = await fs.readdir(path.join(testUploadsDir, 'hero')).catch(() => [])
      expect(files.length).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle sequential replacements', async () => {
      // Create old image file
      const oldImagePath = path.join(testUploadsDir, 'hero', 'hero-1234567890-old-uuid.jpg')
      await fs.mkdir(path.dirname(oldImagePath), { recursive: true })
      await fs.writeFile(oldImagePath, validImageBuffer)

      // Reset mocks to ensure fresh state for each call
      vi.clearAllMocks()
      vi.mocked(dataService.loadData).mockResolvedValue({
        hero: {
          greeting: 'Hello',
          name: 'Test User',
          title: 'Developer',
          description: 'Test description',
          bio: 'Test bio',
          profileImage: '/uploads/hero/hero-1234567890-old-uuid.jpg',
          universityLink: 'https://example.com'
        },
        about: {
          paragraphs: ['Test paragraph'],
          skills: ['JavaScript'],
          aboutImage: '/uploads/about/about-1234567890-old-uuid.jpg'
        },
        skills: [],
        projects: [],
        experience: [],
        contact: {
          email: 'test@example.com',
          subtitle: 'Get in touch',
          socialLinks: []
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      })
      vi.mocked(dataService.saveData).mockResolvedValue(undefined)

      // Perform two replacements sequentially
      const result1 = await replaceImage({
        newImageBuffer: validImageBuffer,
        newImageMimetype: 'image/jpeg',
        newImageOriginalName: 'new1.jpg',
        oldImageUrl: '/uploads/hero/hero-1234567890-old-uuid.jpg',
        category: 'hero',
        section: 'hero',
        field: 'profileImage'
      })

      const result2 = await replaceImage({
        newImageBuffer: validImageBuffer,
        newImageMimetype: 'image/jpeg',
        newImageOriginalName: 'new2.jpg',
        oldImageUrl: result1.newImageUrl,
        category: 'hero',
        section: 'hero',
        field: 'profileImage'
      })

      // Both should succeed
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Should generate different filenames
      expect(result1.newImageUrl).not.toBe(result2.newImageUrl)
    })

    it('should handle special characters in original filename', async () => {
      const result = await replaceImage({
        newImageBuffer: validImageBuffer,
        newImageMimetype: 'image/jpeg',
        newImageOriginalName: 'test image (1) [copy].jpg',
        oldImageUrl: '/uploads/hero/hero-1234567890-old.jpg',
        category: 'hero',
        section: 'hero',
        field: 'profileImage'
      })

      expect(result.success).toBe(true)
      // Extension should be preserved
      expect(result.newImageUrl).toMatch(/\.jpg$/)
    })

    it('should create category directory if it does not exist', async () => {
      const result = await replaceImage({
        newImageBuffer: validImageBuffer,
        newImageMimetype: 'image/jpeg',
        newImageOriginalName: 'test.jpg',
        oldImageUrl: '/uploads/newcategory/newcategory-1234567890-old.jpg',
        category: 'newcategory',
        section: 'hero',
        field: 'profileImage'
      })

      expect(result.success).toBe(true)

      // Verify directory was created
      const dirPath = path.join(testUploadsDir, 'newcategory')
      const dirExists = await fs.access(dirPath).then(() => true).catch(() => false)
      expect(dirExists).toBe(true)
    })
  })
})
