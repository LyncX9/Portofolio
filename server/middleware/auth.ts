import { Request, Response, NextFunction } from 'express'
import { validateSession } from '../auth/sessions'

const COOKIE_NAME = 'admin_session'

/**
 * Authentication middleware
 * Validates session token from cookie and attaches user info to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extract token from cookie
    const token = req.cookies[COOKIE_NAME]

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
      return
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

      res.status(401).json({
        success: false,
        error: 'Invalid or expired session'
      })
      return
    }

    // Attach user info to request for use in route handlers
    req.user = { username: session.username }

    // Continue to next middleware/route handler
    next()
  } catch (error) {
    console.error('Authentication middleware error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: { username: string }
    }
  }
}
