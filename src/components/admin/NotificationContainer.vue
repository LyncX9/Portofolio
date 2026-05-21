<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import NotificationToast from '@/components/admin/NotificationToast.vue'

/**
 * NotificationContainer
 *
 * Renders all active notifications from the uiStore as stacked toasts.
 * Positioned fixed at the top-right of the viewport so it overlays all content.
 * Each toast auto-dismisses after its configured duration (default 3 s).
 *
 * Requirements: 10.5, 10.6
 */
const uiStore = useUiStore()
</script>

<template>
  <Teleport to="body">
    <div
      class="notification-container"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <TransitionGroup name="notification-list" tag="div" class="notification-list">
        <NotificationToast
          v-for="notification in uiStore.notifications"
          :key="notification.id"
          :type="notification.type"
          :message="notification.message"
          :duration="notification.duration"
          @close="uiStore.dismissNotification(notification.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Container ───────────────────────────────────────────────────────────── */
.notification-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  pointer-events: none; /* allow clicks to pass through the empty area */
  max-width: 440px;
  width: calc(100vw - 2.5rem);
}

/* ── List ────────────────────────────────────────────────────────────────── */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  align-items: flex-end;
}

/* ── TransitionGroup animations ──────────────────────────────────────────── */
.notification-list-enter-active,
.notification-list-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease,
    max-height 0.3s ease;
}

.notification-list-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-list-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.notification-list-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.notification-list-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Smooth height collapse when items leave */
.notification-list-move {
  transition: transform 0.3s ease;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .notification-container {
    top: 0.75rem;
    right: 0.75rem;
    width: calc(100vw - 1.5rem);
  }
}
</style>
