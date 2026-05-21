<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminHeader from '@/components/admin/AdminHeader.vue'

const authStore = useAuthStore()
const router = useRouter()

// ── Sidebar state ──────────────────────────────────────────────────────────

/**
 * On desktop (>900px) the sidebar is always visible and can be collapsed to
 * icon-only mode. On tablet (601–900px) it auto-collapses. On mobile (≤600px)
 * the sidebar is hidden off-screen and slides in as an overlay.
 */
const isMobile = ref<boolean>(window.innerWidth <= 600)
const isSidebarCollapsed = ref<boolean>(window.innerWidth <= 900)
const isMobileSidebarOpen = ref<boolean>(false)

function handleResize() {
  const width = window.innerWidth
  isMobile.value = width <= 600
  if (width > 600) {
    // Close mobile overlay when resizing to tablet/desktop
    isMobileSidebarOpen.value = false
    // Auto-collapse on tablet
    isSidebarCollapsed.value = width <= 900
  }
}

function toggleSidebar() {
  if (isMobile.value) {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  } else {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

// ── Unsaved changes ────────────────────────────────────────────────────────

const hasUnsavedChanges = ref<boolean>(false)

function setUnsavedChanges(value: boolean) {
  hasUnsavedChanges.value = value
}

provide('setUnsavedChanges', setUnsavedChanges)
provide('hasUnsavedChanges', hasUnsavedChanges)
</script>

<template>
  <div class="admin-layout">
    <!-- Mobile sidebar overlay backdrop -->
    <div
      class="sidebar-overlay"
      :class="{ 'is-visible': isMobileSidebarOpen }"
      aria-hidden="true"
      @click="closeMobileSidebar"
    />

    <!-- Sidebar -->
    <AdminSidebar
      :is-collapsed="isSidebarCollapsed"
      :class="{ 'is-open': isMobileSidebarOpen }"
      @toggle-collapse="toggleSidebar"
    />

    <!-- Main content area -->
    <div class="admin-main">
      <!-- Header (passes hamburger toggle for mobile) -->
      <AdminHeader :show-hamburger="isMobile" @toggle-sidebar="toggleSidebar" />

      <!-- Unsaved changes banner -->
      <div v-if="hasUnsavedChanges" class="unsaved-banner" role="status" aria-live="polite">
        <span>⚠️ You have unsaved changes.</span>
      </div>

      <!-- Dynamic content via router-view -->
      <main class="admin-content" id="main-content" tabindex="-1">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-background);
}

/* Main area (header + content) */
.admin-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; /* prevent flex overflow */
  overflow: hidden;
}

/* Unsaved changes banner */
.unsaved-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  background-color: rgba(236, 72, 153, 0.1);
  border-bottom: 1px solid rgba(236, 72, 153, 0.3);
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* Content area */
.admin-content {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}

/* Route transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 600px) {
  .admin-content {
    padding: var(--space-4);
  }

  .unsaved-banner {
    padding: 0.5rem var(--space-4);
  }
}
</style>
