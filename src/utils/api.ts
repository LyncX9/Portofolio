import type { ApiResponse } from '@/types'

// Base API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Read the CSRF token from the csrf_token cookie.
 * The server sets this cookie (non-HTTP-only) on login so the client can
 * include it in the X-CSRF-Token header for state-changing requests.
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : null
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

/**
 * Make an API request with error handling.
 * For state-changing methods (POST, PUT, DELETE, PATCH) the CSRF token is
 * automatically read from the csrf_token cookie and sent in the
 * X-CSRF-Token header as required by the backend middleware.
 */
export async function apiRequest<T>(
  url: string,
  config: RequestConfig = {}
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

    // Parse response
    const data = await response.json()

    // Handle HTTP errors
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        message: data.message
      }
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }
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
  additionalData?: Record<string, string>
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

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        message: data.message
      }
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }
  }
}
