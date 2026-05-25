<script setup lang="ts">
import { computed } from 'vue'
import type { Experience } from '@/types'

const props = defineProps<{
  experience?: Experience[] | null
}>()

const displayExperience = computed(() => props.experience ?? [])
</script>

<template>
  <section id="experience" class="experience">
    <div class="experience-container">
      <h2 class="section-title">Work Experience</h2>
      <div v-if="displayExperience.length > 0" class="experience-grid">
        <div v-for="exp in displayExperience" :key="exp.id" class="experience-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h3>{{ exp.title }}</h3>
          <p class="company">{{ exp.company }}</p>
          <p class="duration">{{ exp.duration }}</p>
          <ul class="description-list">
            <li v-for="(desc, idx) in exp.descriptions" :key="idx" class="description">
              {{ desc }}
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="empty-state">
        <p class="empty-state__title">No work experience yet</p>
        <p class="empty-state__text">Work experience you add from the admin dashboard will appear here.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.experience {
  padding: 6rem 2rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%);
  position: relative;
}

.description-list {
  list-style-type: disc;
  padding-left: 0.8rem;
  margin: 0;
}

.experience::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.05), transparent);
  pointer-events: none;
}

.experience-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 3rem;
}

.experience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
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

.experience-card {
  background: rgba(26, 26, 46, 0.5);
  border: 1px solid var(--color-border);
  border-radius: 15px;
  padding: 2rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.experience-card:hover {
  background: rgba(26, 26, 46, 0.8);
  border-color: var(--color-primary);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(168, 85, 247, 0.2);
}

.card-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.card-icon svg {
  width: 60%;
  height: 60%;
}

.experience-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.company {
  font-size: 0.9rem;
  color: var(--color-primary);
  font-weight: 600;
  margin: 0;
}

.duration {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.description {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  flex-grow: 1;
}

.view-more {
  color: var(--color-primary);
  font-weight: 600;
  transition: color 0.3s ease;
  align-self: flex-start;
}

.view-more:hover {
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .experience {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .experience-grid {
    grid-template-columns: 1fr;
  }
}
</style>
