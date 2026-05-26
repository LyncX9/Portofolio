<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Project } from '@/types'

const props = defineProps<{
  projects?: Project[] | null
}>()

const displayProjects = computed(() => props.projects ?? [])
const failedImages = ref<Set<string>>(new Set())

function markImageFailed(id: string): void {
  failedImages.value = new Set([...failedImages.value, id])
}

function projectCategories(project: Project): string[] {
  return project.categories?.length
    ? project.categories
    : project.category
      ? [project.category]
      : []
}
</script>

<template>
  <section id="projects" class="projects">
    <div class="projects-container">
      <h2 class="section-title">Projects</h2>
      <div v-if="displayProjects.length > 0" class="projects-grid">
        <div
          v-for="project in displayProjects"
          :key="project.id"
          class="project-card"
          :class="{ featured: project.featured }"
          data-motion-card
        >
          <div class="project-image">
            <img
              v-if="project.image && !failedImages.has(project.id)"
              :src="project.image"
              :alt="project.title"
              class="project-img"
              @error="markImageFailed(project.id)"
            />
            <div v-else class="image-placeholder">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="url(#grad)" />
                <circle cx="100" cy="80" r="30" fill="#a855f7" opacity="0.5" />
                <circle cx="200" cy="120" r="40" fill="#ec4899" opacity="0.4" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color: #a855f7; stop-opacity: 0.1" />
                    <stop offset="100%" style="stop-color: #ec4899; stop-opacity: 0.1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div class="project-content">
            <div class="project-categories" aria-label="Project categories">
              <span
                v-for="category in projectCategories(project)"
                :key="category"
                class="project-category"
              >
                {{ category }}
              </span>
            </div>
            <h3>{{ project.title }}</h3>
            <p class="project-description">{{ project.description }}</p>
            <div class="project-features">
              <span v-for="(feature, idx) in project.features" :key="idx" class="feature-tag">
                {{ feature }}
              </span>
            </div>
            <div class="project-links">
              <a
                v-if="project.link"
                :href="project.link"
                target="_blank"
                rel="noopener noreferrer"
                class="project-link"
                >Live Site</a
              >
              <a
                v-if="project.githubLink"
                :href="project.githubLink"
                target="_blank"
                rel="noopener noreferrer"
                class="project-link github-link"
                >GitHub Repo</a
              >
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p class="empty-state__title">No projects yet</p>
        <p class="empty-state__text">Projects you add from the admin dashboard will appear here.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.projects {
  padding: 6rem 2rem;
  background:
    linear-gradient(180deg, rgba(7, 10, 18, 0.6), rgba(14, 18, 31, 0.95)),
    var(--color-background);
}

.projects-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 3rem;
}

.projects-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 220px;
  padding: 2rem;
  text-align: center;
  border: 1px dashed rgba(148, 163, 184, 0.26);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.36);
}

.empty-state__title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.3rem;
  font-weight: 800;
}

.empty-state__text {
  margin: 0.6rem 0 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.project-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;
  background: rgba(12, 17, 31, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
}

.project-card:hover {
  background: rgba(13, 21, 37, 0.86);
  border-color: rgba(56, 189, 248, 0.42);
  box-shadow: 0 28px 90px rgba(14, 165, 233, 0.12);
}

.project-card.featured {
  border-color: rgba(168, 85, 247, 0.58);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.11), rgba(14, 165, 233, 0.06));
}

.project-image {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
}

.project-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-background-secondary), rgba(99, 102, 241, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder svg {
  width: 100%;
  height: 100%;
}

.project-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-category {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border: 1px solid rgba(168, 85, 247, 0.42);
  border-radius: 999px;
  background: rgba(168, 85, 247, 0.1);
  padding: 0.25rem 0.65rem;
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 600;
  text-transform: uppercase;
}

.project-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-card h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.project-description {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.project-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.feature-tag {
  padding: 0.35rem 0.8rem;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid var(--color-primary);
  border-radius: 15px;
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 500;
}

.project-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.project-link {
  align-self: flex-start;
  padding: 0.65rem 0.95rem;
  border: 1px solid rgba(125, 211, 252, 0.28);
  border-radius: 8px;
  color: #e0f2fe;
  background: rgba(56, 189, 248, 0.08);
  font-weight: 600;
  transition: all 0.3s ease;
}

.project-link:hover {
  color: #ffffff;
  border-color: rgba(125, 211, 252, 0.62);
  transform: translateY(-2px);
}

.github-link {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.28);
  color: #d1fae5;
}

.github-link:hover {
  border-color: rgba(16, 185, 129, 0.58);
  color: #ffffff;
}

@media (max-width: 768px) {
  .projects {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .project-card {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .project-image {
    height: 200px;
  }

  .project-content {
    padding: 1.5rem;
  }

  .project-card h3 {
    font-size: 1.3rem;
  }
}
</style>
