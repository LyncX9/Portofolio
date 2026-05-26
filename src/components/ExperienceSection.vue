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
      <div class="section-heading">
        <span class="section-kicker">Timeline</span>
        <h2 class="section-title">Work Experience</h2>
      </div>
      <div v-if="displayExperience.length > 0" class="experience-grid">
        <div
          v-for="(exp, index) in displayExperience"
          :key="exp.id"
          class="experience-card"
          data-motion-card
        >
          <span class="experience-index">{{ String(index + 1).padStart(2, '0') }}</span>
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
  padding: 7rem 2rem;
  background:
    linear-gradient(135deg, rgba(8, 13, 24, 0.98) 0%, rgba(17, 24, 39, 0.94) 100%),
    var(--color-background);
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
  background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.06), transparent);
  pointer-events: none;
}

.experience-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.section-heading {
  margin-bottom: 3rem;
}

.section-kicker {
  display: inline-flex;
  margin-bottom: 0.7rem;
  color: #67e8f9;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.section-title {
  font-size: clamp(2.4rem, 5vw, 4.4rem);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
  margin: 0;
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
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.86), rgba(22, 17, 42, 0.7));
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.experience-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, #67e8f9, #a855f7, #ec4899);
}

.experience-card:hover {
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(23, 20, 48, 0.82));
  border-color: rgba(125, 211, 252, 0.42);
  transform: translateY(-5px);
  box-shadow: 0 26px 80px rgba(14, 165, 233, 0.12);
}

.experience-index {
  position: absolute;
  top: 1.4rem;
  right: 1.4rem;
  color: rgba(226, 232, 240, 0.12);
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
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
