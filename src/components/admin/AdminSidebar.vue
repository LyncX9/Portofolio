<script setup lang="ts">
import { useRoute } from 'vue-router'

defineProps<{
  isCollapsed?: boolean
}>()

const emit = defineEmits<{
  'toggle-collapse': []
}>()

const route = useRoute()

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: 'DB', exact: true },
  { path: '/admin/hero', label: 'Hero', icon: 'HE', exact: false },
  { path: '/admin/about', label: 'About', icon: 'AB', exact: false },
  { path: '/admin/skills', label: 'Skills', icon: 'SK', exact: false },
  { path: '/admin/projects', label: 'Projects', icon: 'PR', exact: false },
  { path: '/admin/certificates', label: 'Certificates', icon: 'CR', exact: false },
  { path: '/admin/experience', label: 'Experience', icon: 'EX', exact: false },
  { path: '/admin/contact', label: 'Contact', icon: 'CO', exact: false },
]

function isActive(item: { path: string; exact: boolean }): boolean {
  return item.exact ? route.path === item.path : route.path.startsWith(item.path)
}
</script>

<template>
  <aside class="admin-sidebar" :class="{ 'admin-sidebar--collapsed': isCollapsed }">
    <div class="sidebar-brand">
      <span class="sidebar-brand-icon">BF</span>
      <span v-if="!isCollapsed" class="sidebar-brand-text">Admin Panel</span>
    </div>

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

    <button
      class="sidebar-toggle"
      :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="emit('toggle-collapse')"
    >
      <span aria-hidden="true">{{ isCollapsed ? '>' : '<' }}</span>
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

.sidebar-brand-icon,
.sidebar-nav-icon {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 8px;
  color: #e0f2fe;
  font-size: 0.7rem;
  font-weight: 800;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(16, 185, 129, 0.16));
  border: 1px solid rgba(125, 211, 252, 0.28);
}

.sidebar-brand-text {
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text);
}

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
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  min-height: 2.5rem;
}

.sidebar-nav-link:hover {
  background-color: rgba(56, 189, 248, 0.1);
  color: var(--color-text);
  transform: translateX(2px);
}

.sidebar-nav-link--active {
  background-color: rgba(56, 189, 248, 0.14);
  color: #bae6fd;
}

.sidebar-nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

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
  transition: background-color 0.2s ease, color 0.2s ease;
  min-height: 2.5rem;
}

.sidebar-toggle:hover {
  background-color: rgba(56, 189, 248, 0.1);
  color: var(--color-text);
}

@media (max-width: 900px) {
  .admin-sidebar {
    width: var(--sidebar-width-collapsed, 64px);
  }

  .sidebar-brand-text,
  .sidebar-nav-label {
    display: none;
  }
}

@media (max-width: 600px) {
  .sidebar-toggle {
    display: none;
  }
}
</style>
