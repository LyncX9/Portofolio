<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

interface Props {
  isOpen: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}

function handleOverlayClick(event: MouseEvent) {
  // Only close if the click is directly on the overlay, not on the dialog panel
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.isOpen) return

  if (event.key === 'Enter') {
    event.preventDefault()
    handleConfirm()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    handleCancel()
  }
}

// Lock body scroll when dialog is open
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // Restore scroll in case component is destroyed while open
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="isOpen"
        class="dialog-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'confirm-dialog-title' : undefined"
        :aria-describedby="message ? 'confirm-dialog-message' : undefined"
        @click="handleOverlayClick"
      >
        <div class="dialog-panel">
          <!-- Icon -->
          <div class="dialog-icon" aria-hidden="true">⚠</div>

          <!-- Title -->
          <h2 v-if="title" id="confirm-dialog-title" class="dialog-title">
            {{ title }}
          </h2>

          <!-- Message -->
          <p v-if="message" id="confirm-dialog-message" class="dialog-message">
            {{ message }}
          </p>

          <!-- Actions -->
          <div class="dialog-actions">
            <button
              type="button"
              class="btn btn-cancel"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="btn btn-confirm"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>

          <!-- Keyboard hint -->
          <p class="dialog-hint" aria-hidden="true">
            Press <kbd>Enter</kbd> to confirm or <kbd>Esc</kbd> to cancel
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ───────────────────────────────────────────── */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}

/* ── Panel ─────────────────────────────────────────────── */
.dialog-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 420px;
  padding: 2rem 1.75rem 1.5rem;
  background-color: var(--color-background, #1e1e2e);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  text-align: center;
}

/* ── Icon ──────────────────────────────────────────────── */
.dialog-icon {
  font-size: 2.25rem;
  line-height: 1;
  margin-bottom: 0.25rem;
}

/* ── Title ─────────────────────────────────────────────── */
.dialog-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #e2e8f0);
  line-height: 1.3;
}

/* ── Message ───────────────────────────────────────────── */
.dialog-message {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary, #94a3b8);
  line-height: 1.6;
}

/* ── Actions ───────────────────────────────────────────── */
.dialog-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;
}

.btn {
  flex: 1;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.1s ease;
  outline: none;
}

.btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.4);
}

.btn:active {
  transform: scale(0.97);
}

.btn-cancel {
  background-color: var(--color-background-secondary, #2a2a3e);
  color: var(--color-text, #e2e8f0);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.btn-cancel:hover {
  background-color: var(--color-border, rgba(255, 255, 255, 0.15));
}

.btn-confirm {
  background-color: var(--color-accent, #ec4899);
  color: #ffffff;
}

.btn-confirm:hover {
  background-color: #db2777;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.35);
}

/* ── Keyboard hint ─────────────────────────────────────── */
.dialog-hint {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #64748b);
  opacity: 0.7;
}

kbd {
  display: inline-block;
  padding: 0.1em 0.4em;
  font-size: 0.7rem;
  font-family: monospace;
  background-color: var(--color-background-secondary, #2a2a3e);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
  border-radius: 4px;
  line-height: 1.4;
}

/* ── Transition ────────────────────────────────────────── */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog-panel,
.dialog-leave-active .dialog-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-panel,
.dialog-leave-to .dialog-panel {
  transform: scale(0.92) translateY(-8px);
  opacity: 0;
}

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 480px) {
  .dialog-panel {
    padding: 1.5rem 1.25rem 1.25rem;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }
}
</style>
