<script setup lang="ts">
</script>

<template>
  <section id="about" class="about">
    <div class="about-container">
      <h2 class="section-title">About</h2>
      <div class="about-content">
        <div class="about-image">
          <div class="image-placeholder">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="80" r="30" fill="#a855f7"/>
              <path d="M 70 120 Q 70 150 100 160 Q 130 150 130 120" fill="#6366f1"/>
              <rect x="60" y="160" width="80" height="30" rx="5" fill="#ec4899"/>
            </svg>
          </div>
        </div>
        <div class="about-text">
          <p>
            I’m a frontend development student who enjoys turning ideas into simple, usable web interfaces. I’m currently studying at Nusaputra University while actively building personal projects to strengthen my skills in HTML, CSS, JavaScript, and Vue.js.
          </p>
          <p>
            I started learning web development on my own, experimenting with small features and gradually understanding how real websites are built. That curiosity keeps me improving, especially in creating clean UI, responsive layouts, and functional interactions.
          </p>
          <p>
            Right now, I’m focused on becoming a better frontend engineer by learning modern tools, writing cleaner code, and exploring best practices in web development. I’m excited to gain real industry experience through internships and collaborate with teams to build meaningful digital products.
          </p>
          <div class="skills-list">
            <div class="skill-item">HTML</div>
            <div class="skill-item">CSS</div>
            <div class="skill-item">Java Script</div>
            <div class="skill-item">VUE.js</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  padding: 6rem 2rem;
  background-color: var(--color-background);
  position: relative;
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 3rem;
}

.about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.about-image {
  display: flex;
  justify-content: center;
}

.image-placeholder {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, var(--color-background-secondary), rgba(99, 102, 241, 0.1));
  border: 1px solid var(--color-border);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-placeholder svg {
  width: 70%;
  height: 70%;
  filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.2));
}

.about-text {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.about-text p {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin: 0;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.skill-item {
  padding: 0.5rem 1rem;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid var(--color-primary);
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--color-primary);
  font-weight: 500;
  transition: all 0.3s ease;
}

.skill-item:hover {
  background: rgba(168, 85, 247, 0.2);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .about {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .about-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .image-placeholder {
    width: 100%;
    max-width: 300px;
    height: 300px;
  }
}
</style>
