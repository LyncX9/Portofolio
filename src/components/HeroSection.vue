<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import type { HeroContent } from '@/types'
import ava from '@/assets/ava.png'

gsap.registerPlugin(ScrollToPlugin)

const props = defineProps<{
  hero?: HeroContent | null
}>()

const imageFailed = ref(false)
const fallbackDescription = 'Currently learning and building intelligent web experiences.'
let activeScrollTween: ReturnType<typeof gsap.to> | null = null

const profileImageSrc = computed(() =>
  props.hero?.profileImage && !imageFailed.value ? props.hero.profileImage : ava
)

function scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId)
  if (!element) return

  const navbarHeight = document.querySelector('.navbar')?.getBoundingClientRect().height ?? 0
  const targetY = Math.max(
    0,
    window.scrollY + element.getBoundingClientRect().top - navbarHeight - 12
  )

  activeScrollTween?.kill()
  activeScrollTween = gsap.to(window, {
    duration: 1.15,
    ease: 'power3.inOut',
    scrollTo: { y: targetY, autoKill: true },
    onComplete: () => {
      activeScrollTween = null
    },
  })
}

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
          {{ hero?.description ?? fallbackDescription }}
        </p>
        <p class="hero-bio">
          {{ hero?.bio ?? "I'm a web development enthusiast who enjoys turning ideas into simple, usable interfaces. I'm currently expanding my skills in frontend technologies and eager to gain real industry experience." }}
        </p>
        <div class="hero-actions">
          <a
            href="#projects"
            class="hero-button hero-button--primary"
            @click.prevent="scrollToSection('projects')"
          >
            View Projects
          </a>
          <a
            href="#contact"
            class="hero-button hero-button--ghost"
            @click.prevent="scrollToSection('contact')"
          >
            Contact Me
          </a>
        </div>
      </div>
      <div class="hero-media-wrap">
        <div class="ava motion-hero-media" data-motion-card>
          <img :src="profileImageSrc" alt="Profile" class="ava-img" @error="imageFailed = true" />
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

  .hero-media-wrap::before {
    display: none;
  }
}
</style>
