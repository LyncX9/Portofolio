import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'

/**
 * Error categories for targeted handling and user-friendly messaging.
 */
export type ErrorCategory = 'network' | 'validation' | 'auth' | 'server' | 'unknown'

export interface ErrorDetail {
  category: ErrorCategory
  message: string
  originalError?: unknown
  timestamp: Date
}

/**
 * Map of HTTP status codes to user-friendly messages.
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The data may have been modified by another session.',
  413: 'The file is too large to upload.',
  422: 'The submitted data failed validation. Please review the highlighted fields.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'An internal server error occurred. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again shortly.',
  503: 'The service is currently unavailable. Please try again later.',
  504: 'The request timed out. Please check your connection and try again.'
}

/**
 * Classify an error into a category for targeted handling.
 */
function classifyError(error: unknown): ErrorCategory {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'network'
  }
  if (error instanceof TypeError && error.message.toLowerCase().includes('network')) {
    return 'network'
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('session')) {
      return 'auth'
    }
    if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required')) {
      return 'validation'
    }
    if (msg.includes('500') || msg.includes('server')) {
      return 'server'
    }
    if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('connection')) {
      return 'network'
    }
  }
  return 'unknown'
}

/**
 * Extract a user-friendly message from an error.
 */
function extractUserMessage(error: unknown, fallback: string): string {
  // String errors
  if (typeof error === 'string' && error.trim()) {
    return error
  }

  if (error instanceof Error) {
    // Check for HTTP status in message (e.g. "HTTP 404: Not Found")
    const httpMatch = error.message.match(/HTTP (\d{3})/)
    if (httpMatch) {
      const status = parseInt(httpMatch[1] ?? '0', 10)
      return HTTP_ERROR_MESSAGES[status] ?? error.message
    }

    // Network errors
    if (
      error instanceof TypeError &&
      (error.message.includes('fetch') || error.message.includes('network'))
    ) {
      return 'Unable to connect to the server. Please check your internet connection.'
    }

    return error.message || fallback
  }

  // ApiResponse-style objects
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = (error as { error?: string }).error
    if (typeof apiError === 'string' && apiError.trim()) {
      return apiError
    }
  }

  return fallback
}

/**
 * useErrorHandler composable
 *
 * Provides centralised error handling with:
 * - Error classification (network, validation, auth, server, unknown)
 * - User-friendly message extraction
 * - Automatic error notification via uiStore
 * - Error logging to the console
 * - Reactive last-error state for inline display
 *
 * Requirements: 10.6
 */
export function useErrorHandler() {
  const uiStore = useUiStore()

  /** The most recent error detail, or null if no error has occurred. */
  const lastError = ref<ErrorDetail | null>(null)

  /**
   * Handle an error: classify it, log it, show a notification, and store it.
   *
   * @param error    - The raw error (Error, string, ApiResponse, etc.)
   * @param fallback - Fallback message when no specific message can be extracted
   * @returns The resolved user-friendly message
   */
  function handleError(error: unknown, fallback: string = 'An unexpected error occurred.'): string {
    const category = classifyError(error)
    const message = extractUserMessage(error, fallback)

    const detail: ErrorDetail = {
      category,
      message,
      originalError: error,
      timestamp: new Date()
    }

    lastError.value = detail

    // Log to console for debugging (includes original error for stack traces)
    console.error(`[${category.toUpperCase()}] ${message}`, error)

    // Show notification to the user
    uiStore.showNotification('error', message)

    return message
  }

  /**
   * Handle a network-specific error with a tailored message.
   */
  function handleNetworkError(error: unknown): string {
    const message =
      'Unable to connect to the server. Please check your internet connection and try again.'

    const detail: ErrorDetail = {
      category: 'network',
      message,
      originalError: error,
      timestamp: new Date()
    }

    lastError.value = detail
    console.error('[NETWORK]', message, error)
    uiStore.showNotification('error', message)

    return message
  }

  /**
   * Handle a validation error, optionally showing field-level details.
   *
   * @param errors  - Map of field names to error messages
   * @param summary - Optional summary message (defaults to a generic message)
   */
  function handleValidationError(
    errors: Record<string, string>,
    summary?: string
  ): string {
    const fieldMessages = Object.entries(errors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('; ')

    const message =
      summary ??
      (fieldMessages
        ? `Validation failed — ${fieldMessages}`
        : 'Please fix the validation errors before saving.')

    const detail: ErrorDetail = {
      category: 'validation',
      message,
      originalError: errors,
      timestamp: new Date()
    }

    lastError.value = detail
    console.warn('[VALIDATION]', message, errors)
    uiStore.showNotification('error', message)

    return message
  }

  /**
   * Clear the stored last error.
   */
  function clearError(): void {
    lastError.value = null
  }

  /**
   * Wrap an async operation with automatic error handling.
   * Returns the result on success, or null on failure.
   *
   * @param operation - Async function to execute
   * @param fallback  - Fallback error message
   */
  async function withErrorHandling<T>(
    operation: () => Promise<T>,
    fallback: string = 'An unexpected error occurred.'
  ): Promise<T | null> {
    try {
      clearError()
      return await operation()
    } catch (error) {
      handleError(error, fallback)
      return null
    }
  }

  return {
    lastError,
    handleError,
    handleNetworkError,
    handleValidationError,
    clearError,
    withErrorHandling
  }
}
