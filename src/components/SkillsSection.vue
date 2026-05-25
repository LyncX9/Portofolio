<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/types'

const props = defineProps<{
  skills?: Skill[] | null
}>()

// Fallback data used when the store hasn't loaded yet
const fallbackSkills: Skill[] = [
  { id: '1', icon: '⚡', name: 'HTML', category: 'Frontend', order: 1 },
  { id: '2', icon: '🟢', name: 'CSS', category: 'Frontend', order: 2 },
  { id: '3', icon: '🔷', name: 'Java Script', category: 'Language', order: 3 },
  { id: '4', icon: '💙', name: 'Vue.js', category: 'Frontend', order: 4 },
]

const displaySkills = computed(() =>
  props.skills && props.skills.length > 0 ? props.skills : fallbackSkills
)

function iconLabel(icon: string, name: string): string {
  if (!icon || icon.includes('-')) {
    return name.slice(0, 2).toUpperCase()
  }
  return icon
}

function isImageIcon(icon: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(icon) || icon.startsWith('/uploads/')
}
</script>

<template>
  <section id="skills" class="skills">
    <div class="skills-container">
      <h2 class="section-title">
        I build clean, responsive, and modern <span class="gradient-text">web interfaces.</span>
      </h2>
      <p class="skills-subtitle">
        That values improving people's lives through accessible design. In a project it isn't just
        the output. It's the.
      </p>

      <div class="tech-grid">
        <div v-for="tech in displaySkills" :key="tech.id" class="tech-item">
          <div class="tech-icon">
            <img
              v-if="isImageIcon(tech.icon)"
              :src="tech.icon"
              :alt="`${tech.name} icon`"
              class="tech-icon-img"
            />
            <span v-else>{{ iconLabel(tech.icon, tech.name) }}</span>
          </div>
          <span class="tech-name">{{ tech.name }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.skills {
  padding: 6rem 2rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
  position: relative;
}

.skills::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.1), transparent);
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.skills-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  text-align: center;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 1rem;
  line-height: 1.3;
}

.skills-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin-bottom: 3rem;
  line-height: 1.6;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.tech-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(26, 26, 46, 0.5);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tech-item:hover {
  background: rgba(26, 26, 46, 0.8);
  border-color: var(--color-primary);
  transform: translateY(-5px);
}

.tech-icon {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(16, 185, 129, 0.12));
  border: 1px solid rgba(125, 211, 252, 0.25);
  color: #e0f2fe;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0;
}

.tech-icon-img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}

.tech-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

@media (max-width: 768px) {
  .skills {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .tech-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 1rem;
  }

  .tech-item {
    padding: 1rem;
  }

  .tech-icon {
    font-size: 1.5rem;
  }

  .tech-name {
    font-size: 0.8rem;
  }
}
</style>
