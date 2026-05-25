<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import Footer from './components/Footer.vue'
import NotificationContainer from './components/admin/NotificationContainer.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

let revealObserver: IntersectionObserver | null = null

function setupScrollReveal(): void {
  revealObserver?.disconnect()
  revealObserver = null

  if (isAdminRoute.value || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    },
    { threshold: 0.14 }
  )

  document.querySelectorAll('main > section').forEach((section) => {
    section.classList.add('scroll-reveal')
    revealObserver?.observe(section)
  })
}

onMounted(() => {
  nextTick(setupScrollReveal)
})

watch(
  () => route.fullPath,
  () => {
    nextTick(setupScrollReveal)
  }
)

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})
</script>

<template>
  <Navigation v-if="!isAdminRoute" />
  <RouterView />
  <Footer v-if="!isAdminRoute" />
  <!-- Global notification toasts - rendered via Teleport to body -->
  <NotificationContainer />
</template>

<style scoped>
main {
  width: 100%;
  background-color: var(--color-background);
}
</style>
