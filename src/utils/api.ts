import type { ApiResponse } from '@/types'

// Base API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const CSRF_STORAGE_KEY = 'portfolio_admin_csrf_token'

export function resolveMediaUrl(url?: string | null): string {
  const value = url?.trim()
  if (!value) return ''

  if (/^(blob:|data:|https?:\/\/)/i.test(value)) {
    return value
  }

  const uploadPath = value.startsWith('/uploads/')
    ? value
    : value.startsWith('uploads/')
      ? `/${value}`
      : ''

  if (!uploadPath) {
    return value
  }

  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return new URL(uploadPath, new URL(API_BASE_URL).origin).toString()
  }

  return uploadPath
}

export function isImageUrl(url?: string | null): boolean {
  const value = url?.trim()
  if (!value) return false
  return (
    /^(blob:|data:image\/)/i.test(value) ||
    value.startsWith('/uploads/') ||
    value.startsWith('uploads/') ||
    /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value)
  )
}

/**
 * Read the CSRF token from the csrf_token cookie.
 * The server sets this cookie (non-HTTP-only) on login so the client can
 * include it in the X-CSRF-Token header for state-changing requests.
 */
function getCookieCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : null
}

export function getCsrfToken(): string | null {
  if (typeof window !== 'undefined') {
    const storedToken = window.localStorage.getItem(CSRF_STORAGE_KEY)
    if (storedToken) return storedToken
  }
  return getCookieCsrfToken()
}

export function saveCsrfToken(token?: string | null): void {
  if (typeof window === 'undefined' || !token) return
  window.localStorage.setItem(CSRF_STORAGE_KEY, token)
}

export function clearCsrfToken(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CSRF_STORAGE_KEY)
}

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  AUTH_SESSION: `${API_BASE_URL}/auth/session`,
  
  // Content
  CONTENT: `${API_BASE_URL}/content`,
  CONTENT_HERO: `${API_BASE_URL}/content/hero`,
  CONTENT_ABOUT: `${API_BASE_URL}/content/about`,
  CONTENT_SKILLS: `${API_BASE_URL}/content/skills`,
  CONTENT_PROJECTS: `${API_BASE_URL}/content/projects`,
  CONTENT_CERTIFICATES: `${API_BASE_URL}/content/certificates`,
  CONTENT_EXPERIENCE: `${API_BASE_URL}/content/experience`,
  CONTENT_CONTACT: `${API_BASE_URL}/content/contact`,
  
  // Images
  IMAGES_UPLOAD: `${API_BASE_URL}/images/upload`,
  IMAGES_DELETE: (filename: string) => `${API_BASE_URL}/images/${filename}`,
  
  // Reordering
  SKILLS_REORDER: `${API_BASE_URL}/content/skills/reorder`,
  EXPERIENCE_REORDER: `${API_BASE_URL}/content/experience/reorder`
} as const

// HTTP methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// Request configuration
export interface RequestConfig {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: unknown
  credentials?: RequestCredentials
}

// Default request headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
}

type ParsedResponse = Record<string, unknown>

async function parseApiResponse(response: Response): Promise<ParsedResponse> {
  const legacyJson = (response as Response & { json?: () => Promise<ParsedResponse> }).json
  if (typeof response.text !== 'function' && typeof legacyJson === 'function') {
    return legacyJson.call(response)
  }

  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text) as ParsedResponse
  } catch {
    return {
      success: false,
      error: `API returned a non-JSON response (${response.status}). Check that the backend URL is correct and deployed.`,
      message: text.slice(0, 160)
    }
  }
}

/**
 * Make an API request with error handling.
 * For state-changing methods (POST, PUT, DELETE, PATCH) the CSRF token is
 * automatically read from the csrf_token cookie and sent in the
 * X-CSRF-Token header as required by the backend middleware.
 */
