<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const year = ref(new Date().getFullYear())
const scrollPosition = ref(0)

const updateScrollPosition = () => {
  scrollPosition.value = window.scrollY
}

onMounted(() => {
  window.addEventListener('scroll', updateScrollPosition)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScrollPosition)
})
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      <p>&copy; {{ year }} Bagas Firmansyah. All rights reserved.</p>
      <p class="footer-text">Built by Bagas Firmansyah </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: 2rem;
  background: linear-gradient(to top, rgba(168, 85, 247, 0.05), transparent);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-content p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.footer-text {
  font-size: 0.85rem;
}

.heart {
  color: var(--color-accent);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@media (max-width: 768px) {
  .footer {
    padding: 1.5rem 1rem;
  }

  .footer-content p {
    font-size: 0.85rem;
  }
}
</style>
