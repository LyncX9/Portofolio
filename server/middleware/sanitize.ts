import { Request, Response, NextFunction } from 'express'
import xss from 'xss'

/**
 * Recursively sanitize a value to prevent XSS attacks.
 * Strings are passed through the xss library; arrays and objects are traversed.
 * Non-string primitives (numbers, booleans, null) are returned as-is.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return xss(value)
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = sanitizeValue(val)
    }
    return sanitized
  }

  return value
}

/**
 * Express middleware that sanitizes all string values in req.body to prevent XSS.
 * Applied to all routes that accept user input.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body)
  }
  next()
}
