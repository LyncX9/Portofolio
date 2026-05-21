import { Request, Response, NextFunction } from 'express'
import { randomBytes } from 'crypto'

const CSRF_TOKEN_COOKIE = 'csrf_token'
const CSRF_HEADER = 'x-csrf-token'

/**
 * Generate a CSRF token
 * @returns Random CSRF token string
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Middleware to generate and set CSRF token cookie
 * This should be called on session creation (login)
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const token = generateCsrfToken()
  
  // Store token in cookie (not HTTP-only so client can read it)
  res.cookie(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  })
  
  // Store token in request for later use
  req.csrfToken = token
  
  next()
}

/**
 * Middleware to validate CSRF token on state-changing operations
 * Checks that the token in the header matches the token in the cookie
 */
export function validateCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }
  
  // Get token from cookie
  const cookieToken = req.cookies[CSRF_TOKEN_COOKIE]
  
  // Get token from header
  const headerToken = req.headers[CSRF_HEADER] as string
  
  // Check if both tokens exist
  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing'
    })
  }
  
  // Validate tokens match (constant-time comparison to prevent timing attacks)
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token'
    })
  }
  
  next()
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  
  // Use crypto.timingSafeEqual for constant-time comparison
  try {
    const crypto = require('crypto')
    return crypto.timingSafeEqual(bufferA, bufferB)
  } catch {
    return false
  }
}

/**
 * Middleware to clear CSRF token cookie
 * This should be called on logout
 */
export function clearCsrfToken(req: Request, res: Response, next: NextFunction): void {
  res.clearCookie(CSRF_TOKEN_COOKIE, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  })
  
  next()
}

// Extend Express Request type to include csrfToken
declare global {
  namespace Express {
    interface Request {
      csrfToken?: string
    }
  }
}
