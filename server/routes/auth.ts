import { Router, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { validateCredentials } from '../auth/credentials'
import {
  createSession,
  validateSession,
  invalidateSession,
  extendSession
} from '../auth/sessions'
import {
  generateCsrfToken,
  setCsrfToken,
  setCsrfTokenCookie,
  validateCsrfToken,
  clearCsrfToken
} from '../middleware/csrf'

const router = Router()

/**
 * Rate limiter for the login endpoint.
 * Allows a maximum of 10 login attempts per 15-minute window per IP.
 * Prevents brute-force attacks on admin credentials.
 * Disabled in test environments to avoid interfering with test suites.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window
  standardHeaders: true,     // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers
  skip: () => process.env.NODE_ENV === 'test', // Disable in test environment
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.'
  }
})

// Cookie configuration
const COOKIE_NAME = 'admin_session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const, // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/'
}

/**
 * POST /api/auth/login
 * Authenticate admin user and create session
 */
router.post('/login', loginRateLimiter, setCsrfToken, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    // Validate request body
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      })
    }

    // Validate credentials
    const isValid = await validateCredentials(username, password)

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
    }

    // Create session
    const session = createSession(username)

    // Set HTTP-only cookie with session token
    res.cookie(COOKIE_NAME, session.token, COOKIE_OPTIONS)

    // Return session data
    return res.json({
      success: true,
      data: {
        token: session.token,
        expiresAt: session.expiresAt,
        user: { username: session.username },
        csrfToken: req.csrfToken // Include CSRF token in response
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * POST /api/auth/logout
 * Invalidate current session
 */
router.post('/logout', validateCsrfToken, clearCsrfToken, (req: Request, res: Response) => {
  try {
    // Extract token from cookie
    const token = req.cookies[COOKIE_NAME]

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No active session found'
      })
    }

    // Invalidate session
    const invalidated = invalidateSession(token)

    // Clear cookie
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })

    if (!invalidated) {
      return res.json({
        success: true,
        message: 'Session already expired or invalid'
      })
    }

    return res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/auth/session
 * Validate current session and return session status
 */
router.get('/session', (req: Request, res: Response) => {
  try {
    // Extract token from cookie
    const token = req.cookies[COOKIE_NAME]

    if (!token) {
      return res.json({
        success: true,
        data: {
          isAuthenticated: false,
          user: null,
          expiresAt: null
        }
      })
    }

    // Validate session
    const session = validateSession(token)

    if (!session) {
      // Clear invalid cookie
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })

      return res.json({
        success: true,
        data: {
          isAuthenticated: false,
          user: null,
          expiresAt: null
        }
      })
    }

    // Extend session (sliding window)
    const extendedSession = extendSession(token)

    if (extendedSession) {
      // Update cookie with extended expiration
      res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
    }

    const csrfToken = generateCsrfToken()
    setCsrfTokenCookie(res, csrfToken)

    return res.json({
      success: true,
      data: {
        isAuthenticated: true,
        user: { username: session.username },
        expiresAt: extendedSession ? extendedSession.expiresAt : session.expiresAt,
        csrfToken
      }
    })
  } catch (error) {
    console.error('Session validation error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

export default router
