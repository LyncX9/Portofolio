<script setup lang="ts">
import { onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import HeroSection from '@/components/HeroSection.vue'
import AboutSection from '@/components/AboutSection.vue'
import ExperienceSection from '@/components/ExperienceSection.vue'
import ProjectsSection from '@/components/ProjectsSection.vue'
import CertificatesSection from '@/components/CertificatesSection.vue'
import SkillsSection from '@/components/SkillsSection.vue'
import ContactSection from '@/components/ContactSection.vue'

const contentStore = useContentStore()

onMounted(async () => {
  await contentStore.loadContent()
})
</script>

<template>
  <main>
    <HeroSection :hero="contentStore.heroContent" />
    <AboutSection :about="contentStore.aboutContent" />
    <SkillsSection :skills="contentStore.skillsList" />
    <ProjectsSection :projects="contentStore.projectsList" />
    <CertificatesSection :certificates="contentStore.certificatesList" />
    <ExperienceSection :experience="contentStore.experienceList" />
    <ContactSection :contact="contentStore.contactContent" />
  </main>
</template>
