import { randomUUID } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const SESSIONS_FILE = join(process.cwd(), 'data', 'sessions.json')
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface Session {
  token: string
  username: string
  expiresAt: number
  createdAt: number
  lastActivityAt: number
}

export interface SessionsStore {
  [token: string]: Omit<Session, 'token'>
}

/**
 * Load sessions from file
 * @returns Sessions store object
 */
function loadSessions(): SessionsStore {
  if (!existsSync(SESSIONS_FILE)) {
    return {}
  }

  try {
    const data = readFileSync(SESSIONS_FILE, 'utf-8')
    return JSON.parse(data) as SessionsStore
  } catch (error) {
    console.error('Error loading sessions:', error)
    return {}
  }
}

/**
 * Save sessions to file
 * @param sessions - Sessions store to save
 */
function saveSessions(sessions: SessionsStore): void {
  try {
    // Ensure data directory exists
    const dir = dirname(SESSIONS_FILE)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving sessions:', error)
    throw new Error('Failed to save sessions')
  }
}

/**
 * Remove expired sessions from the store
 * @param sessions - Sessions store to clean
 * @returns Cleaned sessions store
 */
function cleanupExpiredSessions(sessions: SessionsStore): SessionsStore {
  const now = Date.now()
  const cleaned: SessionsStore = {}

  for (const [token, session] of Object.entries(sessions)) {
    if (session.expiresAt > now) {
      cleaned[token] = session
    }
  }

  return cleaned
}

/**
 * Create a new session for a user
 * @param username - Username for the session
 * @returns Session object with token and expiration
 */
export function createSession(username: string): Session {
  // Load existing sessions
  let sessions = loadSessions()

  // Cleanup expired sessions
  sessions = cleanupExpiredSessions(sessions)

  // Generate unique token
  const token = randomUUID()
  const now = Date.now()
  const expiresAt = now + SESSION_DURATION_MS

  // Create session data
  const sessionData: Omit<Session, 'token'> = {
    username,
    expiresAt,
    createdAt: now,
    lastActivityAt: now
  }

  // Store session
  sessions[token] = sessionData

  // Save to file
  saveSessions(sessions)

  // Return complete session object
  return {
    token,
    ...sessionData
  }
}

/**
 * Validate a session token and check if it's expired
 * @param token - Session token to validate
 * @returns Session object if valid, null if invalid or expired
 */
export function validateSession(token: string): Session | null {
  // Load sessions
  let sessions = loadSessions()

  // Cleanup expired sessions
  sessions = cleanupExpiredSessions(sessions)

  // Check if token exists
  const sessionData = sessions[token]
  if (!sessionData) {
    return null
  }

  // Check if session is expired
  const now = Date.now()
  if (sessionData.expiresAt <= now) {
    // Remove expired session
    delete sessions[token]
    saveSessions(sessions)
    return null
  }

  // Return complete session object
  return {
    token,
    ...sessionData
  }
}

/**
 * Extend session expiration (sliding window)
 * Updates the expiration time and last activity timestamp
 * @param token - Session token to extend
 * @returns Updated session object if successful, null if session doesn't exist
 */
export function extendSession(token: string): Session | null {
  // Load sessions
  let sessions = loadSessions()

  // Cleanup expired sessions
  sessions = cleanupExpiredSessions(sessions)

  // Check if token exists
  const sessionData = sessions[token]
  if (!sessionData) {
    return null
  }

  // Update expiration and last activity
  const now = Date.now()
  sessionData.expiresAt = now + SESSION_DURATION_MS
  sessionData.lastActivityAt = now

  // Save updated sessions
  saveSessions(sessions)

  // Return complete session object
  return {
    token,
    ...sessionData
  }
}

/**
 * Invalidate a session (logout)
 * @param token - Session token to invalidate
 * @returns True if session was invalidated, false if it didn't exist
 */
export function invalidateSession(token: string): boolean {
  // Load sessions
  let sessions = loadSessions()

  // Check if token exists
  if (!sessions[token]) {
    return false
  }

  // Remove session
  delete sessions[token]

  // Save updated sessions
  saveSessions(sessions)

  return true
}

/**
 * Get all active sessions for a user
 * @param username - Username to get sessions for
 * @returns Array of active sessions for the user
 */
export function getUserSessions(username: string): Session[] {
  // Load sessions
  let sessions = loadSessions()

  // Cleanup expired sessions
  sessions = cleanupExpiredSessions(sessions)

  // Filter sessions by username
  const userSessions: Session[] = []
  for (const [token, sessionData] of Object.entries(sessions)) {
    if (sessionData.username === username) {
      userSessions.push({
        token,
        ...sessionData
      })
    }
  }

  return userSessions
}

/**
 * Invalidate all sessions for a user
 * @param username - Username to invalidate sessions for
 * @returns Number of sessions invalidated
 */
export function invalidateUserSessions(username: string): number {
  // Load sessions
  let sessions = loadSessions()

  // Count and remove user sessions
  let count = 0
  for (const [token, sessionData] of Object.entries(sessions)) {
    if (sessionData.username === username) {
      delete sessions[token]
      count++
    }
  }

  // Save updated sessions
  if (count > 0) {
    saveSessions(sessions)
  }

  return count
}

/**
 * Cleanup all expired sessions
 * This can be called periodically to maintain the sessions file
 * @returns Number of sessions removed
 */
export function cleanupSessions(): number {
  // Load sessions
  const sessions = loadSessions()
  const initialCount = Object.keys(sessions).length

  // Cleanup expired sessions
  const cleaned = cleanupExpiredSessions(sessions)
  const finalCount = Object.keys(cleaned).length

  // Save cleaned sessions
  saveSessions(cleaned)

  return initialCount - finalCount
}
