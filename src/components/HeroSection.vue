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
        <div class="hero-kicker">
          <span class="hero-kicker__dot"></span>
          Available for internship and freelance projects
        </div>
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
        <div class="hero-actions">
          <a href="#projects" class="hero-button hero-button--primary">View Projects</a>
          <a href="#contact" class="hero-button hero-button--ghost">Contact Me</a>
        </div>
        <div class="hero-metrics" aria-label="Portfolio highlights">
          <div class="hero-metric" data-motion-card>
            <strong>Vue</strong>
            <span>Frontend</span>
          </div>
          <div class="hero-metric" data-motion-card>
            <strong>CRUD</strong>
            <span>Admin-ready</span>
          </div>
          <div class="hero-metric" data-motion-card>
            <strong>API</strong>
            <span>Connected</span>
          </div>
        </div>
      </div>
      <div class="hero-media-wrap">
        <div class="hero-signal" aria-hidden="true">
          <span></span>
          Live portfolio
        </div>
        <div class="ava motion-hero-media" data-motion-card>
          <img :src="profileImageSrc" alt="Profile" class="ava-img" @error="imageFailed = true" />
        </div>
        <div class="hero-code-card" data-motion-card aria-hidden="true">
          <span class="code-dot code-dot--cyan"></span>
          <span>design</span>
          <strong>motion-ready</strong>
        </div>
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
  padding: 112px 2rem 4rem;
  background:
    linear-gradient(115deg, rgba(3, 7, 18, 0.98) 0%, rgba(19, 16, 39, 0.96) 52%, rgba(4, 25, 40, 0.96) 100%),
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
  background: rgba(15, 23, 42, 0.72);
}

.ava-img {
  width: min(410px, 78vw);
  aspect-ratio: 0.86;
  height: auto;
  object-fit: cover;
  object-position: top center;
  border: 1px solid rgba(125, 211, 252, 0.36);
  border-radius: 28px;
  box-shadow:
    0 34px 100px rgba(0, 0, 0, 0.42),
    0 0 0 14px rgba(56, 189, 248, 0.05);
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
  max-width: 1240px;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  max-width: 680px;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  width: fit-content;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgba(125, 211, 252, 0.25);
  border-radius: 999px;
  background: rgba(8, 13, 24, 0.7);
  color: #bae6fd;
  font-size: 0.82rem;
  font-weight: 700;
  box-shadow: 0 18px 50px rgba(14, 165, 233, 0.1);
}

.hero-kicker__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 7px rgba(34, 197, 94, 0.12);
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
  max-width: 760px;
  font-size: clamp(3.1rem, 6.8vw, 6.4rem);
  font-weight: 700;
  line-height: 0.98;
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
  max-width: 590px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-top: 0.35rem;
}

.hero-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.85rem 1.15rem;
  border-radius: 10px;
  font-weight: 800;
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease;
}

.hero-button:hover {
  transform: translateY(-3px);
}

.hero-button--primary {
  color: #03111f;
  background: linear-gradient(135deg, #67e8f9, #a78bfa 58%, #f472b6);
  box-shadow: 0 18px 60px rgba(168, 85, 247, 0.24);
}

.hero-button--ghost {
  color: #e0f2fe;
  border: 1px solid rgba(125, 211, 252, 0.32);
  background: rgba(8, 13, 24, 0.58);
}

.hero-button--ghost:hover {
  border-color: rgba(125, 211, 252, 0.7);
  background: rgba(14, 165, 233, 0.12);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 0.55rem;
  max-width: 520px;
}

.hero-metric {
  padding: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(8, 13, 24, 0.66);
}

.hero-metric strong {
  display: block;
  color: #f8fafc;
  font-size: 1rem;
}

.hero-metric span {
  display: block;
  margin-top: 0.25rem;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 600;
}

.hero-media-wrap {
  position: relative;
  display: grid;
  justify-items: center;
}

.hero-media-wrap::before {
  content: '';
  position: absolute;
  inset: 8% 2% 0 12%;
  border: 1px solid rgba(125, 211, 252, 0.18);
  border-radius: 34px;
  transform: rotate(4deg);
  pointer-events: none;
}

.hero-signal,
.hero-code-card {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: rgba(5, 9, 17, 0.82);
  color: #e2e8f0;
  font-size: 0.82rem;
  font-weight: 800;
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(18px);
}

.hero-signal {
  top: 10%;
  right: 2%;
  padding: 0.7rem 0.85rem;
}

.hero-signal span {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 999px;
  background: #22c55e;
}

.hero-code-card {
  left: 0;
  bottom: 9%;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  color: #94a3b8;
}

.hero-code-card strong {
  color: #e0f2fe;
}

.code-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
}

.code-dot--cyan {
  background: #38bdf8;
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
    padding: 88px 1rem 2.5rem;
  }

  .hero-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .hero-title {
    font-size: 3rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .avatar-container {
    width: 200px;
    height: 200px;
  }

  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .hero-signal,
  .hero-code-card {
    position: static;
    margin: 0.75rem 0;
  }

  .hero-media-wrap::before {
    display: none;
  }
}
</style>
