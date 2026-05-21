<script setup lang="ts">
import { onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import HeroSection from '@/components/HeroSection.vue'
import ProjectsSection from '@/components/ProjectsSection.vue'
import ContactSection from '@/components/ContactSection.vue'

const contentStore = useContentStore()

onMounted(async () => {
  if (!contentStore.isContentLoaded) {
    await contentStore.loadContent()
  }
})
</script>

<template>
  <main>
    <HeroSection :hero="contentStore.heroContent" />
    <ProjectsSection :projects="contentStore.projectsList" />
    <ContactSection :contact="contentStore.contactContent" />
  </main>
</template>
