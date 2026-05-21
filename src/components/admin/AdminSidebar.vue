<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  isCollapsed?: boolean
}>()

const emit = defineEmits<{
  'toggle-collapse': []
}>()

const route = useRoute()

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '🏠', exact: true },
  { path: '/admin/hero', label: 'Hero', icon: '✨', exact: false },
  { path: '/admin/about', label: 'About', icon: '👤', exact: false },
  { path: '/admin/skills', label: 'Skills', icon: '🛠️', exact: false },
  { path: '/admin/projects', label: 'Projects', icon: '📁', exact: false },
  { path: '/admin/experience', label: 'Experience', icon: '💼', exact: false },
  { path: '/admin/contact', label: 'Contact', icon: '📬', exact: false },
]

function isActive(item: { path: string; exact: boolean }): boolean {
  if (item.exact) {
    return route.path === item.path
  }
  return route.path.startsWith(item.path)
}
</script>

<template>
  <aside class="admin-sidebar" :class="{ 'admin-sidebar--collapsed': isCollapsed }">
    <!-- Logo / Brand -->
    <div class="sidebar-brand">
      <span class="sidebar-brand-icon">⚡</span>
      <span v-if="!isCollapsed" class="sidebar-brand-text">Admin Panel</span>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav" aria-label="Admin navigation">
      <ul class="sidebar-nav-list" role="list">
        <li v-for="item in navItems" :key="item.path">
          <router-link
            :to="item.path"
            class="sidebar-nav-link"
            :class="{ 'sidebar-nav-link--active': isActive(item) }"
            :aria-current="isActive(item) ? 'page' : undefined"
            :title="isCollapsed ? item.label : undefined"
          >
            <span class="sidebar-nav-icon" aria-hidden="true">{{ item.icon }}</span>
            <span v-if="!isCollapsed" class="sidebar-nav-label">{{ item.label }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Collapse toggle -->
    <button
      class="sidebar-toggle"
      :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="emit('toggle-collapse')"
    >
      <span aria-hidden="true">{{ isCollapsed ? '→' : '←' }}</span>
    </button>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width, 220px);
  min-height: 100vh;
  background-color: var(--color-background-secondary);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition-slow, 0.35s ease);
  flex-shrink: 0;
}

.admin-sidebar--collapsed {
  width: var(--sidebar-width-collapsed, 64px);
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
  white-space: nowrap;
  min-height: var(--header-height, 64px);
}

.sidebar-brand-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.sidebar-brand-text {
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-bold, 700);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.5rem;
}

.sidebar-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm, 0.9rem);
  font-weight: var(--font-weight-medium, 500);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  transition:
    background-color var(--transition-base, 0.2s ease),
    color var(--transition-base, 0.2s ease);
  min-height: 2.5rem; /* touch-friendly */
}

.sidebar-nav-link:hover {
  background-color: rgba(168, 85, 247, 0.1);
  color: var(--color-text);
}

.sidebar-nav-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.sidebar-nav-link--active {
  background-color: rgba(168, 85, 247, 0.15);
  color: var(--color-primary);
}

.sidebar-nav-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  width: 1.5rem;
  text-align: center;
}

.sidebar-nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Toggle button */
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  margin: 0.5rem;
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm, 0.875rem);
  cursor: pointer;
  border: 1px solid var(--color-border);
  transition:
    background-color var(--transition-base, 0.2s ease),
    color var(--transition-base, 0.2s ease);
  min-height: 2.5rem;
}

.sidebar-toggle:hover {
  background-color: rgba(168, 85, 247, 0.1);
  color: var(--color-text);
}

.sidebar-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Tablet: auto-collapse */
@media (max-width: 900px) {
  .admin-sidebar {
    width: var(--sidebar-width-collapsed, 64px);
  }

  .sidebar-brand-text,
  .sidebar-nav-label {
    display: none;
  }
}

/* Mobile: hide toggle button (hamburger in header handles open/close) */
@media (max-width: 600px) {
  .sidebar-toggle {
    display: none;
  }
}
</style>
