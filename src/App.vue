<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import Footer from './components/Footer.vue'
import NotificationContainer from './components/admin/NotificationContainer.vue'
import {
  animatePageIn,
  animateRouteTransition,
  initBarbaTransitions,
  revealElement,
  setupMotionEnhancements,
} from './utils/motion'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

let revealObserver: IntersectionObserver | null = null
let cleanupMotion: (() => void) | null = null
let motionSetupTimer: number | null = null

function scheduleMotionSetup(): void {
  nextTick(() => {
    setupScrollReveal()

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(setupScrollReveal)

      if (motionSetupTimer) {
        window.clearTimeout(motionSetupTimer)
      }
      motionSetupTimer = window.setTimeout(setupScrollReveal, 250)
    }
  })
}

function setupScrollReveal(): void {
  revealObserver?.disconnect()
  revealObserver = null
  cleanupMotion?.()
  cleanupMotion = null

  if (isAdminRoute.value || typeof window === 'undefined') {
    return
  }

  const sections = document.querySelectorAll('main > section')

  if (!('IntersectionObserver' in window)) {
    sections.forEach((section) => {
      section.classList.add('scroll-reveal', 'is-visible')
    })
    cleanupMotion = setupMotionEnhancements(document)
    animatePageIn(document)
    return
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealElement(entry.target)
          revealObserver?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.14 }
  )

  sections.forEach((section) => {
    section.classList.add('scroll-reveal')
    revealObserver?.observe(section)
  })

  cleanupMotion = setupMotionEnhancements(document)
  animatePageIn(document)
}

onMounted(() => {
  nextTick(() => {
    initBarbaTransitions()
    scheduleMotionSetup()
  })
})

watch(
  () => route.fullPath,
  () => {
    if (!isAdminRoute.value) {
      animateRouteTransition()
    }
    scheduleMotionSetup()
  }
)

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  cleanupMotion?.()
  if (motionSetupTimer) {
    window.clearTimeout(motionSetupTimer)
  }
})
</script>

<template>
  <Navigation v-if="!isAdminRoute" />
  <div v-if="!isAdminRoute" class="barba-shell" data-barba="wrapper">
    <div
      :key="route.fullPath"
      class="barba-container"
      data-barba="container"
      :data-barba-namespace="String(route.name ?? 'portfolio')"
    >
      <RouterView />
    </div>
  </div>
  <RouterView v-else />
  <Footer v-if="!isAdminRoute" />
  <div v-if="!isAdminRoute" class="barba-transition-panel" aria-hidden="true"></div>
  <!-- Global notification toasts - rendered via Teleport to body -->
  <NotificationContainer />
</template>

<style scoped>
main {
  width: 100%;
  background-color: var(--color-background);
}

.barba-shell,
.barba-container {
  min-height: 100vh;
}

.barba-transition-panel {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  transform: translateY(-100%);
  background:
    linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(168, 85, 247, 0.24)),
    #070a12;
}
</style>
