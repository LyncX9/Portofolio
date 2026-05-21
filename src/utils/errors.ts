import type { ValidationErrors } from '@/types'
import { ZodError } from 'zod'

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: ValidationErrors
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Custom error class for authentication errors
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Custom error class for authorization errors
 */
export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Convert Zod validation errors to ValidationErrors format
 */
export function formatZodErrors(error: ZodError<unknown>): ValidationErrors {
  const errors: ValidationErrors = {}
  
  error.issues.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return errors
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof ValidationError) {
    return 'Please fix the validation errors and try again.'
  }
  
  if (error instanceof AuthenticationError) {
    return 'Invalid username or password. Please try again.'
  }
  
  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action.'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    )
  }
  return false
}

/**
 * Log error for debugging (can be extended to send to logging service)
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString()
  const contextStr = context ? `[${context}]` : ''
  
  console.error(`${timestamp} ${contextStr}`, error)
  
  // In production, you might want to send errors to a logging service
  // Example: sendToLoggingService(error, context)
}

/**
 * Handle async errors with try-catch wrapper
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  errorContext?: string
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    if (errorContext) {
      logError(error, errorContext)
    }
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on authentication/authorization errors
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('Max retries reached')
}
