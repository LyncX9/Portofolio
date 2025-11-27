<script setup lang="ts">
import ava from '@/assets/ava.png'
</script>
<template>
  <section id="hero" class="hero">
    <div class="hero-container">
      <div class="hero-content">
        <div class="greeting">
          <span>Hello! I am</span>
          <span class="gradient-text">Bagas Firmansyah</span>
        </div>
        <h1 class="hero-title">Aspiring Web Developer</h1>
        <p class="hero-description">
          Currently learning and building frontend projects while studying at
          <a href="#" class="highlight">Nusaputra University</a>
        </p>
        <p class="hero-bio">
          I’m a web development enthusiast who enjoys turning ideas into simple, usable interfaces. I’m currently expanding my skills in frontend technologies and eager to gain real industry experience.
        </p>
      </div>
      <div class="ava">
        <img :src="ava" alt="ava" class="ava-img" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 2rem 2rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%);
  position: relative;
  overflow: hidden;
}

.ava .ava-img {
  background: transparent;
}

.ava-img {
  width: 350px;
  height: 350px;
  object-fit: contain;
}


.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.1), transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.1), transparent 50%);
  pointer-events: none;
}

.hero-container {
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.greeting {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 1.2rem;
  color: var(--color-text-secondary);
}

.greeting .gradient-text {
  font-size: 2rem;
  font-weight: 700;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
  margin: 0;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.highlight {
  color: var(--color-primary);
  font-weight: 600;
  transition: color 0.3s ease;
}

.highlight:hover {
  color: var(--color-accent);
}

.hero-bio {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}


.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-container {
  position: relative;
  width: 280px;
  height: 280px;
}

.avatar {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 20px;
  padding: 3px;
  position: relative;
  overflow: hidden;
}

.avatar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1), transparent);
  pointer-events: none;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  background-color: var(--color-background-secondary);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-inner svg {
  width: 70%;
  height: 70%;
  filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.3));
}

@media (max-width: 768px) {
  .hero {
    min-height: auto;
    padding: 80px 1rem 2rem;
  }

  .hero-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .avatar-container {
    width: 200px;
    height: 200px;
  }
}
</style>
