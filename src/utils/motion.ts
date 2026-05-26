import barba from '@barba/core'
import { gsap } from 'gsap'

type BarbaPreventArgs = {
  el?: Element | null
  href?: string
}

const interactiveSelector =
  '[data-motion-card], .project-link, .certificate-link, .social-link, .tech-item, .skill-item'

let barbaReady = false
let hoverCleanup: Array<() => void> = []

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function isAdminPath(value?: string): boolean {
  return Boolean(value && (value.includes('/admin') || value.startsWith('/admin')))
}

export function initBarbaTransitions(): void {
  if (
    barbaReady ||
    typeof window === 'undefined' ||
    prefersReducedMotion() ||
    !document.querySelector('[data-barba="wrapper"]')
  ) {
    return
  }

  barbaReady = true

  try {
    barba.init({
      preventRunning: true,
      prevent: ({ el, href }: BarbaPreventArgs) => {
        const link = el instanceof HTMLAnchorElement ? el : null
        const target = link?.getAttribute('target')
        const rawHref = link?.getAttribute('href') ?? href ?? ''

        return (
          !rawHref ||
          rawHref.startsWith('#') ||
          rawHref.startsWith('mailto:') ||
          rawHref.startsWith('tel:') ||
          rawHref.startsWith('https://mail.google.com') ||
          isAdminPath(rawHref) ||
          target === '_blank'
        )
      },
      transitions: [
        {
          name: 'portfolio-soft-transition',
          leave() {
            return gsap.to('.barba-transition-panel', {
              yPercent: 0,
              duration: 0.32,
              ease: 'power3.inOut',
            })
          },
          enter() {
            return gsap.to('.barba-transition-panel', {
              yPercent: 100,
              duration: 0.42,
              ease: 'power3.inOut',
              onComplete: () => {
                gsap.set('.barba-transition-panel', { yPercent: -100 })
              },
            })
          },
        },
      ],
    })
  } catch {
    barbaReady = false
  }
}

export function animateRouteTransition(): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return

  const panel = document.querySelector('.barba-transition-panel')
  if (!panel) return

  gsap.killTweensOf(panel)
  gsap
    .timeline()
    .set(panel, { yPercent: -100 })
    .to(panel, { yPercent: 0, duration: 0.26, ease: 'power3.inOut' })
    .to(panel, { yPercent: 100, duration: 0.42, ease: 'power3.inOut', delay: 0.06 })
    .set(panel, { yPercent: -100 })
}

export function revealElement(element: Element): void {
  element.classList.add('is-visible')

  if (prefersReducedMotion()) return

  gsap.fromTo(
    element,
    { opacity: 0, y: 28 },
    {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: 'power3.out',
      clearProps: 'transform',
    }
  )
}

export function animatePageIn(root: ParentNode = document): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return

  const elements = root.querySelectorAll(
    '.motion-hero-copy > *, .motion-hero-media, .section-title, .section-kicker, [data-motion-card]'
  )

  gsap.fromTo(
    elements,
    { autoAlpha: 0, y: 24 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.055,
      ease: 'power3.out',
      overwrite: 'auto',
    }
  )
}

export function setupMotionEnhancements(root: ParentNode = document): () => void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => {}

  hoverCleanup.forEach((cleanup) => cleanup())
  hoverCleanup = []

  root.querySelectorAll<HTMLElement>(interactiveSelector).forEach((element) => {
    const handleEnter = () => {
      gsap.to(element, {
        y: -5,
        scale: 1.015,
        duration: 0.22,
        ease: 'power2.out',
      })
    }

    const handleMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8

      gsap.to(element, {
        x,
        y: y - 5,
        duration: 0.28,
        ease: 'power2.out',
      })
    }

    const handleLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.32,
        ease: 'power3.out',
      })
    }

    element.addEventListener('mouseenter', handleEnter)
    element.addEventListener('mousemove', handleMove)
    element.addEventListener('mouseleave', handleLeave)

    hoverCleanup.push(() => {
      element.removeEventListener('mouseenter', handleEnter)
      element.removeEventListener('mousemove', handleMove)
      element.removeEventListener('mouseleave', handleLeave)
    })
  })

  return () => {
    hoverCleanup.forEach((cleanup) => cleanup())
    hoverCleanup = []
  }
}
