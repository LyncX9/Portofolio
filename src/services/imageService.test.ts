/**
 * Unit tests for imageService
 *
 * Tests cover:
 *  - validateImageFile: type and size validation
 *  - uploadImage: client-side validation gate, XHR-based upload, progress tracking
 *  - deleteImage: delegates to apiDelete
 *  - replaceImage: upload-then-delete orchestration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateImageFile,
  uploadImage,
  deleteImage,
  replaceImage,
  VALID_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES
} from './imageService'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

// ---------------------------------------------------------------------------
// XHR mock factory
// ---------------------------------------------------------------------------

/**
 * Creates a mock XHR instance and a constructor class that returns it.
 * The constructor must be a real class so `new XMLHttpRequest()` works.
 */
function createXhrMock() {
  const uploadListeners: Record<string, Array<(e: ProgressEvent) => void>> = {}
  const listeners: Record<string, Array<() => void>> = {}

  const instance = {
    upload: {
      addEventListener(event: string, cb: (e: ProgressEvent) => void) {
        uploadListeners[event] = uploadListeners[event] || []
        uploadListeners[event].push(cb)
      }
    },
    responseText: '',
    status: 200,
    statusText: 'OK',
    withCredentials: false,
    openArgs: null as [string, string] | null,
    sentBody: null as FormData | null,

    addEventListener(event: string, cb: () => void) {
      listeners[event] = listeners[event] || []
      listeners[event].push(cb)
    },
    open(method: string, url: string) {
      instance.openArgs = [method, url]
    },
    send(body: FormData) {
      instance.sentBody = body
    },

    // Test helpers
    _triggerUploadProgress(loaded: number, total: number) {
      const event = { lengthComputable: true, loaded, total } as ProgressEvent
      ;(uploadListeners['progress'] || []).forEach((cb) => cb(event))
    },
    _triggerLoad(status: number, body: object) {
      instance.status = status
      instance.responseText = JSON.stringify(body)
      ;(listeners['load'] || []).forEach((cb) => cb())
    },
    _triggerError() {
      ;(listeners['error'] || []).forEach((cb) => cb())
    },
    _triggerAbort() {
      ;(listeners['abort'] || []).forEach((cb) => cb())
    }
  }

  // A real class whose constructor returns our instance object
  class MockXMLHttpRequest {
    constructor() {
      return instance as unknown as MockXMLHttpRequest
    }
  }

  return { instance, MockXMLHttpRequest }
}

// ---------------------------------------------------------------------------
// validateImageFile
// ---------------------------------------------------------------------------

describe('validateImageFile', () => {
  it('accepts all valid MIME types', () => {
    for (const type of VALID_IMAGE_TYPES) {
      const file = makeFile('img', type, 1024)
      expect(validateImageFile(file).valid).toBe(true)
    }
  })

  it('rejects an invalid MIME type', () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024)
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/invalid file type/i)
  })

  it('rejects a file that exceeds the default 5 MB limit', () => {
    const file = makeFile('big.png', 'image/png', MAX_IMAGE_SIZE_BYTES + 1)
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/5mb/i)
  })

  it('accepts a file exactly at the size limit', () => {
    const file = makeFile('exact.png', 'image/png', MAX_IMAGE_SIZE_BYTES)
    expect(validateImageFile(file).valid).toBe(true)
  })

  it('respects a custom maxSizeMB parameter', () => {
    const file = makeFile('img.jpg', 'image/jpeg', 2 * 1024 * 1024) // 2 MB
    expect(validateImageFile(file, 1).valid).toBe(false)
    expect(validateImageFile(file, 3).valid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// uploadImage
// ---------------------------------------------------------------------------

describe('uploadImage', () => {
  let xhrMock: ReturnType<typeof createXhrMock>

  beforeEach(() => {
    xhrMock = createXhrMock()
    vi.stubGlobal('XMLHttpRequest', xhrMock.MockXMLHttpRequest)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns an error immediately when the file fails client-side validation', async () => {
    const badFile = makeFile('doc.pdf', 'application/pdf', 100)
    const result = await uploadImage(badFile, 'hero')
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/invalid file type/i)
    // XHR should never have been opened
    expect(xhrMock.instance.openArgs).toBeNull()
  })

  it('opens a POST request to the images upload endpoint', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)
    const promise = uploadImage(file, 'hero')
    xhrMock.instance._triggerLoad(200, {
      success: true,
      data: { filename: 'hero-123.jpg', url: '/uploads/hero/hero-123.jpg', size: 1024 }
    })
    await promise
    expect(xhrMock.instance.openArgs?.[0]).toBe('POST')
    expect(xhrMock.instance.openArgs?.[1]).toContain('/images/upload')
  })

  it('sends the file and category in FormData', async () => {
    const file = makeFile('photo.png', 'image/png', 512)
    const promise = uploadImage(file, 'projects')
    xhrMock.instance._triggerLoad(200, {
      success: true,
      data: { filename: 'projects-1.png', url: '/uploads/projects/projects-1.png', size: 512 }
    })
    await promise
    expect(xhrMock.instance.sentBody).toBeInstanceOf(FormData)
    const fd = xhrMock.instance.sentBody as FormData
    expect(fd.get('file')).toBe(file)
    expect(fd.get('category')).toBe('projects')
  })

  it('resolves with success data on a 200 response', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)
    const responseData = { filename: 'hero-ts-uuid.jpg', url: '/uploads/hero/hero-ts-uuid.jpg', size: 1024 }
    const promise = uploadImage(file, 'hero')
    xhrMock.instance._triggerLoad(200, { success: true, data: responseData })
    const result = await promise
    expect(result.success).toBe(true)
    expect(result.data).toEqual(responseData)
  })

  it('resolves with an error on a non-2xx response', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)
    const promise = uploadImage(file, 'hero')
    xhrMock.instance._triggerLoad(400, { success: false, error: 'File size exceeds 5MB limit' })
    const result = await promise
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/5mb/i)
  })

  it('resolves with an error on a network error', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)
    const promise = uploadImage(file, 'hero')
    xhrMock.instance._triggerError()
    const result = await promise
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/network error/i)
  })

  it('resolves with an error when the upload is aborted', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)
    const promise = uploadImage(file, 'hero')
    xhrMock.instance._triggerAbort()
    const result = await promise
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/aborted/i)
  })

  it('calls the onProgress callback with percentage values', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1000)
    const progressValues: number[] = []
    const promise = uploadImage(file, 'hero', (pct) => progressValues.push(pct))

    xhrMock.instance._triggerUploadProgress(250, 1000)  // 25%
    xhrMock.instance._triggerUploadProgress(500, 1000)  // 50%
    xhrMock.instance._triggerUploadProgress(1000, 1000) // 100%
    xhrMock.instance._triggerLoad(200, {
      success: true,
      data: { filename: 'f.jpg', url: '/uploads/hero/f.jpg', size: 1000 }
    })

    await promise
    expect(progressValues).toEqual([25, 50, 100])
  })

  it('sets withCredentials to true', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 512)
    const promise = uploadImage(file, 'about')
    xhrMock.instance._triggerLoad(200, {
      success: true,
      data: { filename: 'a.jpg', url: '/uploads/about/a.jpg', size: 512 }
    })
    await promise
    expect(xhrMock.instance.withCredentials).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// deleteImage
