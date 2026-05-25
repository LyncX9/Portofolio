<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useContentStore } from '@/stores/content'

const contentStore = useContentStore()

onMounted(async () => {
  if (!contentStore.isContentLoaded) {
    await contentStore.loadContent()
  }
})

const stats = computed(() => [
  { label: 'Projects', value: contentStore.projectsList.length, to: '/admin/projects' },
  { label: 'Certificates', value: contentStore.certificatesList.length, to: '/admin/certificates' },
  { label: 'Skills', value: contentStore.skillsList.length, to: '/admin/skills' },
  { label: 'Experience', value: contentStore.experienceList.length, to: '/admin/experience' },
])

const checklist = computed(() => [
  {
    label: 'Hero profile is ready',
    complete: Boolean(contentStore.hero?.name && contentStore.hero?.title && contentStore.hero?.profileImage),
    to: '/admin/hero',
  },
  {
    label: 'About section has bio and photo',
    complete: Boolean(contentStore.about?.paragraphs.length && contentStore.about?.aboutImage),
    to: '/admin/about',
  },
  {
    label: 'At least one project is published',
    complete: contentStore.projectsList.length > 0,
    to: '/admin/projects',
  },
  {
    label: 'Contact links are available',
    complete: Boolean(contentStore.contact?.email && contentStore.contact?.socialLinks.length),
    to: '/admin/contact',
  },
])

const completion = computed(() => {
  const complete = checklist.value.filter((item) => item.complete).length
  return Math.round((complete / checklist.value.length) * 100)
})

const recentItems = computed(() => [
  ...contentStore.projectsList.slice(0, 2).map((item) => ({
    title: item.title,
    detail: item.category,
    to: '/admin/projects',
  })),
  ...contentStore.certificatesList.slice(0, 2).map((item) => ({
    title: item.title,
    detail: `${item.issuer} - ${item.issuedAt}`,
    to: '/admin/certificates',
  })),
])
</script>

<template>
  <div class="dashboard-home">
    <section class="dashboard-hero">
      <div>
        <p class="dashboard-kicker">Portfolio control center</p>
        <h1>Dashboard</h1>
        <p>
          Pantau isi portfolio, cek bagian yang belum lengkap, dan lompat cepat ke section yang mau diedit.
        </p>
      </div>
      <RouterLink class="primary-action" to="/">View Website</RouterLink>
    </section>

    <section class="stats-grid" aria-label="Portfolio stats">
      <RouterLink v-for="stat in stats" :key="stat.label" :to="stat.to" class="stat-card">
        <span>{{ stat.label }}</span>
        <strong>{{ stat.value }}</strong>
      </RouterLink>
    </section>

    <div class="dashboard-grid">
      <section class="dashboard-panel">
        <div class="panel-heading">
          <h2>Readiness</h2>
          <span>{{ completion }}%</span>
        </div>
        <div class="progress-bar" aria-hidden="true">
          <span :style="{ width: `${completion}%` }"></span>
        </div>
        <ul class="checklist">
          <li v-for="item in checklist" :key="item.label">
            <span class="check-dot" :class="{ complete: item.complete }">{{ item.complete ? 'OK' : '--' }}</span>
            <RouterLink :to="item.to">{{ item.label }}</RouterLink>
          </li>
        </ul>
      </section>

      <section class="dashboard-panel">
        <div class="panel-heading">
          <h2>Quick Edit</h2>
        </div>
        <div class="quick-actions">
          <RouterLink to="/admin/hero">Hero</RouterLink>
          <RouterLink to="/admin/projects">Projects</RouterLink>
          <RouterLink to="/admin/certificates">Certificates</RouterLink>
          <RouterLink to="/admin/contact">Contact</RouterLink>
        </div>
      </section>

      <section class="dashboard-panel wide">
        <div class="panel-heading">
          <h2>Recent Content</h2>
        </div>
        <div v-if="recentItems.length" class="recent-list">
          <RouterLink v-for="item in recentItems" :key="`${item.to}-${item.title}`" :to="item.to">
            <strong>{{ item.title }}</strong>
            <span>{{ item.detail }}</span>
          </RouterLink>
        </div>
        <p v-else class="empty-note">Belum ada project atau certificate yang bisa ditampilkan.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-home {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.dashboard-hero,
.dashboard-panel,
.stat-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.72);
}

.dashboard-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
}

.dashboard-kicker {
  margin: 0 0 0.35rem;
  color: #7dd3fc;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.dashboard-hero h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 2rem;
}

.dashboard-hero p {
  max-width: 720px;
  margin: 0.5rem 0 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.primary-action,
.quick-actions a,
.recent-list a,
.stat-card {
  text-decoration: none;
}

.primary-action {
  display: inline-flex;
  justify-content: center;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  color: #ffffff;
  background: var(--color-primary);
  font-weight: 700;
  white-space: nowrap;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px rgba(168, 85, 247, 0.28);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.15rem;
  color: var(--color-text);
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.45);
}

.stat-card span {
  color: var(--color-text-secondary);
  font-size: 0.88rem;
}

.stat-card strong {
  font-size: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.dashboard-panel {
  padding: 1.25rem;
}

.dashboard-panel.wide {
  grid-column: 1 / -1;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.panel-heading h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
}

.panel-heading span {
  color: #7dd3fc;
  font-weight: 800;
}

.progress-bar {
  height: 0.55rem;
  margin: 1rem 0;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}

.progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38bdf8, #22c55e);
  transition: width 0.3s ease;
}

.checklist,
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checklist {
  list-style: none;
  padding: 0;
  margin: 0;
}

.checklist li {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.checklist a {
  color: var(--color-text);
  text-decoration: none;
}

.check-dot {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 1.35rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  color: var(--color-text-secondary);
  font-size: 0.65rem;
  font-weight: 800;
}

.check-dot.complete {
  background: rgba(34, 197, 94, 0.16);
  color: #bbf7d0;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.quick-actions a,
.recent-list a {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 8px;
  padding: 0.85rem;
  color: var(--color-text);
  background: rgba(2, 6, 23, 0.24);
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.quick-actions a:hover,
.recent-list a:hover {
  transform: translateY(-2px);
  border-color: rgba(125, 211, 252, 0.4);
}

.recent-list {
  margin-top: 1rem;
}

.recent-list a {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.recent-list span,
.empty-note {
  color: var(--color-text-secondary);
}

.empty-note {
  margin: 1rem 0 0;
}

@media (max-width: 900px) {
  .stats-grid,
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .stats-grid,
  .dashboard-grid,
  .quick-actions {
    grid-template-columns: 1fr;
  }

  .recent-list a {
    flex-direction: column;
  }
}
</style>
