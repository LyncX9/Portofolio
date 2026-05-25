import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  hashPassword,
  verifyPassword,
  loadCredentials,
  saveCredentials,
  initializeCredentials,
  validateCredentials,
  type AdminCredentials
} from './credentials'

const TEST_DATA_DIR = join(process.cwd(), 'data')
const TEST_CREDENTIALS_FILE = join(TEST_DATA_DIR, 'admin-credentials.json')

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)

    expect(hash).toBeTruthy()
    expect(hash).not.toBe(password)
    expect(hash.startsWith('$2b$')).toBe(true) // bcrypt hash format
  })

  it('should generate different hashes for the same password', async () => {
    const password = 'testPassword123'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)

    expect(hash1).not.toBe(hash2) // Different salts
  })

  it('should verify correct password', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)
    const isValid = await verifyPassword(password, hash)

    expect(isValid).toBe(true)
  })

  it('should reject incorrect password', async () => {
    const password = 'testPassword123'
    const wrongPassword = 'wrongPassword456'
    const hash = await hashPassword(password)
    const isValid = await verifyPassword(wrongPassword, hash)

    expect(isValid).toBe(false)
  })
})

describe('Credential Storage', () => {
  beforeEach(() => {
    // Ensure data directory exists
    if (!existsSync(TEST_DATA_DIR)) {
      mkdirSync(TEST_DATA_DIR, { recursive: true })
    }
  })

  afterEach(() => {
    // Don't clean up credentials file - let vitest setup handle it
  })

  it('should return null when credentials file does not exist', () => {
    // Temporarily remove credentials file for this test
    if (existsSync(TEST_CREDENTIALS_FILE)) {
      rmSync(TEST_CREDENTIALS_FILE)
    }
    
    const credentials = loadCredentials()
    expect(credentials).toBeNull()
    
    // Restore credentials for other tests
    process.env.ADMIN_USERNAME = 'testadmin'
    process.env.ADMIN_PASSWORD = 'testpassword123'
  })

  it('should save and load credentials', () => {
    const testCredentials: AdminCredentials = {
      username: 'testadmin',
      passwordHash: '$2b$12$abcdefghijklmnopqrstuvwxyz',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    saveCredentials(testCredentials)

    const loaded = loadCredentials()
    expect(loaded).toEqual(testCredentials)
  })

  it('should save credentials in correct JSON format', () => {
    const testCredentials: AdminCredentials = {
      username: 'testadmin',
      passwordHash: '$2b$12$abcdefghijklmnopqrstuvwxyz',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }

    saveCredentials(testCredentials)

    const fileContent = readFileSync(TEST_CREDENTIALS_FILE, 'utf-8')
    const parsed = JSON.parse(fileContent)

    expect(parsed).toEqual(testCredentials)
    expect(parsed.username).toBe('testadmin')
    expect(parsed.passwordHash).toBe('$2b$12$abcdefghijklmnopqrstuvwxyz')
  })
})

describe('Credential Initialization', () => {
  beforeEach(() => {
    // Ensure data directory exists
    if (!existsSync(TEST_DATA_DIR)) {
      mkdirSync(TEST_DATA_DIR, { recursive: true })
    }
    // Clean up any existing credentials file for initialization tests
    if (existsSync(TEST_CREDENTIALS_FILE)) {
      rmSync(TEST_CREDENTIALS_FILE)
    }
    // Clear environment variables
    delete process.env.ADMIN_USERNAME
    delete process.env.ADMIN_PASSWORD
  })

  afterEach(() => {
    // Restore credentials for other tests
    process.env.ADMIN_USERNAME = 'testadmin'
    process.env.ADMIN_PASSWORD = 'testpassword123'
    // Don't delete the credentials file - other tests need it
    // Clear environment variables
    delete process.env.ADMIN_USERNAME
    delete process.env.ADMIN_PASSWORD
  })

  it('should initialize credentials from environment variables', async () => {
    process.env.ADMIN_USERNAME = 'admin'
    process.env.ADMIN_PASSWORD = 'securePassword123'

    const initialized = await initializeCredentials()

    expect(initialized).toBe(true)

    const credentials = loadCredentials()
    expect(credentials).not.toBeNull()
    expect(credentials?.username).toBe('admin')
    expect(credentials?.passwordHash).toBeTruthy()
    expect(credentials?.passwordHash.startsWith('$2b$')).toBe(true)
    expect(credentials?.createdAt).toBeTruthy()
    expect(credentials?.updatedAt).toBeTruthy()
  })

  it('should use default username if not provided', async () => {
    process.env.ADMIN_PASSWORD = 'securePassword123'

    const initialized = await initializeCredentials()

    expect(initialized).toBe(true)

    const credentials = loadCredentials()
    expect(credentials?.username).toBe('admin')
  })

  it('should throw error if ADMIN_PASSWORD is not provided', async () => {
    await expect(initializeCredentials()).rejects.toThrow(
      'ADMIN_PASSWORD environment variable is required'
    )
  })

  it('should not reinitialize if credentials already exist', async () => {
    process.env.ADMIN_PASSWORD = 'securePassword123'

    // First initialization
    const initialized1 = await initializeCredentials()
    expect(initialized1).toBe(true)

    const credentials1 = loadCredentials()
    const originalHash = credentials1?.passwordHash

    // Second initialization attempt
    const initialized2 = await initializeCredentials()
    expect(initialized2).toBe(false)

    const credentials2 = loadCredentials()
    expect(credentials2?.passwordHash).toBe(originalHash)
  })

  it('should update existing credentials when environment values change', async () => {
    process.env.ADMIN_USERNAME = 'admin'
    process.env.ADMIN_PASSWORD = 'securePassword123'
    await initializeCredentials()

    process.env.ADMIN_USERNAME = 'newadmin'
    process.env.ADMIN_PASSWORD = 'newSecurePassword123'
    const updated = await initializeCredentials()

    expect(updated).toBe(true)
    expect(await validateCredentials('newadmin', 'newSecurePassword123')).toBe(true)
    expect(await validateCredentials('admin', 'securePassword123')).toBe(false)
  })
})

describe('Credential Validation', () => {
  beforeEach(async () => {
    // Ensure data directory exists
    if (!existsSync(TEST_DATA_DIR)) {
      mkdirSync(TEST_DATA_DIR, { recursive: true })
    }
    // Clean up any existing credentials file
    if (existsSync(TEST_CREDENTIALS_FILE)) {
      rmSync(TEST_CREDENTIALS_FILE)
    }

    // Initialize credentials for testing
    process.env.ADMIN_USERNAME = 'testadmin'
    process.env.ADMIN_PASSWORD = 'testPassword123'
    await initializeCredentials()
  })

  afterEach(() => {
    // Don't delete credentials - other tests need it
    delete process.env.ADMIN_USERNAME
    delete process.env.ADMIN_PASSWORD
  })

  it('should validate correct credentials', async () => {
    const isValid = await validateCredentials('testadmin', 'testPassword123')
    expect(isValid).toBe(true)
  })

  it('should reject incorrect username', async () => {
    const isValid = await validateCredentials('wrongadmin', 'testPassword123')
    expect(isValid).toBe(false)
  })

  it('should reject incorrect password', async () => {
    const isValid = await validateCredentials('testadmin', 'wrongPassword')
    expect(isValid).toBe(false)
  })

  it('should reject empty username', async () => {
    const isValid = await validateCredentials('', 'testPassword123')
    expect(isValid).toBe(false)
  })

  it('should reject empty password', async () => {
    const isValid = await validateCredentials('testadmin', '')
    expect(isValid).toBe(false)
  })

  it('should throw error if credentials not initialized', async () => {
    // Remove credentials file
    rmSync(TEST_CREDENTIALS_FILE)

    await expect(validateCredentials('testadmin', 'testPassword123')).rejects.toThrow(
      'Credentials not initialized'
    )
  })
})
