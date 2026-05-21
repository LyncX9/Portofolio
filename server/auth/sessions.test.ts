import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, unlinkSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  createSession,
  validateSession,
  extendSession,
  invalidateSession,
  getUserSessions,
  invalidateUserSessions,
  cleanupSessions,
  type Session
} from './sessions'

const SESSIONS_FILE = join(process.cwd(), 'data', 'sessions.json')

describe('Session Management', () => {
  beforeEach(() => {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }

    // Clean up sessions file before each test
    if (existsSync(SESSIONS_FILE)) {
      unlinkSync(SESSIONS_FILE)
    }
  })

  afterEach(() => {
    // Clean up sessions file after each test
    if (existsSync(SESSIONS_FILE)) {
      unlinkSync(SESSIONS_FILE)
    }
  })

  describe('createSession', () => {
    it('should create a new session with a unique token', () => {
      const username = 'testuser'
      const session = createSession(username)

      expect(session).toBeDefined()
      expect(session.token).toBeDefined()
      expect(typeof session.token).toBe('string')
      expect(session.token.length).toBeGreaterThan(0)
      expect(session.username).toBe(username)
    })

    it('should set expiration to 24 hours from now', () => {
      const username = 'testuser'
      const beforeCreate = Date.now()
      const session = createSession(username)
      const afterCreate = Date.now()

      const expectedExpiration = 24 * 60 * 60 * 1000 // 24 hours in ms
      const minExpiration = beforeCreate + expectedExpiration
      const maxExpiration = afterCreate + expectedExpiration

      expect(session.expiresAt).toBeGreaterThanOrEqual(minExpiration)
      expect(session.expiresAt).toBeLessThanOrEqual(maxExpiration)
    })

    it('should set createdAt and lastActivityAt to current time', () => {
      const beforeCreate = Date.now()
      const session = createSession('testuser')
      const afterCreate = Date.now()

      expect(session.createdAt).toBeGreaterThanOrEqual(beforeCreate)
      expect(session.createdAt).toBeLessThanOrEqual(afterCreate)
      expect(session.lastActivityAt).toBeGreaterThanOrEqual(beforeCreate)
      expect(session.lastActivityAt).toBeLessThanOrEqual(afterCreate)
    })

    it('should generate unique tokens for multiple sessions', () => {
      const session1 = createSession('user1')
      const session2 = createSession('user2')
      const session3 = createSession('user1')

      expect(session1.token).not.toBe(session2.token)
      expect(session1.token).not.toBe(session3.token)
      expect(session2.token).not.toBe(session3.token)
    })

    it('should persist session to file', () => {
      const session = createSession('testuser')

      expect(existsSync(SESSIONS_FILE)).toBe(true)

      // Validate the session can be retrieved
      const validated = validateSession(session.token)
      expect(validated).not.toBeNull()
      expect(validated?.token).toBe(session.token)
      expect(validated?.username).toBe('testuser')
    })

    it('should cleanup expired sessions when creating new session', () => {
      // Create an expired session manually
      const expiredToken = 'expired-token'
      const expiredSession = {
        username: 'expireduser',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
        lastActivityAt: Date.now() - 25 * 60 * 60 * 1000
      }

      writeFileSync(
        SESSIONS_FILE,
        JSON.stringify({ [expiredToken]: expiredSession }, null, 2)
      )

      // Create a new session (should trigger cleanup)
      const newSession = createSession('newuser')

      // Validate expired session is gone
      const validated = validateSession(expiredToken)
      expect(validated).toBeNull()

      // Validate new session exists
      const newValidated = validateSession(newSession.token)
      expect(newValidated).not.toBeNull()
    })
  })

  describe('validateSession', () => {
    it('should return session object for valid token', () => {
      const session = createSession('testuser')
      const validated = validateSession(session.token)

      expect(validated).not.toBeNull()
      expect(validated?.token).toBe(session.token)
      expect(validated?.username).toBe(session.username)
      expect(validated?.expiresAt).toBe(session.expiresAt)
    })

    it('should return null for non-existent token', () => {
      const validated = validateSession('non-existent-token')
      expect(validated).toBeNull()
    })

    it('should return null for expired session', () => {
      // Create an expired session manually
      const expiredToken = 'expired-token'
      const expiredSession = {
        username: 'expireduser',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
        lastActivityAt: Date.now() - 25 * 60 * 60 * 1000
      }

      writeFileSync(
        SESSIONS_FILE,
        JSON.stringify({ [expiredToken]: expiredSession }, null, 2)
      )

      const validated = validateSession(expiredToken)
      expect(validated).toBeNull()
    })

    it('should remove expired session from storage', () => {
      // Create an expired session manually
      const expiredToken = 'expired-token'
      const expiredSession = {
        username: 'expireduser',
        expiresAt: Date.now() - 1000,
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
        lastActivityAt: Date.now() - 25 * 60 * 60 * 1000
      }

      writeFileSync(
        SESSIONS_FILE,
        JSON.stringify({ [expiredToken]: expiredSession }, null, 2)
      )

      // Validate (should remove expired session)
      validateSession(expiredToken)

      // Try to validate again
      const validated = validateSession(expiredToken)
      expect(validated).toBeNull()
    })

    it('should handle empty sessions file', () => {
      writeFileSync(SESSIONS_FILE, '{}')
      const validated = validateSession('any-token')
      expect(validated).toBeNull()
    })
  })

  describe('extendSession', () => {
    it('should extend session expiration by 24 hours', () => {
      const session = createSession('testuser')

      // Wait a bit to ensure time difference
      const beforeExtend = Date.now()
      const extended = extendSession(session.token)
      const afterExtend = Date.now()

      expect(extended).not.toBeNull()
      expect(extended?.expiresAt).toBeGreaterThan(session.expiresAt)

      const expectedExpiration = 24 * 60 * 60 * 1000
      const minExpiration = beforeExtend + expectedExpiration
      const maxExpiration = afterExtend + expectedExpiration

      expect(extended?.expiresAt).toBeGreaterThanOrEqual(minExpiration)
      expect(extended?.expiresAt).toBeLessThanOrEqual(maxExpiration)
    })

    it('should update lastActivityAt timestamp', async () => {
      const session = createSession('testuser')
      const originalLastActivity = session.lastActivityAt

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10))

      const extended = extendSession(session.token)

      expect(extended).not.toBeNull()
      expect(extended?.lastActivityAt).toBeGreaterThan(originalLastActivity)
    })

    it('should return null for non-existent token', () => {
      const extended = extendSession('non-existent-token')
      expect(extended).toBeNull()
    })

    it('should persist extended session to file', () => {
      const session = createSession('testuser')
      const extended = extendSession(session.token)

      expect(extended).not.toBeNull()

      // Validate the extended session can be retrieved
      const validated = validateSession(session.token)
      expect(validated).not.toBeNull()
      expect(validated?.expiresAt).toBe(extended?.expiresAt)
      expect(validated?.lastActivityAt).toBe(extended?.lastActivityAt)
    })

    it('should cleanup expired sessions when extending', () => {
      // Create an expired session manually
      const expiredToken = 'expired-token'
      const expiredSession = {
        username: 'expireduser',
        expiresAt: Date.now() - 1000,
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
        lastActivityAt: Date.now() - 25 * 60 * 60 * 1000
      }

      const validSession = createSession('validuser')

      // Add expired session to file
      writeFileSync(
        SESSIONS_FILE,
        JSON.stringify(
          {
            [expiredToken]: expiredSession,
            [validSession.token]: {
              username: validSession.username,
              expiresAt: validSession.expiresAt,
              createdAt: validSession.createdAt,
              lastActivityAt: validSession.lastActivityAt
            }
          },
          null,
          2
        )
      )

      // Extend valid session (should trigger cleanup)
      extendSession(validSession.token)

      // Validate expired session is gone
      const validated = validateSession(expiredToken)
      expect(validated).toBeNull()
    })
  })

  describe('invalidateSession', () => {
    it('should remove session from storage', () => {
      const session = createSession('testuser')

      const result = invalidateSession(session.token)
      expect(result).toBe(true)

      // Validate session is gone
      const validated = validateSession(session.token)
      expect(validated).toBeNull()
    })

    it('should return false for non-existent token', () => {
      const result = invalidateSession('non-existent-token')
      expect(result).toBe(false)
    })

    it('should not affect other sessions', () => {
      const session1 = createSession('user1')
      const session2 = createSession('user2')

      invalidateSession(session1.token)

      // Validate session1 is gone
      const validated1 = validateSession(session1.token)
      expect(validated1).toBeNull()

      // Validate session2 still exists
      const validated2 = validateSession(session2.token)
      expect(validated2).not.toBeNull()
      expect(validated2?.token).toBe(session2.token)
    })
  })

  describe('getUserSessions', () => {
    it('should return all active sessions for a user', () => {
      const session1 = createSession('testuser')
      const session2 = createSession('testuser')
      const session3 = createSession('otheruser')

      const userSessions = getUserSessions('testuser')

      expect(userSessions).toHaveLength(2)
      expect(userSessions.map((s) => s.token)).toContain(session1.token)
      expect(userSessions.map((s) => s.token)).toContain(session2.token)
      expect(userSessions.map((s) => s.token)).not.toContain(session3.token)
    })

    it('should return empty array for user with no sessions', () => {
      createSession('otheruser')

      const userSessions = getUserSessions('testuser')
      expect(userSessions).toHaveLength(0)
    })

    it('should not return expired sessions', () => {
      // Create an expired session manually
      const expiredToken = 'expired-token'
      const expiredSession = {
        username: 'testuser',
        expiresAt: Date.now() - 1000,
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
        lastActivityAt: Date.now() - 25 * 60 * 60 * 1000
      }

      const validSession = createSession('testuser')

      // Add expired session to file
      writeFileSync(
        SESSIONS_FILE,
        JSON.stringify(
          {
            [expiredToken]: expiredSession,
            [validSession.token]: {
              username: validSession.username,
              expiresAt: validSession.expiresAt,
              createdAt: validSession.createdAt,
              lastActivityAt: validSession.lastActivityAt
            }
          },
          null,
          2
        )
      )

      const userSessions = getUserSessions('testuser')

      expect(userSessions).toHaveLength(1)
      expect(userSessions[0].token).toBe(validSession.token)
    })
  })

  describe('invalidateUserSessions', () => {
    it('should remove all sessions for a user', () => {
      const session1 = createSession('testuser')
      const session2 = createSession('testuser')
      const session3 = createSession('otheruser')

      const count = invalidateUserSessions('testuser')

      expect(count).toBe(2)

      // Validate testuser sessions are gone
      const validated1 = validateSession(session1.token)
      const validated2 = validateSession(session2.token)
      expect(validated1).toBeNull()
      expect(validated2).toBeNull()

      // Validate otheruser session still exists
      const validated3 = validateSession(session3.token)
      expect(validated3).not.toBeNull()
    })

    it('should return 0 for user with no sessions', () => {
      createSession('otheruser')

      const count = invalidateUserSessions('testuser')
      expect(count).toBe(0)
    })

    it('should not save file if no sessions were removed', async () => {
      const session = createSession('otheruser')

      // Get file modification time
      const fs = require('fs')
      const statsBefore = fs.statSync(SESSIONS_FILE)

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10))

      invalidateUserSessions('testuser')

      const statsAfter = fs.statSync(SESSIONS_FILE)
      expect(statsAfter.mtimeMs).toBe(statsBefore.mtimeMs)
    })
  })

  describe('cleanupSessions', () => {
    it('should remove all expired sessions', () => {
      // Create expired sessions manually
      const expiredToken1 = 'expired-token-1'
      const expiredToken2 = 'expired-token-2'
      const expiredSession = {
        username: 'expireduser',
        expiresAt: Date.now() - 1000,
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
        lastActivityAt: Date.now() - 25 * 60 * 60 * 1000
      }

      const validSession = createSession('validuser')

      // Add expired sessions to file
      writeFileSync(
        SESSIONS_FILE,
        JSON.stringify(
          {
            [expiredToken1]: expiredSession,
            [expiredToken2]: expiredSession,
            [validSession.token]: {
              username: validSession.username,
              expiresAt: validSession.expiresAt,
              createdAt: validSession.createdAt,
              lastActivityAt: validSession.lastActivityAt
            }
          },
          null,
          2
        )
      )

      const count = cleanupSessions()

      expect(count).toBe(2)

      // Validate expired sessions are gone
      const validated1 = validateSession(expiredToken1)
      const validated2 = validateSession(expiredToken2)
      expect(validated1).toBeNull()
      expect(validated2).toBeNull()

      // Validate valid session still exists
      const validated3 = validateSession(validSession.token)
      expect(validated3).not.toBeNull()
    })

    it('should return 0 if no expired sessions', () => {
      createSession('user1')
      createSession('user2')

      const count = cleanupSessions()
      expect(count).toBe(0)
    })

    it('should handle empty sessions file', () => {
      writeFileSync(SESSIONS_FILE, '{}')

      const count = cleanupSessions()
      expect(count).toBe(0)
    })
  })

  describe('Session persistence', () => {
    it('should persist multiple sessions correctly', () => {
      const session1 = createSession('user1')
      const session2 = createSession('user2')
      const session3 = createSession('user1')

      // Validate all sessions exist
      const validated1 = validateSession(session1.token)
      const validated2 = validateSession(session2.token)
      const validated3 = validateSession(session3.token)

      expect(validated1).not.toBeNull()
      expect(validated2).not.toBeNull()
      expect(validated3).not.toBeNull()

      expect(validated1?.username).toBe('user1')
      expect(validated2?.username).toBe('user2')
      expect(validated3?.username).toBe('user1')
    })

    it('should handle concurrent session operations', () => {
      const session1 = createSession('user1')
      const session2 = createSession('user2')

      // Extend session1
      extendSession(session1.token)

      // Validate both sessions still exist
      const validated1 = validateSession(session1.token)
      const validated2 = validateSession(session2.token)

      expect(validated1).not.toBeNull()
      expect(validated2).not.toBeNull()
    })
  })
})
