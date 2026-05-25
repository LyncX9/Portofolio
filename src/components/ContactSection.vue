<script setup lang="ts">
import { computed } from 'vue'
import type { ContactContent } from '@/types'

const props = defineProps<{
  contact?: ContactContent | null
}>()

const fallbackEmail = 'bagaskazama3818@gmail.com'
const fallbackGmailHref = buildGmailHref(fallbackEmail)
const fallbackSubtitle =
  "Have an idea, project, or opportunity in mind? Let's connect through the platform that feels easiest for you."
const fallbackSocialLinks = [
  { id: '1', icon: 'github', label: 'GitHub', href: 'https://github.com/LyncX9' },
  { id: '2', icon: 'gmail', label: 'Gmail', href: fallbackGmailHref },
  { id: '3', icon: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/6281234567890' },
  {
    id: '4',
    icon: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/bagas-firmansyah-a4a16a262',
  },
]

const socialIconPaths: Record<string, string[]> = {
  github: [
    'M12 .5C5.65 .5 .5 5.65 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.18 1.18A11.05 11.05 0 0 1 12 5.66c.98 0 1.97.13 2.89.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35 .5 12 .5Z',
  ],
  gmail: [
    'M4 5h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2Zm0 3.1V17h16V8.1l-7.39 5.54a1 1 0 0 1-1.2 0L4 8.1Zm1.2-1.1L12 12.1 18.8 7H5.2Z',
  ],
  whatsapp: [
    'M12.04 2C6.59 2 2.16 6.43 2.16 11.88c0 1.74.46 3.44 1.33 4.93L2 22l5.31-1.39a9.84 9.84 0 0 0 4.73 1.2h.01c5.45 0 9.88-4.43 9.88-9.88C21.93 6.43 17.5 2 12.04 2Zm0 18.12h-.01a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.15.83.84-3.07-.2-.32a8.15 8.15 0 0 1-1.25-4.36c0-4.54 3.7-8.23 8.25-8.23a8.22 8.22 0 0 1 8.24 8.24c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.16c-.25-.12-1.47-.73-1.7-.81-.23-.08-.4-.12-.57.12-.17.25-.65.81-.8.98-.15.17-.3.19-.55.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.51.12-.12.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.57-1.37-.78-1.88-.21-.5-.42-.43-.57-.44h-.49c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.16 1.59.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z',
  ],
  linkedin: [
    'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v10.75H3V9.75Zm6.25 0h3.83v1.47h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14v5.19h-4v-4.6c0-1.1-.02-2.51-1.53-2.51-1.53 0-1.77 1.2-1.77 2.43v4.68h-4V9.75Z',
  ],
  link: [
    'M10.59 13.41a1 1 0 0 1 0-1.41l2.83-2.83a1 1 0 1 1 1.41 1.41L12 13.41a1 1 0 0 1-1.41 0Zm-3.54 3.54a4 4 0 0 1 0-5.66l2.12-2.12a1 1 0 1 1 1.41 1.41l-2.12 2.12a2 2 0 1 0 2.83 2.83l2.12-2.12a1 1 0 1 1 1.41 1.41l-2.12 2.12a4 4 0 0 1-5.65.01Zm7.78-2.12a1 1 0 0 1 0-1.41l2.12-2.12a2 2 0 0 0-2.83-2.83L12 10.59a1 1 0 1 1-1.41-1.41l2.12-2.12a4 4 0 1 1 5.66 5.66l-2.12 2.12a1 1 0 0 1-1.42-.01Z',
  ],
}

const displaySubtitle = computed(() => {
  const subtitle = props.contact?.subtitle?.trim()
  return subtitle && subtitle.toLowerCase() !== 'get in touch' ? subtitle : fallbackSubtitle
})
const displaySocialLinks = computed(() => {
  const providedLinks = props.contact?.socialLinks?.length ? props.contact.socialLinks : []
  const mergedLinks = [...providedLinks]
  const availableIcons = new Set(
    providedLinks.map((link) => normalizeSocialIcon(link.icon, link.label))
  )

  for (const fallbackLink of fallbackSocialLinks) {
    const fallbackIcon = normalizeSocialIcon(fallbackLink.icon, fallbackLink.label)
    if (!availableIcons.has(fallbackIcon)) {
      mergedLinks.push(fallbackLink)
    }
  }

  const links = mergedLinks.length > 0 ? mergedLinks : fallbackSocialLinks
  return links.map((link) => ({
    ...link,
    href: normalizeSocialHref(link),
  }))
})

function normalizeSocialIcon(icon?: string, label?: string): string {
  const key = `${icon ?? ''} ${label ?? ''}`.toLowerCase()

  if (key.includes('github')) return 'github'
  if (key.includes('gmail') || key.includes('email') || key.includes('mail')) return 'gmail'
  if (key.includes('whatsapp') || key.includes('wa.me') || key.includes('wa')) return 'whatsapp'
  if (key.includes('linkedin')) return 'linkedin'

  return 'link'
}

function getSocialIconPaths(icon?: string, label?: string): string[] {
  return socialIconPaths[normalizeSocialIcon(icon, label)] ?? socialIconPaths.link ?? []
}

function buildGmailHref(email: string): string {
  const address = encodeURIComponent(email.trim())
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${address}`
}

function normalizeSocialHref(link: { icon?: string; label?: string; href?: string }): string {
  const href = link.href?.trim()
  const icon = normalizeSocialIcon(link.icon, link.label)

  if (icon === 'gmail') {
    if (!href || href === '#') return fallbackGmailHref
    if (href.startsWith('mailto:')) return buildGmailHref(href.replace(/^mailto:/i, ''))
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)) return buildGmailHref(href)
  }

  return href || '#'
}
</script>

<template>
  <section id="contact" class="contact">
    <div class="contact-container">
      <h2 class="section-title">Contact</h2>
      <p class="contact-subtitle">{{ displaySubtitle }}</p>

      <div class="social-links">
        <a
          v-for="link in displaySocialLinks"
          :key="link.id"
          :href="link.href"
          class="social-link"
          :title="link.label"
          :aria-label="link.label"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              v-for="path in getSocialIconPaths(link.icon, link.label)"
              :key="path"
              :d="path"
            />
          </svg>
          <span class="sr-only">{{ link.label }}</span>
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

.social-links {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2.5rem;
  flex-wrap: wrap;
}

.social-link {
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  color: var(--color-text);
  background: rgba(168, 85, 247, 0.1);
  border-radius: 50%;
  border: 1px solid var(--color-border);
}

.social-link:hover {
  background: rgba(168, 85, 247, 0.2);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-3px);
}

.social-icon {
  width: 1.35rem;
  height: 1.35rem;
  fill: currentColor;
  transition: transform 0.3s ease;
}

.social-link:hover .social-icon {
  transform: scale(1.08);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .contact {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .social-links {
    gap: 0.75rem;
  }

  .social-link {
    width: 45px;
    height: 45px;
  }

  .social-icon {
    width: 1.2rem;
    height: 1.2rem;
  }
}
</style>
