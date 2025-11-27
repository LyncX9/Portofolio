<script setup lang="ts">
const projects = [
  {
    id: 1,
    title: 'PocketExpenseMonitor',
    category: 'Featured Project',
    description: 'A mobile app to track daily expenses and manage budgets effectively.',
    features: ['Responsive Design', 'Offline Support', 'Data Visualization'],
    featured: true
  },
]
</script>

<template>
  <section id="projects" class="projects">
    <div class="projects-container">
      <h2 class="section-title">Projects</h2>
      <div class="projects-grid">
        <div v-for="(project, index) in projects" :key="project.id" class="project-card" :class="{ featured: project.featured }">
          <div class="project-image">
            <div class="image-placeholder">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="url(#grad)"/>
                <circle cx="100" cy="80" r="30" fill="#a855f7" opacity="0.5"/>
                <circle cx="200" cy="120" r="40" fill="#ec4899" opacity="0.4"/>
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#a855f7;stop-opacity:0.1" />
                    <stop offset="100%" style="stop-color:#ec4899;stop-opacity:0.1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div class="project-content">
            <span class="project-category">{{ project.category }}</span>
            <h3>{{ project.title }}</h3>
            <p class="project-description">{{ project.description }}</p>
            <div class="project-features">
              <span v-for="(feature, idx) in project.features" :key="idx" class="feature-tag">
                {{ feature }}
              </span>
            </div>
            <a href="https://github.com/LyncX9/PocketExpenseMonitor.git" class="project-link">View project →</a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.projects {
  padding: 6rem 2rem;
  background-color: var(--color-background);
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

.project-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;
  background: rgba(26, 26, 46, 0.3);
  border: 1px solid var(--color-border);
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.project-card:hover {
  background: rgba(26, 26, 46, 0.5);
  border-color: var(--color-primary);
  box-shadow: 0 10px 40px rgba(168, 85, 247, 0.15);
}

.project-card.featured {
  border-color: var(--color-primary);
  background: rgba(168, 85, 247, 0.05);
}

.project-image {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
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
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 600;
  text-transform: uppercase;
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

.project-link {
  align-self: flex-start;
  color: var(--color-primary);
  font-weight: 600;
  transition: all 0.3s ease;
}

.project-link:hover {
  color: var(--color-accent);
  transform: translateX(5px);
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
