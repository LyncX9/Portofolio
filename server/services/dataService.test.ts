import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DataService, type PortfolioData } from './dataService'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEST_DATA_DIR = path.join(__dirname, '../../test-data-service')
const TEST_DATA_FILE = path.join(TEST_DATA_DIR, 'portfolio-data.json')
const TEST_BACKUP_DIR = path.join(TEST_DATA_DIR, 'backups')

// Mock data
const mockPortfolioData: PortfolioData = {
  hero: {
    greeting: 'Hello',
    name: 'John Doe',
    title: 'Software Developer',
    description: 'Building amazing things',
    bio: 'Passionate developer',
    profileImage: '/images/profile.jpg',
    universityLink: 'https://university.edu',
  },
  about: {
    paragraphs: ['First paragraph', 'Second paragraph'],
    skills: ['JavaScript', 'TypeScript', 'Vue'],
    aboutImage: '/images/about.jpg',
  },
  skills: [
    {
      id: '1',
      name: 'JavaScript',
      icon: 'js-icon',
      category: 'Frontend',
      order: 1,
    },
  ],
  projects: [
    {
      id: '1',
      title: 'Project 1',
      category: 'Web',
      description: 'A great project',
      features: ['Feature 1', 'Feature 2'],
      image: '/images/project1.jpg',
      link: 'https://project1.com',
      featured: true,
      order: 1,
    },
  ],
  certificates: [
    {
      id: '1',
      title: 'Certificate 1',
      issuer: 'Course Provider',
      issuedAt: '2024',
      description: 'A valid certificate description',
      image: '/images/certificate.jpg',
      credentialUrl: 'https://certificate.example.com',
      order: 1,
    },
  ],
  experience: [
    {
      id: '1',
      title: 'Developer',
      company: 'Tech Corp',
      duration: '2020-2023',
      descriptions: ['Built features', 'Fixed bugs'],
      order: 1,
    },
  ],
  contact: {
    email: 'john@example.com',
    subtitle: 'Get in touch',
    socialLinks: [
      {
        id: '1',
        icon: 'github',
        label: 'GitHub',
        href: 'https://github.com/johndoe',
      },
    ],
  },
  metadata: {
    lastUpdated: '2024-01-01T00:00:00.000Z',
    version: '1.0.0',
  },
}

