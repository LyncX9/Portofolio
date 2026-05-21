<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { NotificationType } from '@/stores/ui'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Notification variant – controls colour and icon */
  type: NotificationType
  /** Text to display inside the toast */
  message: string
  /**
   * Auto-dismiss delay in milliseconds.
   * Pass 0 to disable auto-dismiss.
   * @default 3000
   */
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  duration: 3000
})

// ─── Emits ────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  /** Fired when the toast is dismissed (either manually or after duration) */
  close: []
}>()

// ─── State ────────────────────────────────────────────────────────────────────

/** Controls the CSS enter/exit transition */
const visible = ref(false)

let autoTimer: ReturnType<typeof setTimeout> | null = null

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  // Trigger enter animation on next tick
  requestAnimationFrame(() => {
    visible.value = true
  })

  if (props.duration > 0) {
    autoTimer = setTimeout(dismiss, props.duration)
  }
})

onBeforeUnmount(() => {
  if (autoTimer !== null) {
    clearTimeout(autoTimer)
  }
})

// ─── Methods ──────────────────────────────────────────────────────────────────

function dismiss() {
  if (autoTimer !== null) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
  visible.value = false
  // Wait for exit animation before emitting close
  setTimeout(() => emit('close'), 300)
}
</script>

<template>
  <Transition name="toast">
    <div
      v-if="visible"
      class="toast"
      :class="`toast--${type}`"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <!-- Icon -->
      <span class="toast__icon" aria-hidden="true">
        <svg v-if="type === 'success'" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <svg v-else-if="type === 'error'" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <svg v-else-if="type === 'warning'" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </span>

      <!-- Message -->
      <p class="toast__message">{{ message }}</p>

      <!-- Close button -->
      <button
        class="toast__close"
        type="button"
        aria-label="Dismiss notification"
        @click="dismiss"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Base toast ─────────────────────────────────────────────────────────────── */
.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 280px;
  max-width: 420px;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  border: 1px solid transparent;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    0 1px 4px rgba(0, 0, 0, 0.3);
  pointer-events: all;
}

/* ── Type variants ──────────────────────────────────────────────────────────── */
.toast--success {
  background-color: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
}

.toast--error {
  background-color: rgba(236, 72, 153, 0.15);
  border-color: rgba(236, 72, 153, 0.4);
  color: #f9a8d4;
}

.toast--warning {
  background-color: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fcd34d;
}

/* ── Icon ───────────────────────────────────────────────────────────────────── */
.toast__icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.0625rem; /* optical alignment with first line of text */
}

.toast__icon svg {
  width: 100%;
  height: 100%;
}

/* ── Message ────────────────────────────────────────────────────────────────── */
.toast__message {
  flex: 1;
  font-size: 0.9rem;
  font-family: 'Poppins', sans-serif;
  line-height: 1.5;
  color: inherit;
  margin: 0;
  word-break: break-word;
}

/* ── Close button ───────────────────────────────────────────────────────────── */
.toast__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    background-color 0.15s ease;
  margin-top: 0.0625rem;
}

.toast__close:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
}

.toast__close:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  opacity: 1;
}

.toast__close svg {
  width: 100%;
  height: 100%;
}

/* ── Enter / exit animations ────────────────────────────────────────────────── */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.toast-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
