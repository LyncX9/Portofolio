import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Configuration for atomic file write operations
 */
export interface WriteOptions {
  /**
   * Maximum number of retry attempts for write operations
   * @default 3
   */
  maxRetries?: number

  /**
   * Initial delay in milliseconds for exponential backoff
   * @default 100
   */
  initialDelay?: number

  /**
   * Whether to create a backup before writing
   * @default true
   */
  createBackup?: boolean

  /**
   * Directory for storing backups (relative to data directory)
   * @default 'backups'
   */
  backupDir?: string
}

/**
 * Error thrown when file locking fails
 */
export class FileLockError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileLockError'
  }
}

/**
 * Error thrown when atomic write operation fails
 */
export class AtomicWriteError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message)
    this.name = 'AtomicWriteError'
  }
}

/**
 * File lock manager to prevent concurrent writes
 */
class FileLockManager {
  private locks = new Map<string, Promise<void>>()

  /**
   * Acquire a lock for a file path
   * @param filePath - Absolute path to the file
   * @returns Promise that resolves when lock is acquired
   */
  async acquire(filePath: string): Promise<() => void> {
    // Wait for any existing lock on this file
    while (this.locks.has(filePath)) {
      await this.locks.get(filePath)
    }

    // Create a new lock
    let releaseLock: () => void
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve
    })

    this.locks.set(filePath, lockPromise)

    // Return the release function
    return () => {
      this.locks.delete(filePath)
      releaseLock!()
    }
  }
}

// Global lock manager instance
const lockManager = new FileLockManager()

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 * @param attempt - Current attempt number (0-indexed)
 * @param initialDelay - Initial delay in milliseconds
 * @returns Delay in milliseconds with jitter
 */
function calculateBackoff(attempt: number, initialDelay: number): number {
  // Exponential backoff: initialDelay * 2^attempt
  const exponentialDelay = initialDelay * Math.pow(2, attempt)
  // Add jitter (random value between 0 and 20% of delay)
  const jitter = Math.random() * exponentialDelay * 0.2
  return exponentialDelay + jitter
}

/**
 * Create a backup of a file
 * @param filePath - Path to the file to backup
 * @param backupDir - Directory to store backups
 * @returns Path to the backup file, or null if file doesn't exist
 */
async function createBackup(filePath: string, backupDir: string): Promise<string | null> {
  try {
    // Check if source file exists
    await fs.access(filePath)
  } catch {
    // File doesn't exist, no backup needed
    return null
  }

  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true })

  // Generate backup filename with timestamp
  const fileName = path.basename(filePath)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFileName = `${fileName}.${timestamp}.backup`
  const backupPath = path.join(backupDir, backupFileName)

  // Copy file to backup location
  await fs.copyFile(filePath, backupPath)

  return backupPath
}

/**
 * Clean up old backups, keeping only the most recent ones
 * @param backupDir - Directory containing backups
 * @param fileName - Base filename to match
 * @param keepCount - Number of recent backups to keep
 */
async function cleanupOldBackups(
  backupDir: string,
  fileName: string,
  keepCount: number = 10
): Promise<void> {
  try {
    const files = await fs.readdir(backupDir)

    // Filter backups for this specific file
    const backups = files
      .filter((file) => file.startsWith(fileName) && file.endsWith('.backup'))
      .map((file) => ({
        name: file,
        path: path.join(backupDir, file),
      }))

    // Sort by modification time (newest first)
    const backupsWithStats = await Promise.all(
      backups.map(async (backup) => ({
        ...backup,
        stats: await fs.stat(backup.path),
      }))
    )

    backupsWithStats.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs)

    // Delete old backups beyond keepCount
    const backupsToDelete = backupsWithStats.slice(keepCount)
    await Promise.all(backupsToDelete.map((backup) => fs.unlink(backup.path)))
  } catch (error) {
    // Log error but don't fail the operation
    console.error('Failed to cleanup old backups:', error)
  }
}

/**
 * Write data to a file atomically using temp file + rename strategy
 *
 * This function ensures data integrity by:
 * 1. Acquiring a file lock to prevent concurrent writes
 * 2. Creating a backup of the existing file (optional)
 * 3. Writing data to a temporary file
 * 4. Atomically renaming the temp file to the target file
 * 5. Implementing retry logic with exponential backoff on failures
 *
 * @param filePath - Absolute path to the target file
 * @param data - Data to write (string or Buffer)
 * @param options - Write options
 * @throws {AtomicWriteError} If write operation fails after all retries
 * @throws {FileLockError} If unable to acquire file lock
 *
 * @example
 * ```typescript
 * await writeDataAtomic('/path/to/data.json', JSON.stringify(data), {
 *   maxRetries: 3,
 *   createBackup: true,
 *   backupDir: '/path/to/backups'
 * })
 * ```
 */
