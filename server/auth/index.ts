/**
 * Authentication Module
 * 
 * Provides secure password hashing, credential management, and session management
 * for the admin dashboard.
 */

export {
  hashPassword,
  verifyPassword,
  loadCredentials,
  saveCredentials,
  initializeCredentials,
  validateCredentials,
  type AdminCredentials
} from './credentials'

export {
  createSession,
  validateSession,
  extendSession,
  invalidateSession,
  getUserSessions,
  invalidateUserSessions,
  cleanupSessions,
  type Session,
  type SessionsStore
} from './sessions'