export async function apiRequest<T>(
  url: string,
  config: RequestConfig = {},
  hasRetried = false
): Promise<ApiResponse<T>> {
  const {
    method = HttpMethod.GET,
    headers = {},
    body,
    credentials = 'include'
  } = config

  try {
    const requestHeaders: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...headers
    }

    // Attach CSRF token for all state-changing requests (Requirement 12.4)
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrfToken = getCsrfToken()
      if (csrfToken) {
        requestHeaders['x-csrf-token'] = csrfToken
      }
    }

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
      credentials
    }

    // Add body for non-GET requests
    if (body && method !== HttpMethod.GET) {
      requestInit.body = JSON.stringify(body)
    }

    const response = await fetch(url, requestInit)

    // Parse response. Production proxies can return plain text/HTML when the
    // backend URL is wrong, so keep that failure readable for the admin UI.
    const data = await parseApiResponse(response)

    // Handle HTTP errors
    if (!response.ok) {
      if (shouldRefreshCsrf(response.status, data, method, url) && !hasRetried) {
        const refreshed = await refreshCsrfToken()
        if (refreshed) {
          return apiRequest<T>(url, config, true)
        }
      }

      if (isAuthExpiredResponse(response.status, data)) {
        handleAuthExpired()
        return {
          success: false,
          error: 'Session expired. Please login again.',
          message: typeof data.message === 'string' ? data.message : undefined
        }
      }

      return {
        success: false,
        error: String(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`),
        message: typeof data.message === 'string' ? data.message : undefined
      }
    }

    return {
      success: true,
      data: (data.data || data) as T,
      message: typeof data.message === 'string' ? data.message : undefined
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }
  }
}

function shouldRefreshCsrf(status: number, data: unknown, method: HttpMethod, url: string): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return false
  if (url.includes('/auth/login') || url.includes('/auth/session')) return false
  return isCsrfErrorResponse(status, data)
}

export function isCsrfErrorResponse(status: number, data: unknown): boolean {
  if (status !== 403) return false

  const error = getResponseError(data).toLowerCase()
  return error.includes('csrf')
}

export function isAuthExpiredResponse(status: number, data: unknown): boolean {
  if (status === 401) return true

  const error = getResponseError(data).toLowerCase()
  return error.includes('session expired') || error.includes('expired session')
}

function getResponseError(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const payload = data as { error?: unknown; message?: unknown }
  return String(payload.error ?? payload.message ?? '')
}

export async function refreshCsrfToken(): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH_SESSION, {
      method: HttpMethod.GET,
      headers: DEFAULT_HEADERS,
      credentials: 'include'
    })
    const data = await parseApiResponse(response)
    const session = data?.data as { isAuthenticated?: boolean; csrfToken?: string } | undefined

    if (response.ok && session?.isAuthenticated && session?.csrfToken) {
      saveCsrfToken(session.csrfToken)
      return true
    }

    handleAuthExpired()
    return false
  } catch {
    handleAuthExpired()
    return false
  }
}

export function handleAuthExpired(): void {
  clearCsrfToken()
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent('admin-session-expired'))
  const currentPath = window.location.pathname
  if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
    window.location.assign('/admin/login')
  }
}

/**
 * Make a GET request
 */
export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: HttpMethod.GET })
}

/**
 * Make a POST request
 */
export async function apiPost<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: HttpMethod.POST, body })
}

/**
 * Make a PUT request
 */
export async function apiPut<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: HttpMethod.PUT, body })
}

/**
 * Make a DELETE request
 */
export async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: HttpMethod.DELETE })
}

/**
 * Upload a file using FormData.
 * Automatically includes the CSRF token header (Requirement 12.4).
 */
export async function apiUploadFile<T>(
  url: string,
  file: File,
  additionalData?: Record<string, string>,
  hasRetried = false
): Promise<ApiResponse<T>> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // Add additional data if provided
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    // Build headers – no Content-Type so the browser sets the multipart boundary
    const uploadHeaders: Record<string, string> = {}
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      uploadHeaders['x-csrf-token'] = csrfToken
    }

    const response = await fetch(url, {
      method: HttpMethod.POST,
      headers: uploadHeaders,
      body: formData,
      credentials: 'include'
    })

    const data = await parseApiResponse(response)

    if (!response.ok) {
      if (shouldRefreshCsrf(response.status, data, HttpMethod.POST, url) && !hasRetried) {
        const refreshed = await refreshCsrfToken()
        if (refreshed) {
          return apiUploadFile<T>(url, file, additionalData, true)
        }
      }

      if (isAuthExpiredResponse(response.status, data)) {
        handleAuthExpired()
        return {
          success: false,
          error: 'Session expired. Please login again.',
          message: typeof data.message === 'string' ? data.message : undefined
        }
      }

      return {
        success: false,
        error: String(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`),
        message: typeof data.message === 'string' ? data.message : undefined
      }
    }

    return {
      success: true,
      data: (data.data || data) as T,
      message: typeof data.message === 'string' ? data.message : undefined
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }
  }
}
