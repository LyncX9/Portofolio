<script setup lang="ts">
const socialLinks = [
  { icon: '📧', label: 'Email', href: 'mailto:bagaskazama3818@gmail.com' },
  { icon: '💼', label: 'LinkedIn', href: 'www.linkedin.com/in/bagas-firmansyah-a4a16a262' },
  { icon: '🐙', label: 'GitHub', href: 'https://github.com/LyncX9' },
]
</script>

<template>
  <section id="contact" class="contact">
    <div class="contact-container">
      <h2 class="section-title">Contact</h2>
      <p class="contact-subtitle">
        I’m available for roles where I can contribute as a Web Developer, fullstack engineer, or mobile developer. If you believe I’d be a good fit for your team, feel free to contact me.
      </p>

      <div class="contact-email">
        <a href="mailto:bagaskazama3818@gmail.com" class="email-link">bagaskazama3818@gmail.com</a>
      </div>

      <div class="social-links">
        <a v-for="link in socialLinks" :key="link.label" :href="link.href" class="social-link" :title="link.label">
          {{ link.icon }}
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact {
  padding: 6rem 2rem;
  background-color: var(--color-background);
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.contact-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2rem;
}

.contact-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.highlight {
  color: var(--color-primary);
  font-weight: 600;
}

.contact-email {
  margin: 2rem 0;
}

.email-link {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  transition: all 0.3s ease;
  display: inline-block;
}

.email-link:hover {
  color: var(--color-primary);
  transform: translateY(-2px);
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
}

.social-link {
  font-size: 1.8rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: rgba(168, 85, 247, 0.1);
  border-radius: 50%;
  border: 1px solid var(--color-border);
}

.social-link:hover {
  background: rgba(168, 85, 247, 0.2);
  border-color: var(--color-primary);
  transform: translateY(-3px);
}

@media (max-width: 768px) {
  .contact {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .email-link {
    font-size: 1.2rem;
  }

  .social-links {
    gap: 1.5rem;
  }

  .social-link {
    font-size: 1.3rem;
    width: 45px;
    height: 45px;
  }
}
</style>
