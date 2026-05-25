import bcrypt from 'bcrypt'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const SALT_ROUNDS = 12
const CREDENTIALS_FILE = join(process.cwd(), 'data', 'admin-credentials.json')

export interface AdminCredentials {
  username: string
  passwordHash: string
  createdAt: string
  updatedAt: string
}

/**
 * Hash a password using bcrypt with cost factor 12
 * @param password - Plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Load admin credentials from file
 * @returns Admin credentials or null if file doesn't exist
 */
export function loadCredentials(): AdminCredentials | null {
  if (!existsSync(CREDENTIALS_FILE)) {
    return null
  }

  try {
    const data = readFileSync(CREDENTIALS_FILE, 'utf-8')
    return JSON.parse(data) as AdminCredentials
  } catch (error) {
    console.error('Error loading credentials:', error)
    return null
  }
}

/**
 * Save admin credentials to file
 * @param credentials - Admin credentials to save
 */
export function saveCredentials(credentials: AdminCredentials): void {
  try {
    writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving credentials:', error)
    throw new Error('Failed to save credentials')
  }
}

/**
 * Initialize credentials from environment variables
 * Creates admin-credentials.json if it doesn't exist, or updates it when
 * ADMIN_USERNAME / ADMIN_PASSWORD changed in .env.
 * @returns Promise resolving to true if credentials were written, false if already current
 */
export async function initializeCredentials(): Promise<boolean> {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD

  if (!password) {
    throw new Error(
      'ADMIN_PASSWORD environment variable is required for initial credential setup'
    )
  }

  const existing = loadCredentials()
  if (existing) {
    const usernameMatches = existing.username === username
    const passwordMatches = await verifyPassword(password, existing.passwordHash)

    if (usernameMatches && passwordMatches) {
      return false
    }

    saveCredentials({
      ...existing,
      username,
      passwordHash: await hashPassword(password),
      updatedAt: new Date().toISOString()
    })

    return true
  }

  const credentials: AdminCredentials = {
    username,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  saveCredentials(credentials)

  return true
}

/**
 * Validate username and password against stored credentials
 * @param username - Username to validate
 * @param password - Plain text password to validate
 * @returns Promise resolving to true if credentials are valid, false otherwise
 */
export async function validateCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const credentials = loadCredentials()

  if (!credentials) {
    throw new Error('Credentials not initialized')
  }

  // Check username matches
  if (credentials.username !== username) {
    return false
  }

  // Verify password
  return verifyPassword(password, credentials.passwordHash)
}
