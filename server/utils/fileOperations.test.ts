import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  writeDataAtomic,
  readDataWithRetry,
  listBackups,
  restoreFromBackup,
  AtomicWriteError,
} from './fileOperations'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test directory for file operations
const TEST_DIR = path.join(__dirname, '../../test-data')
const TEST_FILE = path.join(TEST_DIR, 'test-file.json')
const BACKUP_DIR = path.join(TEST_DIR, 'backups')

describe('fileOperations', () => {
  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true })
    } catch {
      // Ignore errors if directory doesn't exist
    }
    await fs.mkdir(TEST_DIR, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true })
    } catch {
      // Ignore errors
    }
  })

  describe('writeDataAtomic', () => {
    it('should write data to a new file', async () => {
      const data = JSON.stringify({ test: 'data' })

      await writeDataAtomic(TEST_FILE, data, { createBackup: false })

      const written = await fs.readFile(TEST_FILE, 'utf-8')
      expect(written).toBe(data)
    })

    it('should overwrite existing file atomically', async () => {
      const initialData = JSON.stringify({ initial: 'data' })
      const newData = JSON.stringify({ new: 'data' })

      await writeDataAtomic(TEST_FILE, initialData, { createBackup: false })
      await writeDataAtomic(TEST_FILE, newData, { createBackup: false })

      const written = await fs.readFile(TEST_FILE, 'utf-8')
      expect(written).toBe(newData)
    })

    it('should create backup before writing', async () => {
      const initialData = JSON.stringify({ initial: 'data' })
      const newData = JSON.stringify({ new: 'data' })

      // Write initial data
      await writeDataAtomic(TEST_FILE, initialData, { createBackup: false })

      // Write new data with backup
      await writeDataAtomic(TEST_FILE, newData, {
        createBackup: true,
        backupDir: BACKUP_DIR,
      })

      // Check that backup was created
      const backups = await listBackups(TEST_FILE, BACKUP_DIR)
      expect(backups.length).toBeGreaterThan(0)

      // Verify backup contains initial data
      const backupData = await fs.readFile(backups[0], 'utf-8')
      expect(backupData).toBe(initialData)

      // Verify file contains new data
      const currentData = await fs.readFile(TEST_FILE, 'utf-8')
      expect(currentData).toBe(newData)
    })

    it('should handle Buffer data', async () => {
      const data = Buffer.from('test data', 'utf-8')

      await writeDataAtomic(TEST_FILE, data, { createBackup: false })

      const written = await fs.readFile(TEST_FILE)
      expect(written.equals(data)).toBe(true)
    })

    it('should retry on failure', async () => {
      const data = JSON.stringify({ test: 'data' })
      let attemptCount = 0

      // Mock fs.writeFile to fail twice then succeed
      const originalWriteFile = fs.writeFile
      vi.spyOn(fs, 'writeFile').mockImplementation(async (...args) => {
        attemptCount++
        if (attemptCount <= 2) {
          throw new Error('Simulated write failure')
        }
        return originalWriteFile(...args)
      })

      await writeDataAtomic(TEST_FILE, data, {
        createBackup: false,
        maxRetries: 3,
        initialDelay: 10,
      })

      expect(attemptCount).toBe(3)
      const written = await fs.readFile(TEST_FILE, 'utf-8')
      expect(written).toBe(data)

      vi.restoreAllMocks()
    })

    it('should throw AtomicWriteError after max retries', async () => {
      const data = JSON.stringify({ test: 'data' })

      // Mock fs.writeFile to always fail
      vi.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Simulated write failure'))

      await expect(
        writeDataAtomic(TEST_FILE, data, {
          createBackup: false,
          maxRetries: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow(AtomicWriteError)

      vi.restoreAllMocks()
    })

    it('should prevent concurrent writes to the same file', async () => {
      const writes = []
      const writeOrder: number[] = []

      // Start multiple concurrent writes
      for (let i = 0; i < 5; i++) {
        writes.push(
          writeDataAtomic(TEST_FILE, JSON.stringify({ write: i }), {
            createBackup: false,
          }).then(() => {
            writeOrder.push(i)
          })
        )
      }

      await Promise.all(writes)

      // All writes should complete
      expect(writeOrder.length).toBe(5)

      // File should contain data from one of the writes
      const finalData = await fs.readFile(TEST_FILE, 'utf-8')
      const parsed = JSON.parse(finalData)
      expect(parsed).toHaveProperty('write')
      expect(typeof parsed.write).toBe('number')
    })

    it('should create directory if it does not exist', async () => {
      const nestedFile = path.join(TEST_DIR, 'nested', 'deep', 'file.json')
      const data = JSON.stringify({ test: 'data' })

      await writeDataAtomic(nestedFile, data, { createBackup: false })

      const written = await fs.readFile(nestedFile, 'utf-8')
      expect(written).toBe(data)
    })

    it('should cleanup old backups keeping only recent ones', async () => {
      const data = JSON.stringify({ test: 'data' })

      // Create initial file
      await writeDataAtomic(TEST_FILE, data, { createBackup: false })

      // Create 15 backups
      for (let i = 0; i < 15; i++) {
        await writeDataAtomic(TEST_FILE, JSON.stringify({ version: i }), {
          createBackup: true,
          backupDir: BACKUP_DIR,
        })
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      // Wait a bit for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should have at most 10 backups
      const backups = await listBackups(TEST_FILE, BACKUP_DIR)
      expect(backups.length).toBeLessThanOrEqual(10)
    })
  })

  describe('readDataWithRetry', () => {
    it('should read file successfully', async () => {
      const data = JSON.stringify({ test: 'data' })
      await fs.writeFile(TEST_FILE, data, 'utf-8')

      const result = await readDataWithRetry(TEST_FILE)
      expect(result).toBe(data)
    })

    it('should retry on failure', async () => {
      const data = JSON.stringify({ test: 'data' })
      await fs.writeFile(TEST_FILE, data, 'utf-8')

      let attemptCount = 0
      const originalReadFile = fs.readFile
      vi.spyOn(fs, 'readFile').mockImplementation(async (...args) => {
        attemptCount++
        if (attemptCount <= 2) {
          throw new Error('Simulated read failure')
        }
        return originalReadFile(...args)
      })

      const result = await readDataWithRetry(TEST_FILE, {
        maxRetries: 3,
        initialDelay: 10,
      })

      expect(attemptCount).toBe(3)
      expect(result).toBe(data)

      vi.restoreAllMocks()
    })

    it('should throw error after max retries', async () => {
      vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('Simulated read failure'))

      await expect(
        readDataWithRetry(TEST_FILE, {
          maxRetries: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow('Failed to read file after 3 attempts')

      vi.restoreAllMocks()
    })
  })

  describe('listBackups', () => {
    it('should return empty array when no backups exist', async () => {
      const backups = await listBackups(TEST_FILE, BACKUP_DIR)
      expect(backups).toEqual([])
    })

    it('should list backups sorted by date (newest first)', async () => {
      const data = JSON.stringify({ test: 'data' })

      // Create initial file
      await writeDataAtomic(TEST_FILE, data, { createBackup: false })

      // Create multiple backups
      for (let i = 0; i < 3; i++) {
        await writeDataAtomic(TEST_FILE, JSON.stringify({ version: i }), {
          createBackup: true,
          backupDir: BACKUP_DIR,
        })
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      const backups = await listBackups(TEST_FILE, BACKUP_DIR)
      expect(backups.length).toBe(3)

      // Verify they are sorted by date (newest first)
      const stats = await Promise.all(backups.map((b) => fs.stat(b)))
      for (let i = 0; i < stats.length - 1; i++) {
        expect(stats[i].mtimeMs).toBeGreaterThanOrEqual(stats[i + 1].mtimeMs)
      }
    })

    it('should only list backups for the specified file', async () => {
      const file1 = path.join(TEST_DIR, 'file1.json')
      const file2 = path.join(TEST_DIR, 'file2.json')

      // Create backups for two different files
      await writeDataAtomic(file1, 'data1', { createBackup: false })
      await writeDataAtomic(file1, 'data1-v2', {
        createBackup: true,
        backupDir: BACKUP_DIR,
      })

      await writeDataAtomic(file2, 'data2', { createBackup: false })
      await writeDataAtomic(file2, 'data2-v2', {
        createBackup: true,
        backupDir: BACKUP_DIR,
      })

      const backups1 = await listBackups(file1, BACKUP_DIR)
      const backups2 = await listBackups(file2, BACKUP_DIR)

      expect(backups1.length).toBe(1)
      expect(backups2.length).toBe(1)
      expect(backups1[0]).toContain('file1.json')
      expect(backups2[0]).toContain('file2.json')
    })
  })

  describe('restoreFromBackup', () => {
    it('should restore file from backup', async () => {
      const originalData = JSON.stringify({ original: 'data' })
      const newData = JSON.stringify({ new: 'data' })

      // Create initial file and backup
      await writeDataAtomic(TEST_FILE, originalData, { createBackup: false })
      await writeDataAtomic(TEST_FILE, newData, {
        createBackup: true,
        backupDir: BACKUP_DIR,
      })

      // Get backup path
      const backups = await listBackups(TEST_FILE, BACKUP_DIR)
      expect(backups.length).toBeGreaterThan(0)

      // Restore from backup
      await restoreFromBackup(backups[0], TEST_FILE)

      // Verify restored data
      const restoredData = await fs.readFile(TEST_FILE, 'utf-8')
      expect(restoredData).toBe(originalData)
    })

    it('should throw error if backup does not exist', async () => {
      const nonExistentBackup = path.join(BACKUP_DIR, 'nonexistent.backup')

      await expect(restoreFromBackup(nonExistentBackup, TEST_FILE)).rejects.toThrow()
    })
  })

  describe('integration tests', () => {
    it('should handle complete backup and restore workflow', async () => {
      const versions = [
        { version: 1, data: 'first' },
        { version: 2, data: 'second' },
        { version: 3, data: 'third' },
      ]

      // Write initial version
      await writeDataAtomic(TEST_FILE, JSON.stringify(versions[0]), { createBackup: false })

      // Write subsequent versions with backups
      for (let i = 1; i < versions.length; i++) {
        await writeDataAtomic(TEST_FILE, JSON.stringify(versions[i]), {
          createBackup: true,
          backupDir: BACKUP_DIR,
        })
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // Verify current version
      const currentData = JSON.parse(await readDataWithRetry(TEST_FILE))
      expect(currentData.version).toBe(3)

      // List backups
      const backups = await listBackups(TEST_FILE, BACKUP_DIR)
      expect(backups.length).toBe(2) // versions 1 and 2

      // Restore to version 1 (oldest backup)
      await restoreFromBackup(backups[backups.length - 1], TEST_FILE)

      const restoredData = JSON.parse(await readDataWithRetry(TEST_FILE))
      expect(restoredData.version).toBe(1)
    })

    it('should maintain data integrity under concurrent operations', async () => {
      const operations = []

      // Perform multiple concurrent write operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          writeDataAtomic(TEST_FILE, JSON.stringify({ id: i, timestamp: Date.now() }), {
            createBackup: i > 0,
            backupDir: BACKUP_DIR,
          })
        )
      }

      await Promise.all(operations)

      // Read final data
      const finalData = await readDataWithRetry(TEST_FILE)
      const parsed = JSON.parse(finalData)

      // Should be valid JSON with expected structure
      expect(parsed).toHaveProperty('id')
      expect(parsed).toHaveProperty('timestamp')
      expect(typeof parsed.id).toBe('number')
      expect(parsed.id).toBeGreaterThanOrEqual(0)
      expect(parsed.id).toBeLessThan(10)
    })
  })
})
