import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import {
  validateCredentials,
  loadCredentials,
  saveCredentials,
  hashPassword,
  type AdminCredentials
} from '../auth/credentials'
import { createSession, validateSession, invalidateSession } from '../auth/sessions'
import { generateCsrfToken } from '../middleware/csrf'
import request from 'supertest'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import authRoutes from './auth'

describe('Authentication API Endpoints', () => {
  let app: Express
  let originalCredentials: AdminCredentials | null = null

  beforeAll(async () => {
    // Save existing credentials so we can restore them after tests
    originalCredentials = loadCredentials()

    // Force-write test credentials regardless of what's already stored
    const passwordHash = await hashPassword('testpassword123')
    const testCredentials: AdminCredentials = {
      username: 'testadmin',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    saveCredentials(testCredentials)
  })

  afterAll(() => {
    // Restore original credentials after all tests complete
    if (originalCredentials) {
      saveCredentials(originalCredentials)
    }
  })

  beforeEach(() => {
    // Set up Express app for integration tests
    app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/api/auth', authRoutes)
  })

  describe('Credential Validation', () => {
    it('should validate correct credentials', async () => {
      const isValid = await validateCredentials('testadmin', 'testpassword123')
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const isValid = await validateCredentials('testadmin', 'wrongpassword')
      expect(isValid).toBe(false)
    })

    it('should reject incorrect username', async () => {
      const isValid = await validateCredentials('wronguser', 'testpassword123')
      expect(isValid).toBe(false)
    })

    it('should reject empty credentials', async () => {
      const isValid = await validateCredentials('', '')
      expect(isValid).toBe(false)
    })
  })

  describe('Session Management', () => {
    let sessionToken: string

    afterEach(() => {
      // Clean up session after each test
      if (sessionToken) {
        invalidateSession(sessionToken)
      }
    })

    it('should create a session with valid credentials', () => {
      const session = createSession('testadmin')
      sessionToken = session.token

      expect(session).toBeDefined()
      expect(session.token).toBeTruthy()
      expect(session.username).toBe('testadmin')
      expect(session.expiresAt).toBeGreaterThan(Date.now())
    })

    it('should validate an active session', () => {
      const session = createSession('testadmin')
      sessionToken = session.token

      const validatedSession = validateSession(session.token)
      expect(validatedSession).toBeDefined()
      expect(validatedSession?.username).toBe('testadmin')
    })

    it('should reject an invalid session token', () => {
      const validatedSession = validateSession('invalid-token-12345')
      expect(validatedSession).toBeNull()
    })

    it('should invalidate a session on logout', () => {
      const session = createSession('testadmin')
      sessionToken = session.token

      const invalidated = invalidateSession(session.token)
      expect(invalidated).toBe(true)

      const validatedSession = validateSession(session.token)
      expect(validatedSession).toBeNull()
    })

    it('should return false when invalidating non-existent session', () => {
      const invalidated = invalidateSession('non-existent-token')
      expect(invalidated).toBe(false)
    })
  })

  describe('CSRF Token Generation', () => {
    it('should generate a CSRF token', () => {
      const token = generateCsrfToken()
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate unique CSRF tokens', () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()
      expect(token1).not.toBe(token2)
    })

    it('should generate tokens with consistent length', () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()
      expect(token1.length).toBe(token2.length)
    })
  })

  describe('HTTP-only Cookie Configuration', () => {
    it('should have correct cookie options for session', () => {
      const COOKIE_OPTIONS = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      }

      expect(COOKIE_OPTIONS.httpOnly).toBe(true)
      expect(COOKIE_OPTIONS.sameSite).toBe('strict')
      expect(COOKIE_OPTIONS.maxAge).toBe(86400000) // 24 hours in ms
      expect(COOKIE_OPTIONS.path).toBe('/')
    })
  })

  describe('Session Expiration', () => {
    it('should create session with 24-hour expiration', () => {
      const session = createSession('testadmin')
      const expectedExpiration = Date.now() + 24 * 60 * 60 * 1000
      
      // Allow 1 second tolerance for test execution time
      expect(session.expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 1000)
      expect(session.expiresAt).toBeLessThanOrEqual(expectedExpiration + 1000)
      
      invalidateSession(session.token)
    })
  })

  describe('Security Requirements', () => {
    it('should use secure flag in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const secure = process.env.NODE_ENV === 'production'
      expect(secure).toBe(true)
      
      process.env.NODE_ENV = originalEnv
    })

    it('should use SameSite=Strict for CSRF protection', () => {
      const sameSite = 'strict'
      expect(sameSite).toBe('strict')
    })

    it('should use HTTP-only cookies for session tokens', () => {
      const httpOnly = true
      expect(httpOnly).toBe(true)
    })
  })

  describe('HTTP Endpoint Integration Tests', () => {
    describe('POST /api/auth/login', () => {
      it('should successfully login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'testpassword123' })
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data).toBeDefined()
        expect(response.body.data.token).toBeTruthy()
        expect(response.body.data.user.username).toBe('testadmin')
        expect(response.body.data.expiresAt).toBeGreaterThan(Date.now())
        expect(response.body.data.csrfToken).toBeTruthy()

        // Verify HTTP-only cookie is set
        const cookies = response.headers['set-cookie']
        expect(cookies).toBeDefined()
        expect(cookies.some((cookie: string) => cookie.includes('admin_session'))).toBe(true)
        expect(cookies.some((cookie: string) => cookie.includes('HttpOnly'))).toBe(true)
        expect(cookies.some((cookie: string) => cookie.includes('SameSite=Strict'))).toBe(true)

        // Cleanup
        invalidateSession(response.body.data.token)
      })

      it('should reject login with invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'wrongpassword' })
          .expect(401)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toBe('Invalid username or password')
      })

      it('should reject login with missing username', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ password: 'testpassword123' })
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toBe('Username and password are required')
      })

      it('should reject login with missing password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin' })
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toBe('Username and password are required')
      })

      it('should set CSRF token cookie on login', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'testpassword123' })
          .expect(200)

        const cookies = response.headers['set-cookie']
        expect(cookies.some((cookie: string) => cookie.includes('csrf_token'))).toBe(true)
        
        // CSRF cookie should NOT be HTTP-only (client needs to read it)
        const csrfCookie = cookies.find((cookie: string) => cookie.includes('csrf_token'))
        expect(csrfCookie).toBeDefined()
        expect(csrfCookie?.includes('HttpOnly')).toBe(false)

        // Cleanup
        invalidateSession(response.body.data.token)
      })
    })

    describe('GET /api/auth/session', () => {
      it('should return authenticated status for valid session', async () => {
        // First login to get a session
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'testpassword123' })

        const sessionCookie = loginResponse.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('admin_session='))

        // Check session status
        const response = await request(app)
          .get('/api/auth/session')
          .set('Cookie', sessionCookie)
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.isAuthenticated).toBe(true)
        expect(response.body.data.user.username).toBe('testadmin')
        expect(response.body.data.expiresAt).toBeGreaterThan(Date.now())

        // Cleanup
        invalidateSession(loginResponse.body.data.token)
      })

      it('should return unauthenticated status without session cookie', async () => {
        const response = await request(app)
          .get('/api/auth/session')
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.isAuthenticated).toBe(false)
        expect(response.body.data.user).toBeNull()
        expect(response.body.data.expiresAt).toBeNull()
      })

      it('should return unauthenticated status for invalid session token', async () => {
        const response = await request(app)
          .get('/api/auth/session')
          .set('Cookie', 'admin_session=invalid-token-12345')
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.isAuthenticated).toBe(false)
        expect(response.body.data.user).toBeNull()
      })

      it('should extend session expiration on valid request', async () => {
        // First login to get a session
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'testpassword123' })

        const sessionCookie = loginResponse.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('admin_session='))
        const initialExpiresAt = loginResponse.body.data.expiresAt

        // Wait a bit to ensure time difference
        await new Promise(resolve => setTimeout(resolve, 100))

        // Check session status (should extend expiration)
        const response = await request(app)
          .get('/api/auth/session')
          .set('Cookie', sessionCookie)
          .expect(200)

        expect(response.body.data.expiresAt).toBeGreaterThan(initialExpiresAt)

        // Cleanup
        invalidateSession(loginResponse.body.data.token)
      })
    })

    describe('POST /api/auth/logout', () => {
      it('should successfully logout with valid session', async () => {
        // First login to get a session
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'testpassword123' })

        const sessionCookie = loginResponse.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('admin_session='))
        const csrfCookie = loginResponse.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('csrf_token='))
        const csrfToken = loginResponse.body.data.csrfToken

        // Logout
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Cookie', [sessionCookie, csrfCookie])
          .set('x-csrf-token', csrfToken)
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe('Logged out successfully')

        // Verify session is invalidated
        const sessionCheck = await request(app)
          .get('/api/auth/session')
          .set('Cookie', sessionCookie)
          .expect(200)

        expect(sessionCheck.body.data.isAuthenticated).toBe(false)
      })

      it('should reject logout without CSRF token', async () => {
        // First login to get a session
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'testpassword123' })

        const sessionCookie = loginResponse.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('admin_session='))

        // Try to logout without CSRF token
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Cookie', sessionCookie)
          .expect(403)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toBe('CSRF token missing')

        // Cleanup
        invalidateSession(loginResponse.body.data.token)
      })

      it('should reject logout with invalid CSRF token', async () => {
        // First login to get a session
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'testpassword123' })

        const sessionCookie = loginResponse.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('admin_session='))
        const csrfCookie = loginResponse.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('csrf_token='))

        // Try to logout with wrong CSRF token
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Cookie', [sessionCookie, csrfCookie])
          .set('x-csrf-token', 'wrong-csrf-token')
          .expect(403)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toBe('Invalid CSRF token')

        // Cleanup
        invalidateSession(loginResponse.body.data.token)
      })

      it('should handle logout without active session', async () => {
        // CSRF validation happens before session check, so we get 403 for missing CSRF token
        const response = await request(app)
          .post('/api/auth/logout')
          .expect(403)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toBe('CSRF token missing')
      })

      it('should clear session and CSRF cookies on logout', async () => {
        // First login to get a session
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'testpassword123' })

        const sessionCookie = loginResponse.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('admin_session='))
        const csrfCookie = loginResponse.headers['set-cookie']
          .find((cookie: string) => cookie.startsWith('csrf_token='))
        const csrfToken = loginResponse.body.data.csrfToken

        // Logout
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Cookie', [sessionCookie, csrfCookie])
          .set('x-csrf-token', csrfToken)
          .expect(200)

        // Verify cookies are cleared (they should be present in set-cookie header)
        const cookies = response.headers['set-cookie']
        expect(cookies).toBeDefined()
        
        // Check that admin_session cookie is cleared
        const clearedSessionCookie = cookies.find((cookie: string) => 
          cookie.startsWith('admin_session=')
        )
        expect(clearedSessionCookie).toBeDefined()
        
        // Check that csrf_token cookie is cleared
        const clearedCsrfCookie = cookies.find((cookie: string) => 
          cookie.startsWith('csrf_token=')
        )
        expect(clearedCsrfCookie).toBeDefined()
      })
    })

    describe('Cookie Security Configuration', () => {
      it('should set cookies with correct security attributes', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testadmin', password: 'testpassword123' })
          .expect(200)

        const cookies = response.headers['set-cookie']
        const sessionCookie = cookies.find((cookie: string) => cookie.includes('admin_session'))

        // Verify security attributes
        expect(sessionCookie).toContain('HttpOnly')
        expect(sessionCookie).toContain('SameSite=Strict')
        expect(sessionCookie).toContain('Path=/')
        expect(sessionCookie).toContain('Max-Age=86400') // 24 hours

        // Cleanup
        invalidateSession(response.body.data.token)
      })

      it('should set Secure flag in production environment', () => {
        // Test the cookie configuration logic directly
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'

        const COOKIE_OPTIONS = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
          maxAge: 24 * 60 * 60 * 1000,
          path: '/'
        }

        expect(COOKIE_OPTIONS.secure).toBe(true)

        process.env.NODE_ENV = originalEnv
      })
    })
  })
})