// ---------------------------------------------------------------------------

describe('deleteImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls the correct DELETE endpoint', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Image deleted successfully' })
    })
    vi.stubGlobal('fetch', fetchSpy)

    await deleteImage('hero-123-abc.jpg')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/images/hero-123-abc.jpg')
    expect(init.method).toBe('DELETE')
  })

  it('returns success on a 200 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Image deleted successfully' })
    }))

    const result = await deleteImage('hero-123-abc.jpg')
    expect(result.success).toBe(true)
  })

  it('returns an error on a 404 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ success: false, error: 'File not found' })
    }))

    const result = await deleteImage('nonexistent.jpg')
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/file not found/i)
  })
})

// ---------------------------------------------------------------------------
// replaceImage
// ---------------------------------------------------------------------------

describe('replaceImage', () => {
  let xhrMock: ReturnType<typeof createXhrMock>

  beforeEach(() => {
    xhrMock = createXhrMock()
    vi.stubGlobal('XMLHttpRequest', xhrMock.MockXMLHttpRequest)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uploads the new image and then deletes the old one on success', async () => {
    const newFile = makeFile('new.jpg', 'image/jpeg', 1024)
    const uploadData = { filename: 'hero-new.jpg', url: '/uploads/hero/hero-new.jpg', size: 1024 }

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Image deleted successfully' })
    })
    vi.stubGlobal('fetch', fetchSpy)

    const promise = replaceImage('hero-old.jpg', newFile, 'hero')
    xhrMock.instance._triggerLoad(200, { success: true, data: uploadData })
    const result = await promise

    expect(result.success).toBe(true)
    expect(result.data).toEqual(uploadData)
    // fetch should have been called for the DELETE of the old image
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url] = fetchSpy.mock.calls[0] as [string]
    expect(url).toContain('hero-old.jpg')
  })

  it('returns an error and does not attempt deletion when upload fails', async () => {
    const newFile = makeFile('new.jpg', 'image/jpeg', 1024)

    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const promise = replaceImage('hero-old.jpg', newFile, 'hero')
    xhrMock.instance._triggerLoad(500, { success: false, error: 'Server error' })
    const result = await promise

    expect(result.success).toBe(false)
    // fetch (DELETE) should NOT have been called
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('still returns success even if old image deletion fails', async () => {
    const newFile = makeFile('new.jpg', 'image/jpeg', 1024)
    const uploadData = { filename: 'hero-new.jpg', url: '/uploads/hero/hero-new.jpg', size: 1024 }

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const promise = replaceImage('hero-old.jpg', newFile, 'hero')
    xhrMock.instance._triggerLoad(200, { success: true, data: uploadData })
    const result = await promise

    expect(result.success).toBe(true)
    expect(result.data).toEqual(uploadData)
    consoleSpy.mockRestore()
  })

  it('skips deletion when oldFilename is an empty string', async () => {
    const newFile = makeFile('new.jpg', 'image/jpeg', 1024)
    const uploadData = { filename: 'hero-new.jpg', url: '/uploads/hero/hero-new.jpg', size: 1024 }

    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const promise = replaceImage('', newFile, 'hero')
    xhrMock.instance._triggerLoad(200, { success: true, data: uploadData })
    await promise

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('forwards the progress callback to uploadImage', async () => {
    const newFile = makeFile('new.jpg', 'image/jpeg', 1000)
    const uploadData = { filename: 'hero-new.jpg', url: '/uploads/hero/hero-new.jpg', size: 1000 }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'deleted' })
    }))

    const progressValues: number[] = []
    const promise = replaceImage('hero-old.jpg', newFile, 'hero', (pct) => progressValues.push(pct))

    xhrMock.instance._triggerUploadProgress(500, 1000)  // 50%
    xhrMock.instance._triggerLoad(200, { success: true, data: uploadData })
    await promise

    expect(progressValues).toContain(50)
  })
})
