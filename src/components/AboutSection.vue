<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AboutContent } from '@/types'
import ava from '@/assets/ava.png'

const props = defineProps<{
  about?: AboutContent | null
}>()

// Fallback data used when the store hasn't loaded yet
const fallbackParagraphs = [
  "I'm a frontend development student who enjoys turning ideas into simple, usable web interfaces. I'm currently studying at Nusaputra University while actively building personal projects to strengthen my skills in HTML, CSS, JavaScript, and Vue.js.",
  'I started learning web development on my own, experimenting with small features and gradually understanding how real websites are built. That curiosity keeps me improving, especially in creating clean UI, responsive layouts, and functional interactions.',
  "Right now, I'm focused on becoming a better frontend engineer by learning modern tools, writing cleaner code, and exploring best practices in web development. I'm excited to gain real industry experience through internships and collaborate with teams to build meaningful digital products.",
]
const fallbackSkills = ['HTML', 'CSS', 'Java Script', 'VUE.js']

const displayParagraphs = computed(() =>
  props.about?.paragraphs && props.about.paragraphs.length > 0
    ? props.about.paragraphs
    : fallbackParagraphs
)
const displaySkills = computed(() =>
  props.about?.skills && props.about.skills.length > 0 ? props.about.skills : fallbackSkills
)
const imageFailed = ref(false)
const displayImage = computed(() =>
  props.about?.aboutImage && !imageFailed.value ? props.about.aboutImage : ava
)

watch(
  () => props.about?.aboutImage,
  () => {
    imageFailed.value = false
  }
)
</script>

<template>
  <section id="about" class="about">
    <div class="about-container">
      <div class="section-heading">
        <span class="section-kicker">Profile</span>
        <h2 class="section-title">About</h2>
      </div>
      <div class="about-content">
        <div class="about-image">
          <div class="about-image-card" data-motion-card>
            <span class="about-image-card__label">Portrait</span>
            <img :src="displayImage" alt="About" class="ava-img" @error="imageFailed = true" />
          </div>
        </div>
        <div class="about-text" data-motion-card>
          <div class="about-text__eyebrow">Frontend learner with product-minded execution</div>
          <p v-for="(paragraph, idx) in displayParagraphs" :key="idx">
            {{ paragraph }}
          </p>
          <div class="skills-list">
            <div v-for="skill in displaySkills" :key="skill" class="skill-item" data-motion-card>
              {{ skill }}
            </div>
          </div>
          <div class="about-highlights">
            <div class="about-highlight">
              <strong>Clean UI</strong>
              <span>Readable layouts</span>
            </div>
            <div class="about-highlight">
              <strong>Responsive</strong>
              <span>Mobile-first care</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  padding: 7rem 2rem;
  background:
    linear-gradient(180deg, rgba(3, 7, 18, 0.96), rgba(8, 13, 24, 0.98)),
    var(--color-background);
  position: relative;
}

.about::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.055), transparent),
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 100% 100%, 100% 72px;
  pointer-events: none;
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

.ava-img {
  width: min(360px, 78vw);
  aspect-ratio: 0.86;
  height: auto;
  object-fit: cover;
  object-position: top center;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.72);
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: clamp(2.4rem, 5vw, 4.4rem);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
  margin: 0;
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

.about-image-card {
  position: relative;
  padding: 0.9rem;
  border: 1px solid rgba(125, 211, 252, 0.24);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(168, 85, 247, 0.1)),
    rgba(8, 13, 24, 0.78);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.32);
}

.about-image-card__label {
  position: absolute;
  top: 1.4rem;
  left: 1.4rem;
  z-index: 1;
  padding: 0.45rem 0.65rem;
  border: 1px solid rgba(186, 230, 253, 0.24);
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.7);
  color: #e0f2fe;
  font-size: 0.72rem;
  font-weight: 800;
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
  padding: clamp(1.4rem, 3vw, 2.3rem);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(8, 13, 24, 0.58);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
}

.about-text__eyebrow {
  width: fit-content;
  padding: 0.45rem 0.65rem;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.1);
  color: #86efac;
  font-size: 0.78rem;
  font-weight: 800;
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
  padding: 0.6rem 0.9rem;
  background: rgba(56, 189, 248, 0.09);
  border: 1px solid rgba(125, 211, 252, 0.3);
  border-radius: 999px;
  font-size: 0.9rem;
  color: #e0f2fe;
  font-weight: 700;
  transition: all 0.3s ease;
}

.skill-item:hover {
  background: rgba(56, 189, 248, 0.18);
  transform: translateY(-2px);
}

.about-highlights {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.about-highlight {
  padding: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.62);
}

.about-highlight strong,
.about-highlight span {
  display: block;
}

.about-highlight strong {
  color: #f8fafc;
}

.about-highlight span {
  margin-top: 0.25rem;
  color: #94a3b8;
  font-size: 0.82rem;
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

  .about-highlights {
    grid-template-columns: 1fr;
  }

  .image-placeholder {
    width: 100%;
    max-width: 300px;
    height: 300px;
  }
}
</style>
