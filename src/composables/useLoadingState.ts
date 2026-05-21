import { ref, computed } from 'vue'

/**
 * useLoadingState composable
 *
 * Provides fine-grained loading state management for async operations.
 * Supports:
 * - Named loading keys so multiple concurrent operations can be tracked independently
 * - Upload progress tracking (0–100) for image uploads
 * - Computed helpers for disabling buttons and showing skeleton loaders
 *
 * Requirements: 10.5
 */
export function useLoadingState() {
  /**
   * Map of operation keys to their loading state.
   * e.g. { 'save': true, 'delete-abc': false }
   */
  const loadingKeys = ref<Record<string, boolean>>({})

  /**
   * Upload progress per key (0–100).
   * Only populated while an upload is in progress.
   */
  const uploadProgress = ref<Record<string, number>>({})

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** True when ANY operation is currently loading. */
  const isAnyLoading = computed<boolean>(() =>
    Object.values(loadingKeys.value).some(Boolean)
  )

  // ─── Loading state helpers ─────────────────────────────────────────────────

  /**
   * Check whether a specific operation is loading.
   * @param key - Operation identifier
   */
  function isLoading(key: string): boolean {
    return loadingKeys.value[key] === true
  }

  /**
   * Mark an operation as started (loading = true).
   * @param key - Operation identifier
   */
  function startLoading(key: string): void {
    loadingKeys.value = { ...loadingKeys.value, [key]: true }
  }

  /**
   * Mark an operation as finished (loading = false) and clear its progress.
   * @param key - Operation identifier
   */
  function stopLoading(key: string): void {
    loadingKeys.value = { ...loadingKeys.value, [key]: false }
    // Clean up progress tracking
    const progress = { ...uploadProgress.value }
    delete progress[key]
    uploadProgress.value = progress
  }

  /**
   * Wrap an async operation with automatic start/stop loading state.
   * The loading key is set to true before the operation and false after,
   * regardless of whether the operation succeeds or throws.
   *
   * @param key       - Operation identifier
   * @param operation - Async function to execute
   * @returns The result of the operation
   */
  async function withLoading<T>(key: string, operation: () => Promise<T>): Promise<T> {
    startLoading(key)
    try {
      return await operation()
    } finally {
      stopLoading(key)
    }
  }

  // ─── Upload progress helpers ───────────────────────────────────────────────

  /**
   * Get the current upload progress for a key (0–100).
   * Returns 0 if no progress has been recorded.
   * @param key - Upload operation identifier
   */
  function getUploadProgress(key: string): number {
    return uploadProgress.value[key] ?? 0
  }

  /**
   * Update the upload progress for a key.
   * Automatically marks the operation as loading when progress > 0 and < 100.
   * Automatically stops loading when progress reaches 100.
   *
   * @param key     - Upload operation identifier
   * @param percent - Progress value between 0 and 100
   */
  function setUploadProgress(key: string, percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent))
    uploadProgress.value = { ...uploadProgress.value, [key]: clamped }

    if (clamped > 0 && clamped < 100) {
      startLoading(key)
    } else if (clamped >= 100) {
      // Keep loading=true briefly so the UI can show "100%" before clearing
      setTimeout(() => stopLoading(key), 400)
    }
  }

  /**
   * Build a progress callback suitable for imageService.uploadImage / replaceImage.
   * Automatically wires progress updates to the given key.
   *
   * @param key - Upload operation identifier
   * @returns A callback that accepts a percent value (0–100)
   */
  function createProgressCallback(key: string): (percent: number) => void {
    return (percent: number) => setUploadProgress(key, percent)
  }

  // ─── Button / UI helpers ───────────────────────────────────────────────────

  /**
   * Returns true when the given key is loading — useful for disabling buttons.
   * Alias for isLoading() with a more semantic name.
   *
   * @param key - Operation identifier
   */
  function isOperationInProgress(key: string): boolean {
    return isLoading(key)
  }

  /**
   * Reset all loading states and progress values.
   * Useful when navigating away or resetting a form.
   */
  function resetAll(): void {
    loadingKeys.value = {}
    uploadProgress.value = {}
  }

  return {
    // State
    loadingKeys,
    uploadProgress,

    // Computed
    isAnyLoading,

    // Loading helpers
    isLoading,
    startLoading,
    stopLoading,
    withLoading,

    // Upload progress helpers
    getUploadProgress,
    setUploadProgress,
    createProgressCallback,

    // UI helpers
    isOperationInProgress,
    resetAll
  }
}
