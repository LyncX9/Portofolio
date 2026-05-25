import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AuthSession, AuthState } from '@/types'
import { authService } from '@/services/authService'

/**
 * Authentication Store
 * Manages authentication state, session validation, login/logout operations
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref<boolean>(false)
  const session = ref<AuthSession | null>(null)
  const user = ref<{ username: string } | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Computed getters
  const authState = computed<AuthState>(() => ({
    isAuthenticated: isAuthenticated.value,
    session: session.value,
    user: user.value
  }))

  const isSessionValid = computed<boolean>(() => {
    if (!session.value) return false
    return Date.now() < session.value.expiresAt
  })

  const username = computed<string | null>(() => user.value?.username || null)

  /**
   * Login action - authenticate user with credentials
   */
  async function login(username: string, password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.authenticate({ username, password })

      if (response.success && response.data) {
        // Set authentication state
        session.value = response.data
        user.value = { username: response.data.username }
        isAuthenticated.value = true
        error.value = null
        return true
      } else {
        // Authentication failed
        error.value = response.error || 'Authentication failed'
        isAuthenticated.value = false
        session.value = null
        user.value = null
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      isAuthenticated.value = false
      session.value = null
      user.value = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout action - invalidate current session
   */
  async function logout(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await authService.logout()
    } catch (err) {
      // Log error but still clear local state
      console.error('Logout error:', err)
    } finally {
      // Clear authentication state regardless of API response
      isAuthenticated.value = false
      session.value = null
      user.value = null
      error.value = null
      isLoading.value = false
    }
  }

  /**
   * Check session action - validate current session with backend
   */
  async function checkSession(): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.validateSession()

      if (response.success && response.data?.isAuthenticated) {
        // Session is valid
        isAuthenticated.value = true
        user.value = response.data.user
        
        if (response.data.expiresAt) {
          session.value = {
            token: session.value?.token ?? '',
            username: response.data.user.username,
            expiresAt: response.data.expiresAt,
            csrfToken: response.data.csrfToken
          }
        }
        
        return true
      } else {
        // Session is invalid or expired
        isAuthenticated.value = false
        session.value = null
        user.value = null
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Session validation failed'
      isAuthenticated.value = false
      session.value = null
      user.value = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Initialize session on app load
   */
  async function initializeSession(): Promise<void> {
    await checkSession()
  }

  /**
   * Clear error message
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Reset store to initial state
   */
  function $reset(): void {
    isAuthenticated.value = false
    session.value = null
    user.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    isAuthenticated,
    session,
    user,
    isLoading,
    error,
    
    // Computed
    authState,
    isSessionValid,
    username,
    
    // Actions
    login,
    logout,
    checkSession,
    initializeSession,
    clearError,
    $reset
  }
})
