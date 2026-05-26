<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HeroContent } from '@/types'
import ava from '@/assets/ava.png'

const props = defineProps<{
  hero?: HeroContent | null
}>()

const imageFailed = ref(false)

const profileImageSrc = computed(() =>
  props.hero?.profileImage && !imageFailed.value ? props.hero.profileImage : ava
)

watch(
  () => props.hero?.profileImage,
  () => {
    imageFailed.value = false
  }
)
</script>

<template>
  <section id="hero" class="hero">
    <div class="hero-container">
      <div class="hero-content motion-hero-copy">
        <div class="greeting">
          <span>{{ hero?.greeting ?? 'Hello! I Am' }}</span>
          <span class="gradient-text">{{ hero?.name ?? 'Bagas Firmansyah' }}</span>
        </div>
        <h1 class="hero-title">{{ hero?.title ?? 'Aspiring Web Developer' }}</h1>
        <p class="hero-description">
          {{ hero?.description ?? 'Currently learning and building frontend projects while studying at' }}
          <span class="highlight">Nusaputra University</span>
        </p>
        <p class="hero-bio">
          {{ hero?.bio ?? "I'm a web development enthusiast who enjoys turning ideas into simple, usable interfaces. I'm currently expanding my skills in frontend technologies and eager to gain real industry experience." }}
        </p>
      </div>
      <div class="ava motion-hero-media" data-motion-card>
        <img :src="profileImageSrc" alt="Profile" class="ava-img" @error="imageFailed = true" />
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
  background:
    linear-gradient(115deg, rgba(8, 13, 24, 0.96) 0%, rgba(19, 16, 39, 0.96) 54%, rgba(9, 22, 36, 0.94) 100%),
    var(--color-background);
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.65), transparent 78%);
  pointer-events: none;
}

.ava .ava-img {
  background: rgba(15, 23, 42, 0.62);
}

.ava-img {
  width: min(360px, 78vw);
  aspect-ratio: 1;
  height: auto;
  object-fit: cover;
  border: 1px solid rgba(125, 211, 252, 0.3);
  border-radius: 20px;
  box-shadow:
    0 26px 80px rgba(0, 0, 0, 0.35),
    0 0 0 10px rgba(56, 189, 248, 0.04);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.ava-img:hover {
  transform: translateY(-4px);
  box-shadow:
    0 32px 110px rgba(14, 165, 233, 0.18),
    0 0 0 10px rgba(16, 185, 129, 0.05);
}


.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.08), transparent 34%, rgba(236, 72, 153, 0.08));
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
  max-width: 680px;
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
  font-size: clamp(2.7rem, 6vw, 5.3rem);
  font-weight: 700;
  line-height: 1.04;
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
