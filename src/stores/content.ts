import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  HeroContent,
  AboutContent,
  Skill,
  Project,
  Certificate,
  Experience,
  ContactContent,
  PortfolioData
} from '@/types'
import { contentService } from '@/services/contentService'

/**
 * Content Store
 * Manages all portfolio content state and CRUD operations.
 * Uses optimistic updates: UI is updated immediately and rolled back on error.
 */
export const useContentStore = defineStore('content', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  const hero = ref<HeroContent | null>(null)
  const about = ref<AboutContent | null>(null)
  const skills = ref<Skill[]>([])
  const projects = ref<Project[]>([])
  const certificates = ref<Certificate[]>([])
  const experience = ref<Experience[]>([])
  const contact = ref<ContactContent | null>(null)
  const lastUpdated = ref<string | null>(null)

  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // ─── Computed Getters ─────────────────────────────────────────────────────

  const heroContent = computed<HeroContent | null>(() => hero.value)
  const aboutContent = computed<AboutContent | null>(() => about.value)
  const skillsList = computed<Skill[]>(() => [...skills.value].sort((a, b) => a.order - b.order))
  const projectsList = computed<Project[]>(() => [...projects.value].sort((a, b) => a.order - b.order))
  const featuredProjects = computed<Project[]>(() => projectsList.value.filter(p => p.featured))
  const certificatesList = computed<Certificate[]>(() => [...certificates.value].sort((a, b) => a.order - b.order))
  const experienceList = computed<Experience[]>(() => [...experience.value].sort((a, b) => a.order - b.order))
  const contactContent = computed<ContactContent | null>(() => contact.value)

  const isContentLoaded = computed<boolean>(() => hero.value !== null)

  // ─── Load ─────────────────────────────────────────────────────────────────

  /**
   * Load all portfolio content from the API.
   */
  async function loadContent(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.fetchContent()

      if (response.success && response.data) {
        _applyPortfolioData(response.data)
      } else {
        error.value = response.error || 'Failed to load content'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
    } finally {
      isLoading.value = false
    }
  }

  // ─── Hero ─────────────────────────────────────────────────────────────────

  /**
   * Update Hero section content.
   */
  async function updateHero(data: HeroContent): Promise<boolean> {
    const previous = hero.value ? { ...hero.value } : null
    hero.value = { ...data } // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.updateHero(data)

      if (response.success && response.data) {
        hero.value = response.data
        return true
      } else {
        hero.value = previous // rollback
        error.value = response.error || 'Failed to update hero section'
        return false
      }
    } catch (err) {
      hero.value = previous // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ─── About ────────────────────────────────────────────────────────────────

  /**
   * Update About section content.
   */
  async function updateAbout(data: AboutContent): Promise<boolean> {
    const previous = about.value ? { ...about.value } : null
    about.value = { ...data } // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.updateAbout(data)

      if (response.success && response.data) {
        about.value = response.data
        return true
      } else {
        about.value = previous // rollback
        error.value = response.error || 'Failed to update about section'
        return false
      }
    } catch (err) {
      about.value = previous // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ─── Skills ───────────────────────────────────────────────────────────────

  /**
   * Create a new skill.
   */
  async function createSkill(data: Omit<Skill, 'id' | 'order'>): Promise<Skill | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.createSkill(data)

      if (response.success && response.data) {
        skills.value.push(response.data)
        return response.data
      } else {
        error.value = response.error || 'Failed to create skill'
        return null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing skill.
   */
  async function updateSkill(id: string, data: Skill): Promise<boolean> {
    const index = skills.value.findIndex(s => s.id === id)
    if (index === -1) {
      error.value = `Skill with id "${id}" not found`
      return false
    }

    const previous: Skill = { ...skills.value[index] } as Skill
    skills.value[index] = { ...data } as Skill // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.updateSkill(id, data)

      if (response.success && response.data) {
        skills.value[index] = response.data
        return true
      } else {
        skills.value[index] = previous // rollback
        error.value = response.error || 'Failed to update skill'
        return false
      }
    } catch (err) {
      skills.value[index] = previous // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a skill by id.
   */
  async function deleteSkill(id: string): Promise<boolean> {
    const index = skills.value.findIndex(s => s.id === id)
    if (index === -1) {
      error.value = `Skill with id "${id}" not found`
      return false
    }

    const removed: Skill = skills.value[index]!
    skills.value.splice(index, 1) // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.deleteSkill(id)

      if (response.success) {
        return true
      } else {
        skills.value.splice(index, 0, removed) // rollback
        error.value = response.error || 'Failed to delete skill'
        return false
      }
    } catch (err) {
      skills.value.splice(index, 0, removed) // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reorder skills. Accepts the full reordered array.
   */
  async function reorderSkills(reordered: Skill[]): Promise<boolean> {
    const previous = [...skills.value]
    skills.value = [...reordered] // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.reorderSkills(reordered)

      if (response.success && response.data) {
        skills.value = response.data
        return true
      } else {
        skills.value = previous // rollback
        error.value = response.error || 'Failed to reorder skills'
        return false
      }
    } catch (err) {
      skills.value = previous // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ─── Projects ─────────────────────────────────────────────────────────────

  /**
   * Create a new project.
   */
  async function createProject(data: Omit<Project, 'id' | 'order'>): Promise<Project | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.createProject(data)

      if (response.success && response.data) {
        projects.value.push(response.data)
        return response.data
      } else {
        error.value = response.error || 'Failed to create project'
        return null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing project.
   */
  async function updateProject(id: string, data: Project): Promise<boolean> {
    const index = projects.value.findIndex(p => p.id === id)
    if (index === -1) {
      error.value = `Project with id "${id}" not found`
      return false
    }

    const previous: Project = { ...projects.value[index] } as Project
    projects.value[index] = { ...data } as Project // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.updateProject(id, data)

      if (response.success && response.data) {
        projects.value[index] = response.data
        return true
      } else {
        projects.value[index] = previous // rollback
        error.value = response.error || 'Failed to update project'
        return false
      }
    } catch (err) {
      projects.value[index] = previous // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a project by id.
   */
  async function deleteProject(id: string): Promise<boolean> {
    const index = projects.value.findIndex(p => p.id === id)
    if (index === -1) {
      error.value = `Project with id "${id}" not found`
      return false
    }

    const removed: Project = projects.value[index]!
    projects.value.splice(index, 1) // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.deleteProject(id)

      if (response.success) {
        return true
      } else {
        projects.value.splice(index, 0, removed) // rollback
        error.value = response.error || 'Failed to delete project'
        return false
      }
    } catch (err) {
      projects.value.splice(index, 0, removed) // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ─── Experience ───────────────────────────────────────────────────────────

  // Certificates

  async function createCertificate(data: Omit<Certificate, 'id' | 'order'>): Promise<Certificate | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.createCertificate(data)

      if (response.success && response.data) {
        certificates.value.push(response.data)
        return response.data
      }
      error.value = response.error || 'Failed to create certificate'
      return null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateCertificate(id: string, data: Certificate): Promise<boolean> {
    const index = certificates.value.findIndex(c => c.id === id)
    if (index === -1) {
      error.value = `Certificate with id "${id}" not found`
      return false
    }

    const previous: Certificate = { ...certificates.value[index] } as Certificate
    certificates.value[index] = { ...data } as Certificate

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.updateCertificate(id, data)

      if (response.success && response.data) {
        certificates.value[index] = response.data
        return true
      }
      certificates.value[index] = previous
      error.value = response.error || 'Failed to update certificate'
      return false
    } catch (err) {
      certificates.value[index] = previous
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function deleteCertificate(id: string): Promise<boolean> {
    const index = certificates.value.findIndex(c => c.id === id)
    if (index === -1) {
      error.value = `Certificate with id "${id}" not found`
      return false
    }

    const removed: Certificate = certificates.value[index]!
    certificates.value.splice(index, 1)

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.deleteCertificate(id)

      if (response.success) {
        return true
      }
      certificates.value.splice(index, 0, removed)
      error.value = response.error || 'Failed to delete certificate'
      return false
    } catch (err) {
      certificates.value.splice(index, 0, removed)
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new experience entry.
   */
  async function createExperience(data: Omit<Experience, 'id' | 'order'>): Promise<Experience | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.createExperience(data)

      if (response.success && response.data) {
        experience.value.push(response.data)
        return response.data
      } else {
        error.value = response.error || 'Failed to create experience entry'
        return null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing experience entry.
   */
  async function updateExperience(id: string, data: Experience): Promise<boolean> {
    const index = experience.value.findIndex(e => e.id === id)
    if (index === -1) {
      error.value = `Experience entry with id "${id}" not found`
      return false
    }

    const previous: Experience = { ...experience.value[index] } as Experience
    experience.value[index] = { ...data } as Experience // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.updateExperience(id, data)

      if (response.success && response.data) {
        experience.value[index] = response.data
        return true
      } else {
        experience.value[index] = previous // rollback
        error.value = response.error || 'Failed to update experience entry'
        return false
      }
    } catch (err) {
      experience.value[index] = previous // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete an experience entry by id.
   */
  async function deleteExperience(id: string): Promise<boolean> {
    const index = experience.value.findIndex(e => e.id === id)
    if (index === -1) {
      error.value = `Experience entry with id "${id}" not found`
      return false
    }

    const removed: Experience = experience.value[index]!
    experience.value.splice(index, 1) // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.deleteExperience(id)

      if (response.success) {
        return true
      } else {
        experience.value.splice(index, 0, removed) // rollback
        error.value = response.error || 'Failed to delete experience entry'
        return false
      }
    } catch (err) {
      experience.value.splice(index, 0, removed) // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reorder experience entries. Accepts the full reordered array.
   */
  async function reorderExperience(reordered: Experience[]): Promise<boolean> {
    const previous = [...experience.value]
    experience.value = [...reordered] // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.reorderExperience(reordered)

      if (response.success && response.data) {
        experience.value = response.data
        return true
      } else {
        experience.value = previous // rollback
        error.value = response.error || 'Failed to reorder experience entries'
        return false
      }
    } catch (err) {
      experience.value = previous // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ─── Contact ──────────────────────────────────────────────────────────────

  /**
   * Update Contact section content.
   */
  async function updateContact(data: ContactContent): Promise<boolean> {
    const previous = contact.value ? { ...contact.value } : null
    contact.value = { ...data } // optimistic update

    isLoading.value = true
    error.value = null

    try {
      const response = await contentService.updateContact(data)

      if (response.success && response.data) {
        contact.value = response.data
        return true
      } else {
        contact.value = previous // rollback
        error.value = response.error || 'Failed to update contact section'
        return false
      }
    } catch (err) {
      contact.value = previous // rollback
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  /**
   * Clear the current error message.
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Reset the store to its initial empty state.
   */
  function $reset(): void {
    hero.value = null
    about.value = null
    skills.value = []
    projects.value = []
    certificates.value = []
    experience.value = []
    contact.value = null
    lastUpdated.value = null
    isLoading.value = false
    error.value = null
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  function _applyPortfolioData(data: PortfolioData): void {
    hero.value = data.hero
    about.value = data.about
    skills.value = data.skills
    projects.value = data.projects
    certificates.value = data.certificates ?? []
    experience.value = data.experience
    contact.value = data.contact
    lastUpdated.value = data.metadata?.lastUpdated ?? null
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  return {
    // State
    hero,
    about,
    skills,
    projects,
    certificates,
    experience,
    contact,
    lastUpdated,
    isLoading,
    error,

    // Computed getters
    heroContent,
    aboutContent,
    skillsList,
    projectsList,
    featuredProjects,
    certificatesList,
    experienceList,
    contactContent,
    isContentLoaded,

    // Actions – load
    loadContent,

    // Actions – hero / about / contact
    updateHero,
    updateAbout,
    updateContact,

    // Actions – skills
    createSkill,
    updateSkill,
    deleteSkill,
    reorderSkills,

    // Actions – projects
    createProject,
    updateProject,
    deleteProject,
    createCertificate,
    updateCertificate,
    deleteCertificate,

    // Actions – experience
    createExperience,
    updateExperience,
    deleteExperience,
    reorderExperience,

    // Utilities
    clearError,
    $reset
  }
})
