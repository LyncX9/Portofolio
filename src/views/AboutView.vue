<script setup lang="ts">
import { onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import AboutSection from '@/components/AboutSection.vue'
import SkillsSection from '@/components/SkillsSection.vue'
import ExperienceSection from '@/components/ExperienceSection.vue'

const contentStore = useContentStore()

onMounted(async () => {
  if (!contentStore.isContentLoaded) {
    await contentStore.loadContent()
  }
})
</script>

<template>
  <main>
    <AboutSection :about="contentStore.aboutContent" />
    <SkillsSection :skills="contentStore.skillsList" />
    <ExperienceSection :experience="contentStore.experienceList" />
  </main>
</template>
