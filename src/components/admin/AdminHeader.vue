<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps<{
  /** Show hamburger menu button (mobile only) */
  showHamburger?: boolean
}>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = computed(() => authStore.username ?? 'Admin')

// Derive a human-readable section title from the current route
const sectionTitle = computed<string>(() => {
  const path = route.path
  if (path === '/admin' || path === '/admin/') return 'Dashboard'
  if (path.startsWith('/admin/hero')) return 'Hero Section'
  if (path.startsWith('/admin/about')) return 'About Section'
  if (path.startsWith('/admin/skills')) return 'Skills'
  if (path.startsWith('/admin/projects')) return 'Projects'
  if (path.startsWith('/admin/experience')) return 'Experience'
  if (path.startsWith('/admin/contact')) return 'Contact'
  return 'Admin'
})

async function handleLogout() {
  await authStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <header class="admin-header">
    <!-- Hamburger (mobile only) + Section title -->
    <div class="header-title">
      <button
        v-if="showHamburger"
        class="sidebar-hamburger"
        aria-label="Open navigation menu"
        @click="emit('toggle-sidebar')"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <rect y="2" width="18" height="2" rx="1" fill="currentColor" />
          <rect y="8" width="18" height="2" rx="1" fill="currentColor" />
          <rect y="14" width="18" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
      <h1 class="header-section-title">{{ sectionTitle }}</h1>
    </div>

    <!-- User info and logout -->
    <div class="header-user">
      <div class="header-user-info" aria-label="Logged in as">
        <span class="header-user-avatar" aria-hidden="true">👤</span>
        <span class="header-username">{{ username }}</span>
      </div>

      <button
        class="header-logout-btn"
        :disabled="authStore.isLoading"
        aria-label="Log out"
        @click="handleLogout"
      >
        <span aria-hidden="true">🚪</span>
        <span class="logout-label">Logout</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: var(--header-height, 64px);
  background-color: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  gap: 1rem;
}

/* Title */
.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.header-section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* User area */
.header-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.header-user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background-color: rgba(168, 85, 247, 0.08);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
}

.header-user-avatar {
  font-size: 1rem;
}

.header-username {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

/* Logout button */
.header-logout-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background-color: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background-color var(--transition-base, 0.2s ease),
    color var(--transition-base, 0.2s ease),
    border-color var(--transition-base, 0.2s ease);
  min-height: 2.25rem;
}

.header-logout-btn:hover:not(:disabled) {
  background-color: rgba(236, 72, 153, 0.1);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.header-logout-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.header-logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Hamburger button */
.sidebar-hamburger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background-color var(--transition-base, 0.2s ease),
    color var(--transition-base, 0.2s ease);
}

.sidebar-hamburger:hover {
  background-color: rgba(168, 85, 247, 0.1);
  color: var(--color-text);
}

.sidebar-hamburger:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Responsive: hide text labels on small screens */
@media (max-width: 600px) {
  .header-username,
  .logout-label {
    display: none;
  }

  .admin-header {
    padding: 0 1rem;
  }

  .header-user-info {
    padding: 0.375rem 0.5rem;
  }
}
</style>
