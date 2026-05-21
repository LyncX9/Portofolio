import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type NotificationType = 'success' | 'error' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration: number
}

export interface Modal {
  id: string
  isOpen: boolean
  title?: string
  message?: string
  component?: unknown
  props?: Record<string, unknown>
}

export interface ModalOptions {
  title?: string
  message?: string
  component?: unknown
  props?: Record<string, unknown>
}

/**
 * UI Store
 * Manages global UI state: loading indicators, notifications, and modals.
 * Requirements: 10.5, 10.6
 */
export const useUiStore = defineStore('ui', () => {
  // State
  const loading = ref<boolean>(false)
  const notifications = ref<Notification[]>([])
  const modals = ref<Modal[]>([])

  // Computed getters
  const hasNotifications = computed<boolean>(() => notifications.value.length > 0)

  const openModals = computed<Modal[]>(() => modals.value.filter(m => m.isOpen))

  const isModalOpen = computed(() => (id: string) => {
    return modals.value.some(m => m.id === id && m.isOpen)
  })

  /**
   * Show a notification toast with auto-dismiss.
   * Requirement 10.5: Display success confirmation messages.
   * Requirement 10.6: Display descriptive error messages.
   * @param type - Notification type: 'success' | 'error' | 'warning'
   * @param message - Message to display
   * @param duration - Auto-dismiss duration in ms (0 = no auto-dismiss, default 3000)
   * @returns The notification ID
   */
  function showNotification(
    type: NotificationType,
    message: string,
    duration: number = 3000
  ): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    const notification: Notification = { id, type, message, duration }
    notifications.value.push(notification)

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissNotification(id)
      }, duration)
    }

    return id
  }

  /**
   * Dismiss a specific notification by ID.
   */
  function dismissNotification(id: string): void {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Clear all active notifications.
   */
  function clearAllNotifications(): void {
    notifications.value = []
  }

  /**
   * Set the global loading state.
   * @param isLoading - Whether a loading operation is in progress
   */
  function setLoading(isLoading: boolean): void {
    loading.value = isLoading
  }

  /**
   * Open a modal by ID, creating it if it doesn't exist.
   * @param id - Unique modal identifier
   * @param options - Optional modal configuration (title, message, component, props)
   */
  function openModal(id: string, options?: ModalOptions): void {
    const existing = modals.value.find(m => m.id === id)

    if (existing) {
      existing.isOpen = true
      if (options?.title !== undefined) existing.title = options.title
      if (options?.message !== undefined) existing.message = options.message
      if (options?.component !== undefined) existing.component = options.component
      if (options?.props !== undefined) existing.props = options.props
    } else {
      modals.value.push({
        id,
        isOpen: true,
        title: options?.title,
        message: options?.message,
        component: options?.component,
        props: options?.props
      })
    }
  }

  /**
   * Close a modal by ID (keeps it in the list for re-use).
   * @param id - Unique modal identifier
   */
  function closeModal(id: string): void {
    const modal = modals.value.find(m => m.id === id)
    if (modal) {
      modal.isOpen = false
    }
  }

  /**
   * Remove a modal from the list entirely.
   * @param id - Unique modal identifier
   */
  function removeModal(id: string): void {
    const index = modals.value.findIndex(m => m.id === id)
    if (index !== -1) {
      modals.value.splice(index, 1)
    }
  }

  /**
   * Close all open modals.
   */
  function closeAllModals(): void {
    modals.value.forEach(modal => {
      modal.isOpen = false
    })
  }

  /**
   * Reset store to initial state.
   */
  function $reset(): void {
    loading.value = false
    notifications.value = []
    modals.value = []
  }

  return {
    // State
    loading,
    notifications,
    modals,

    // Computed
    hasNotifications,
    openModals,
    isModalOpen,

    // Actions
    showNotification,
    dismissNotification,
    clearAllNotifications,
    setLoading,
    openModal,
    closeModal,
    removeModal,
    closeAllModals,
    $reset
  }
})
