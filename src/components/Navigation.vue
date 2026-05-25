<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logo from '@/assets/logo.png'

const router = useRouter()
const mobileMenuOpen = ref(false)

const scrollToSection = (sectionId: string) => {
  mobileMenuOpen.value = false
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const navigateTo = (path: string) => {
  mobileMenuOpen.value = false
  router.push(path)
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="logo">
        <img :src="logo" alt="Logo" class="logo-img" />
        <span class="logo-text">Bagas Firmansyah</span>
      </div>

      <div class="menu-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
        <span :class="{ active: mobileMenuOpen }"></span>
        <span :class="{ active: mobileMenuOpen }"></span>
        <span :class="{ active: mobileMenuOpen }"></span>
      </div>

      <ul class="nav-menu" :class="{ active: mobileMenuOpen }">
        <li><a href="#home" @click.prevent="scrollToSection('home')">Home</a></li>
        <li><a href="#about" @click.prevent="scrollToSection('about')">About</a></li>
        <li><a href="#experience" @click.prevent="scrollToSection('experience')">Experience</a></li>
        <li><a href="#projects" @click.prevent="scrollToSection('projects')">Projects</a></li>
        <li><a href="#certificates" @click.prevent="scrollToSection('certificates')">Certificates</a></li>
        <li><a href="#contact" @click.prevent="scrollToSection('contact')">Contact</a></li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(7, 10, 18, 0.78);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  padding: 1rem 2rem;
}

.logo, .logo-img {
  background: transparent !important;
}

.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  cursor: pointer;
}

.logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 8px;
  font-size: 1.5rem;
}

.logo-text {
  color: var(--color-text);
  font-weight: 700;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: clamp(0.9rem, 2vw, 1.6rem);
  margin: 0;
  padding: 0;
}

.nav-menu li a {
  position: relative;
  color: var(--color-text-secondary);
  font-size: 0.94rem;
  font-weight: 500;
  transition: color 0.25s ease;
  white-space: nowrap;
}

.nav-menu li a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.45rem;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8, #10b981);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
}

.nav-menu li a:hover {
  color: #e0f2fe;
}

.nav-menu li a:hover::after {
  transform: scaleX(1);
}

.menu-toggle {
  display: none;
  flex-direction: column;
  cursor: pointer;
  gap: 6px;
}

.menu-toggle span {
  width: 25px;
  height: 3px;
  background-color: var(--color-text);
  border-radius: 3px;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
  }

  .menu-toggle {
    display: flex;
  }

  .nav-menu {
    position: absolute;
    top: 70px;
    left: 0;
    right: 0;
    flex-direction: column;
    background-color: var(--color-background-secondary);
    gap: 0;
    padding: 2rem;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .nav-menu.active {
    transform: translateX(0);
  }

  .nav-menu li {
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .menu-toggle.active span:nth-child(1) {
    transform: rotate(45deg) translate(10px, 10px);
  }

  .menu-toggle.active span:nth-child(2) {
    opacity: 0;
  }

  .menu-toggle.active span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -7px);
  }
}
</style>