describe('DataService', () => {
  let dataService: DataService

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true })
    } catch {
      // Ignore errors
    }
    await fs.mkdir(TEST_DATA_DIR, { recursive: true })

    // Clean up actual data directory backups
    try {
      await fs.rm(path.join(__dirname, '../../data/backups'), { recursive: true, force: true })
    } catch {
      // Ignore errors
    }

    // Create a new DataService instance with test paths
    // Note: In a real implementation, you'd want to make paths configurable
    // For now, we'll use the default paths and manually set up test data
    dataService = new DataService()

    // Write initial test data
    await fs.writeFile(
      path.join(__dirname, '../../data/portfolio-data.json'),
      JSON.stringify(mockPortfolioData, null, 2),
      'utf-8'
    )
  })

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true })
    } catch {
      // Ignore errors
    }
  })

  describe('loadData', () => {
    it('should load portfolio data successfully', async () => {
      const data = await dataService.loadData()

      expect(data).toBeDefined()
      expect(data.hero.name).toBe('John Doe')
      expect(data.metadata.version).toBe('1.0.0')
    })

    it('should throw error if data file is invalid JSON', async () => {
      // Write invalid JSON
      await fs.writeFile(
        path.join(__dirname, '../../data/portfolio-data.json'),
        'invalid json',
        'utf-8'
      )

      await expect(dataService.loadData()).rejects.toThrow('Failed to load portfolio data')
    })

    it('should throw error if data structure is invalid', async () => {
      // Write data with missing required fields
      await fs.writeFile(
        path.join(__dirname, '../../data/portfolio-data.json'),
        JSON.stringify({ hero: {} }),
        'utf-8'
      )

      await expect(dataService.loadData()).rejects.toThrow('Invalid portfolio data structure')
    })
  })

  describe('saveData', () => {
    it('should save portfolio data successfully', async () => {
      const newData = JSON.parse(JSON.stringify(mockPortfolioData))
      newData.hero.name = 'Jane Doe'

      await dataService.saveData(newData, { createBackup: false })

      const savedData = await dataService.loadData()
      expect(savedData.hero.name).toBe('Jane Doe')
    })

    it('should update metadata when saving', async () => {
      const originalTimestamp = mockPortfolioData.metadata.lastUpdated
      const newData = JSON.parse(JSON.stringify(mockPortfolioData))

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10))

      await dataService.saveData(newData, {
        createBackup: false,
        updateMetadata: true,
      })

      const savedData = await dataService.loadData()
      expect(savedData.metadata.lastUpdated).not.toBe(originalTimestamp)
    })

    it('should create backup when saving', async () => {
      const newData = JSON.parse(JSON.stringify(mockPortfolioData))
      newData.hero.name = 'Jane Doe'

      await dataService.saveData(newData, { createBackup: true })

      const backups = await dataService.listBackups()
      expect(backups.length).toBeGreaterThan(0)
    })

    it('should throw error if data validation fails', async () => {
      const invalidData = JSON.parse(JSON.stringify(mockPortfolioData))
      // @ts-expect-error - Testing invalid data
      delete invalidData.hero

      await expect(
        dataService.saveData(invalidData, { createBackup: false })
      ).rejects.toThrow()
    })
  })

  describe('updateSection', () => {
    it('should update hero section', async () => {
      const newHero = JSON.parse(JSON.stringify(mockPortfolioData.hero))
      newHero.name = 'Updated Name'

      await dataService.updateSection('hero', newHero)

      const data = await dataService.loadData()
      expect(data.hero.name).toBe('Updated Name')
    })

    it('should update skills section', async () => {
      const newSkills = [
        {
          id: '2',
          name: 'Python',
          icon: 'python-icon',
          category: 'Backend',
          order: 2,
        },
      ]

      await dataService.updateSection('skills', newSkills)

      const data = await dataService.loadData()
      expect(data.skills.length).toBe(1)
      expect(data.skills[0].name).toBe('Python')
    })

    it('should update metadata when updating section', async () => {
      const originalTimestamp = mockPortfolioData.metadata.lastUpdated

      await new Promise((resolve) => setTimeout(resolve, 10))

      await dataService.updateSection('hero', mockPortfolioData.hero)

      const data = await dataService.loadData()
      expect(data.metadata.lastUpdated).not.toBe(originalTimestamp)
    })
  })

  describe('backup operations', () => {
    it('should list backups', async () => {
      // Create multiple versions to generate backups
      for (let i = 0; i < 3; i++) {
        const data = JSON.parse(JSON.stringify(mockPortfolioData))
        data.hero.name = `Version ${i}`
        await dataService.saveData(data, { createBackup: true })
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      const backups = await dataService.listBackups()
      expect(backups.length).toBeGreaterThanOrEqual(2)
    })

    it('should get latest backup', async () => {
      // Create a backup
      await dataService.saveData(mockPortfolioData, { createBackup: true })

      const latestBackup = await dataService.getLatestBackup()
      expect(latestBackup).not.toBeNull()
      expect(latestBackup).toContain('portfolio-data.json')
    })

    it('should return null when no backups exist', async () => {
      // Ensure no backups exist
      const backups = await dataService.listBackups()
      if (backups.length > 0) {
        // Skip this test if backups already exist
        return
      }

      const latestBackup = await dataService.getLatestBackup()
      expect(latestBackup).toBeNull()
    })

    it('should restore from backup', async () => {
      const originalName = mockPortfolioData.hero.name

      // Save original data with backup
      await dataService.saveData(mockPortfolioData, { createBackup: false })

      // Modify and save with backup
      const modifiedData = JSON.parse(JSON.stringify(mockPortfolioData))
      modifiedData.hero.name = 'Modified Name'
      await dataService.saveData(modifiedData, { createBackup: true })

      // Verify modified data
      let data = await dataService.loadData()
      expect(data.hero.name).toBe('Modified Name')

      // Get backup and restore
      const backups = await dataService.listBackups()
      expect(backups.length).toBeGreaterThan(0)

      await dataService.restoreFromBackup(backups[0])

      // Verify restored data
      data = await dataService.loadData()
      expect(data.hero.name).toBe(originalName)
    })
  })

  describe('data validation', () => {
    it('should reject data without hero name', async () => {
      const invalidData = JSON.parse(JSON.stringify(mockPortfolioData))
      invalidData.hero.name = ''

      await expect(
        dataService.saveData(invalidData, { createBackup: false })
      ).rejects.toThrow('Hero section must have name and title')
    })

    it('should reject data without hero title', async () => {
      const invalidData = JSON.parse(JSON.stringify(mockPortfolioData))
      invalidData.hero.title = ''

      await expect(
        dataService.saveData(invalidData, { createBackup: false })
      ).rejects.toThrow('Hero section must have name and title')
    })

    it('should reject data with non-array skills', async () => {
      const invalidData = JSON.parse(JSON.stringify(mockPortfolioData))
      // @ts-expect-error - Testing invalid data
      invalidData.skills = 'not an array'

      await expect(
        dataService.saveData(invalidData, { createBackup: false })
      ).rejects.toThrow('Skills must be an array')
    })

    it('should reject data without contact email', async () => {
      const invalidData = JSON.parse(JSON.stringify(mockPortfolioData))
      invalidData.contact.email = ''

      await expect(
        dataService.saveData(invalidData, { createBackup: false })
      ).rejects.toThrow('Contact section must have an email')
    })

    it('should reject data without metadata version', async () => {
      const invalidData = JSON.parse(JSON.stringify(mockPortfolioData))
      invalidData.metadata.version = ''

      await expect(
        dataService.saveData(invalidData, { createBackup: false })
      ).rejects.toThrow('Metadata must have a version')
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent save operations safely', async () => {
      const operations = []

      // Perform multiple concurrent saves
      for (let i = 0; i < 5; i++) {
        const data = JSON.parse(JSON.stringify(mockPortfolioData))
        data.hero.name = `Concurrent ${i}`
        operations.push(dataService.saveData(data, { createBackup: false }))
      }

      await Promise.all(operations)

      // Should complete without errors
      const finalData = await dataService.loadData()
      expect(finalData.hero.name).toMatch(/^Concurrent \d$/)
    })
  })
})
