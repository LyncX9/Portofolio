import type { AuthCredentials, AuthSession, ApiResponse } from '@/types'
import { apiPost, apiGet, API_ENDPOINTS, clearCsrfToken, saveCsrfToken } from '@/utils/api'

/**
 * Authentication Service
 * Handles user authentication, session management, and logout.
 * Makes HTTP calls to /api/auth/login, /api/auth/logout, /api/auth/session.
 */

// Session data returned by validateSession
export interface SessionData {
  isAuthenticated: boolean
  user: { username: string }
  expiresAt: number
  csrfToken?: string
}

interface LoginResponseData extends AuthSession {
  user?: { username: string }
  csrfToken?: string
}

/**
 * Authenticate user with username and password credentials.
 * POST /api/auth/login
 *
 * On success, the server sets an HTTP-only session cookie.
 * Returns the session token, expiry, and username on success.
 */
export async function authenticate(
  credentials: AuthCredentials
): Promise<ApiResponse<AuthSession>> {
  // Basic client-side guard before hitting the network
  if (!credentials.username?.trim() || !credentials.password?.trim()) {
    return {
      success: false,
      error: 'Username and password are required'
    }
  }

  try {
    const response = await apiPost<LoginResponseData>(API_ENDPOINTS.AUTH_LOGIN, credentials)

    // Normalise the response so callers always get a consistent shape
    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Authentication failed. Please check your credentials.'
      }
    }

    if (!response.data) {
      return {
        success: false,
        error: 'Authentication failed. Please check your credentials.'
      }
    }

    if (response.data.csrfToken) {
      saveCsrfToken(response.data.csrfToken)
    }

    const normalizedSession: AuthSession = {
      token: response.data.token,
      expiresAt: response.data.expiresAt,
      username: response.data.username ?? response.data.user?.username ?? credentials.username,
      csrfToken: response.data.csrfToken
    }

    return {
      success: true,
      data: normalizedSession,
      message: response.message || 'Login successful'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during login'
    }
  }
}

/**
 * Validate the current session by checking the session cookie with the server.
 * GET /api/auth/session
 *
 * Returns authentication status, user info, and session expiry.
 * A failed or expired session returns success: false.
 */
export async function validateSession(): Promise<ApiResponse<SessionData>> {
  try {
    const response = await apiGet<SessionData>(API_ENDPOINTS.AUTH_SESSION)

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Session validation failed'
      }
    }

    // Treat an explicitly unauthenticated response as a failure so callers
    // can use the success flag as a simple auth check.
    if (response.data && !response.data.isAuthenticated) {
      clearCsrfToken()
      return {
        success: false,
        error: 'Session is not authenticated'
      }
    }

    if (response.data?.csrfToken) {
      saveCsrfToken(response.data.csrfToken)
    }

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during session validation'
    }
  }
}

/**
 * Log out the current user and invalidate the server-side session.
 * POST /api/auth/logout
 *
 * The server clears the session cookie on success.
 */
export async function logout(): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await apiPost<{ message: string }>(API_ENDPOINTS.AUTH_LOGOUT)

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Logout failed'
      }
    }

    return {
      success: true,
      message: response.message || 'Logged out successfully'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during logout'
    }
  } finally {
    clearCsrfToken()
  }
}

export const authService = {
  authenticate,
  validateSession,
  logout
}
