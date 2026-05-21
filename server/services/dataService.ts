import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeDataAtomic, readDataWithRetry, listBackups, restoreFromBackup } from '../utils/fileOperations'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Paths configuration (used as fallback when Supabase is not configured)
const DATA_DIR = path.join(__dirname, '../../data')
const DATA_FILE = path.join(DATA_DIR, 'portfolio-data.json')
const BACKUP_DIR = path.join(DATA_DIR, 'backups')

// Row ID used in Supabase — we always use a single row
const PORTFOLIO_ROW_ID = 1

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
 * Determine whether Supabase is configured.
 * Returns true only when both env vars are present.
 */
function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

/**
 * Lazily import the Supabase client so the app still starts without it.
 */
async function getSupabase() {
  const { supabase } = await import('./supabaseClient.js')
  return supabase
}

/**
 * Data service for portfolio content management.
 *
 * Storage strategy:
 * - When SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set → Supabase PostgreSQL
 * - Otherwise → local JSON file (development / fallback)
 *
 * The Supabase table schema (run once in the Supabase SQL editor):
 *
 *   CREATE TABLE IF NOT EXISTS portfolio_data (
 *     id   INTEGER PRIMARY KEY DEFAULT 1,
 *     data JSONB   NOT NULL,
 *     updated_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *
 *   -- Ensure only one row ever exists
 *   CREATE UNIQUE INDEX IF NOT EXISTS portfolio_data_single_row ON portfolio_data ((id = 1));
 *
 *   -- Seed with empty structure (the app will upsert on first save)
 *   INSERT INTO portfolio_data (id, data) VALUES (1, '{}'::jsonb)
 *   ON CONFLICT (id) DO NOTHING;
 *
 *   -- Disable Row Level Security for server-side access via service role key
 *   ALTER TABLE portfolio_data DISABLE ROW LEVEL SECURITY;
 */
export class DataService {
  // ─── Supabase operations ────────────────────────────────────────────────────

  private async loadFromSupabase(): Promise<PortfolioData> {
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('portfolio_data')
      .select('data')
      .eq('id', PORTFOLIO_ROW_ID)
      .single()

    if (error) {
      // If the row doesn't exist yet, seed it from the local JSON file
      if (error.code === 'PGRST116') {
        console.log('No portfolio data in Supabase yet — seeding from local file...')
        const localData = await this.loadFromFile()
        await this.saveToSupabase(localData)
        return localData
      }
      throw new Error(`Supabase read error: ${error.message}`)
    }

    const portfolioData = data.data as PortfolioData

    if (!portfolioData?.metadata || !portfolioData?.hero || !portfolioData?.about) {
      throw new Error('Invalid portfolio data structure in Supabase')
    }

    return portfolioData
  }

  private async saveToSupabase(portfolioData: PortfolioData): Promise<void> {
    const supabase = await getSupabase()

    const { error } = await supabase
      .from('portfolio_data')
      .upsert(
        { id: PORTFOLIO_ROW_ID, data: portfolioData, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )

    if (error) {
      throw new Error(`Supabase write error: ${error.message}`)
    }
  }

  // ─── File operations (dev / fallback) ──────────────────────────────────────

  private async loadFromFile(): Promise<PortfolioData> {
    const rawData = await readDataWithRetry(DATA_FILE, { maxRetries: 3, initialDelay: 100 })
    const data = JSON.parse(rawData) as PortfolioData

    if (!data.metadata || !data.hero || !data.about) {
      throw new Error('Invalid portfolio data structure')
    }

    return data
  }

  private async saveToFile(
    data: PortfolioData,
    createBackup: boolean
  ): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2)
    await writeDataAtomic(DATA_FILE, jsonData, {
      createBackup,
      backupDir: BACKUP_DIR,
      maxRetries: 3,
      initialDelay: 100,
    })
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Load portfolio data.
   * Uses Supabase when configured, otherwise reads from local JSON file.
   */
  async loadData(): Promise<PortfolioData> {
    try {
      if (isSupabaseConfigured()) {
        return await this.loadFromSupabase()
      }
      return await this.loadFromFile()
    } catch (error) {
      throw new Error(
        `Failed to load portfolio data: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Save portfolio data.
   * Uses Supabase when configured, otherwise writes to local JSON file.
   */
  async saveData(
    data: PortfolioData,
    options: { createBackup?: boolean; updateMetadata?: boolean } = {}
  ): Promise<void> {
    const { createBackup = true, updateMetadata = true } = options

    try {
      if (updateMetadata) {
        data.metadata = {
          ...data.metadata,
          lastUpdated: new Date().toISOString(),
        }
      }

      this.validateData(data)

      if (isSupabaseConfigured()) {
        await this.saveToSupabase(data)
      } else {
        await this.saveToFile(data, createBackup)
      }
    } catch (error) {
      throw new Error(
        `Failed to save portfolio data: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Update a specific section of portfolio data.
   */
  async updateSection<K extends keyof Omit<PortfolioData, 'metadata'>>(
    section: K,
    sectionData: PortfolioData[K]
  ): Promise<void> {
    const data = await this.loadData()
    data[section] = sectionData
    await this.saveData(data, { createBackup: true, updateMetadata: true })
  }

  /**
   * List available backups (file-based only; Supabase has built-in history).
   */
  async listBackups(): Promise<string[]> {
    if (isSupabaseConfigured()) {
      // Supabase doesn't use file backups — return empty array
      return []
    }
    return listBackups(DATA_FILE, BACKUP_DIR)
  }

  /**
   * Restore from a file backup (file-based only).
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    if (isSupabaseConfigured()) {
      throw new Error('File-based restore is not available when using Supabase storage')
    }
    try {
      await restoreFromBackup(backupPath, DATA_FILE)
    } catch (error) {
      throw new Error(
        `Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get the most recent backup path (file-based only).
   */
  async getLatestBackup(): Promise<string | null> {
    const backups = await this.listBackups()
    return backups.length > 0 ? (backups[0] ?? null) : null
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  private validateData(data: PortfolioData): void {
    const requiredProps: (keyof PortfolioData)[] = [
      'hero', 'about', 'skills', 'projects', 'experience', 'contact', 'metadata',
    ]

    for (const prop of requiredProps) {
      if (!(prop in data)) {
        throw new Error(`Missing required property: ${prop}`)
      }
    }

    if (!data.hero.name || !data.hero.title) {
      throw new Error('Hero section must have name and title')
    }
    if (!Array.isArray(data.skills)) throw new Error('Skills must be an array')
    if (!Array.isArray(data.projects)) throw new Error('Projects must be an array')
    if (!Array.isArray(data.experience)) throw new Error('Experience must be an array')
    if (!data.contact.email) throw new Error('Contact section must have an email')
    if (!data.metadata.version) throw new Error('Metadata must have a version')
  }
}

// Export singleton instance
export const dataService = new DataService()
