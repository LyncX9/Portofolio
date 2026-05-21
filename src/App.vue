<script setup lang="ts">
import Navigation from './components/Navigation.vue'
import HeroSection from './components/HeroSection.vue'
import AboutSection from './components/AboutSection.vue'
import ExperienceSection from './components/ExperienceSection.vue'
import ProjectsSection from './components/ProjectsSection.vue'
import SkillsSection from './components/SkillsSection.vue'
import ContactSection from './components/ContactSection.vue'
import Footer from './components/Footer.vue'
import NotificationContainer from './components/admin/NotificationContainer.vue'
</script>

<template>
  <Navigation />
  <main>
    <HeroSection />
    <AboutSection />
    <ExperienceSection />
    <ProjectsSection />
    <SkillsSection />
    <ContactSection />
  </main>
  <Footer />
  <!-- Global notification toasts — rendered via Teleport to body -->
  <NotificationContainer />
</template>

<style scoped>
main {
  width: 100%;
  background-color: var(--color-background);
}
</style>
