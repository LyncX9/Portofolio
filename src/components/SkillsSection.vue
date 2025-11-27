<script setup lang="ts">
const techStack = [
  { icon: '⚡', name: 'HTML', category: 'Frontend' },
  { icon: '🟢', name: 'CSS', category: 'Backend' },
  { icon: '🔷', name: 'Java Script', category: 'Language' },
  { icon: '💙', name: 'Vue.js', category: 'Frontend' },
]
</script>
<template>
  <section id="skills" class="skills">
    <div class="skills-container">
      <h2 class="section-title">I build clean, responsive, and modern <span class="gradient-text">web interfaces.</span></h2>
      <p class="skills-subtitle">That values improving people's lives through accessible design. In a project it isn't just the output. It's the.</p>
      
      <div class="tech-grid">
        <div v-for="tech in techStack" :key="tech.name" class="tech-item">
          <div class="tech-icon">{{ tech.icon }}</div>
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
  font-size: 2rem;
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
