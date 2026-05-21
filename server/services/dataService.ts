import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeDataAtomic, readDataWithRetry, listBackups, restoreFromBackup } from '../utils/fileOperations'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Paths configuration
const DATA_DIR = path.join(__dirname, '../../data')
const DATA_FILE = path.join(DATA_DIR, 'portfolio-data.json')
const BACKUP_DIR = path.join(DATA_DIR, 'backups')

/**
 * Portfolio data structure
 */
export interface PortfolioData {
  hero: {
    greeting: string
    name: string
    title: string
    description: string
    bio: string
    profileImage: string
    universityLink: string
  }
  about: {
    paragraphs: string[]
    skills: string[]
    aboutImage: string
  }
  skills: Array<{
    id: string
    name: string
    icon: string
    category: string
    order: number
  }>
  projects: Array<{
    id: string
    title: string
    category: string
    description: string
    features: string[]
    image: string
    link: string
    githubLink?: string
    featured: boolean
    order: number
  }>
  experience: Array<{
    id: string
    title: string
    company: string
    duration: string
    descriptions: string[]
    order: number
  }>
  contact: {
    email: string
    subtitle: string
    socialLinks: Array<{
      id: string
      icon: string
      label: string
      href: string
    }>
  }
  metadata: {
    lastUpdated: string
    version: string
  }
}

/**
 * Data service for portfolio content management
 * 
 * Provides safe read/write operations with automatic backups and atomic writes
 */
export class DataService {
  /**
   * Load portfolio data from disk
   * 
   * @returns Portfolio data object
   * @throws Error if file cannot be read or parsed
   */
  async loadData(): Promise<PortfolioData> {
    try {
      const rawData = await readDataWithRetry(DATA_FILE, {
        maxRetries: 3,
        initialDelay: 100,
      })

      const data = JSON.parse(rawData) as PortfolioData

      // Validate basic structure
      if (!data.metadata || !data.hero || !data.about) {
        throw new Error('Invalid portfolio data structure')
      }

      return data
    } catch (error) {
      throw new Error(
        `Failed to load portfolio data: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Save portfolio data to disk atomically
   * 
   * @param data - Portfolio data to save
   * @param options - Save options
   * @throws Error if validation fails or write operation fails
   */
  async saveData(
    data: PortfolioData,
    options: {
      createBackup?: boolean
      updateMetadata?: boolean
    } = {}
  ): Promise<void> {
    const { createBackup = true, updateMetadata = true } = options

    try {
      // Update metadata if requested
      if (updateMetadata) {
        data.metadata = {
          ...data.metadata,
          lastUpdated: new Date().toISOString(),
        }
      }

      // Validate data structure before writing
      this.validateData(data)

      // Convert to JSON with pretty printing
      const jsonData = JSON.stringify(data, null, 2)

      // Write atomically with backup
      await writeDataAtomic(DATA_FILE, jsonData, {
        createBackup,
        backupDir: BACKUP_DIR,
        maxRetries: 3,
        initialDelay: 100,
      })
    } catch (error) {
      throw new Error(
        `Failed to save portfolio data: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Update a specific section of portfolio data
   * 
   * @param section - Section name to update
   * @param sectionData - New data for the section
   */
  async updateSection<K extends keyof Omit<PortfolioData, 'metadata'>>(
    section: K,
    sectionData: PortfolioData[K]
  ): Promise<void> {
    // Load current data
    const data = await this.loadData()

    // Update the section
    data[section] = sectionData

    // Save with updated metadata
    await this.saveData(data, { createBackup: true, updateMetadata: true })
  }

  /**
   * List all available backups
   * 
   * @returns Array of backup file paths (newest first)
   */
  async listBackups(): Promise<string[]> {
    return listBackups(DATA_FILE, BACKUP_DIR)
  }

  /**
   * Restore data from a backup
   * 
   * @param backupPath - Path to the backup file
   * @throws Error if backup doesn't exist or restore fails
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      await restoreFromBackup(backupPath, DATA_FILE)
    } catch (error) {
      throw new Error(
        `Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get the most recent backup
   * 
   * @returns Path to the most recent backup, or null if no backups exist
   */
  async getLatestBackup(): Promise<string | null> {
    const backups = await this.listBackups()
    return backups.length > 0 ? backups[0] : null
  }

  /**
   * Validate portfolio data structure
   * 
   * @param data - Data to validate
   * @throws Error if validation fails
   */
  private validateData(data: PortfolioData): void {
    // Validate required top-level properties
    const requiredProps: (keyof PortfolioData)[] = [
      'hero',
      'about',
      'skills',
      'projects',
      'experience',
      'contact',
      'metadata',
    ]

    for (const prop of requiredProps) {
      if (!(prop in data)) {
        throw new Error(`Missing required property: ${prop}`)
      }
    }

    // Validate hero section
    if (!data.hero.name || !data.hero.title) {
      throw new Error('Hero section must have name and title')
    }

    // Validate arrays
    if (!Array.isArray(data.skills)) {
      throw new Error('Skills must be an array')
    }
    if (!Array.isArray(data.projects)) {
      throw new Error('Projects must be an array')
    }
    if (!Array.isArray(data.experience)) {
      throw new Error('Experience must be an array')
    }

    // Validate contact
    if (!data.contact.email) {
      throw new Error('Contact section must have an email')
    }

    // Validate metadata
    if (!data.metadata.version) {
      throw new Error('Metadata must have a version')
    }
  }
}

// Export singleton instance
export const dataService = new DataService()