export async function writeDataAtomic(
  filePath: string,
  data: string | Buffer,
  options: WriteOptions = {}
): Promise<void> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    createBackup: shouldCreateBackup = true,
    backupDir = path.join(path.dirname(filePath), 'backups'),
  } = options

  // Acquire file lock
  const releaseLock = await lockManager.acquire(filePath)

  try {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create backup if requested and this is the first attempt
        if (shouldCreateBackup && attempt === 0) {
          const backupPath = await createBackup(filePath, backupDir)
          if (backupPath) {
            // Cleanup old backups asynchronously (don't wait)
            cleanupOldBackups(backupDir, path.basename(filePath)).catch((err) =>
              console.error('Backup cleanup failed:', err)
            )
          }
        }

        // Generate unique temporary filename
        const tempFileName = `${path.basename(filePath)}.${randomUUID()}.tmp`
        const tempFilePath = path.join(path.dirname(filePath), tempFileName)

        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true })

        // Write to temporary file
        await fs.writeFile(tempFilePath, data, { encoding: 'utf-8', flag: 'w' })

        // Verify the write by reading back the file size
        const stats = await fs.stat(tempFilePath)
        const expectedSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf-8')

        if (stats.size !== expectedSize) {
          throw new Error(
            `File size mismatch: expected ${expectedSize} bytes, got ${stats.size} bytes`
          )
        }

        // Atomically rename temp file to target file
        // On POSIX systems, this is atomic. On Windows, it may not be fully atomic
        // but it's the best we can do with Node.js fs API
        await fs.rename(tempFilePath, filePath)

        // Success! Release lock and return
        releaseLock()
        return
      } catch (error) {
        lastError = error as Error

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = calculateBackoff(attempt, initialDelay)
          await sleep(delay)
        }
      }
    }

    // All retries exhausted
    throw new AtomicWriteError(
      `Failed to write file after ${maxRetries + 1} attempts: ${lastError?.message}`,
      lastError
    )
  } catch (error) {
    // Release lock on error
    releaseLock()
    throw error
  }
}

/**
 * Read data from a file with retry logic
 *
 * @param filePath - Absolute path to the file
 * @param options - Read options
 * @returns File contents as string
 * @throws {Error} If read operation fails after all retries
 */
export async function readDataWithRetry(
  filePath: string,
  options: { maxRetries?: number; initialDelay?: number } = {}
): Promise<string> {
  const { maxRetries = 3, initialDelay = 100 } = options

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      lastError = error as Error

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = calculateBackoff(attempt, initialDelay)
        await sleep(delay)
      }
    }
  }

  throw new Error(
    `Failed to read file after ${maxRetries + 1} attempts: ${lastError?.message}`
  )
}

/**
 * List all backup files for a given file
 *
 * @param filePath - Path to the original file
 * @param backupDir - Directory containing backups
 * @returns Array of backup file paths sorted by date (newest first)
 */
export async function listBackups(filePath: string, backupDir?: string): Promise<string[]> {
  const backupDirectory = backupDir || path.join(path.dirname(filePath), 'backups')
  const fileName = path.basename(filePath)

  try {
    const files = await fs.readdir(backupDirectory)

    // Filter backups for this specific file
    const backups = files
      .filter((file) => file.startsWith(fileName) && file.endsWith('.backup'))
      .map((file) => path.join(backupDirectory, file))

    // Get stats and sort by modification time (newest first)
    const backupsWithStats = await Promise.all(
      backups.map(async (backupPath) => ({
        path: backupPath,
        stats: await fs.stat(backupPath),
      }))
    )

    backupsWithStats.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs)

    return backupsWithStats.map((b) => b.path)
  } catch (error) {
    // If directory doesn't exist, return empty array
    return []
  }
}

/**
 * Restore a file from a backup
 *
 * @param backupPath - Path to the backup file
 * @param targetPath - Path where the file should be restored
 * @throws {Error} If backup file doesn't exist or restore fails
 */
export async function restoreFromBackup(backupPath: string, targetPath: string): Promise<void> {
  // Verify backup exists
  await fs.access(backupPath)

  // Use atomic write to restore
  const backupData = await fs.readFile(backupPath, 'utf-8')
  await writeDataAtomic(targetPath, backupData, { createBackup: false })
}
