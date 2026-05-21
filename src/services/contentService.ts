import type {
  PortfolioData,
  HeroContent,
  AboutContent,
  Skill,
  Project,
  Experience,
  ContactContent,
  ApiResponse
} from '@/types'
import {
  heroSchema,
  aboutSchema,
  skillSchema,
  projectSchema,
  experienceSchema,
  contactSchema,
  getValidationErrors
} from '@/types/schemas'
import { apiGet, apiPut, apiPost, apiDelete, API_ENDPOINTS } from '@/utils/api'
import type { z } from 'zod'

/**
 * Content Service
 * Handles all portfolio content CRUD operations via /api/content/* endpoints.
 * Performs client-side Zod validation before each mutating request and wraps
 * every call in error handling so callers always receive a typed ApiResponse.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate data against a Zod schema and return an error ApiResponse when
 * validation fails, or null when the data is valid.
 */
function buildValidationError<T>(
  schema: z.ZodTypeAny,
  data: unknown
): ApiResponse<T> | null {
  const result = schema.safeParse(data)
  if (!result.success && result.error) {
    const errors = getValidationErrors(result.error)
    const firstError = Object.values(errors)[0] ?? 'Validation failed'
    return {
      success: false,
      error: firstError,
      message: Object.entries(errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('; ')
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Fetch all portfolio content.
 * GET /api/content
 */
export async function fetchContent(): Promise<ApiResponse<PortfolioData>> {
  try {
    return await apiGet<PortfolioData>(API_ENDPOINTS.CONTENT)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content'
    }
  }
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * Update Hero section content.
 * Validates required fields and URL formats before persisting.
 * PUT /api/content/hero
 */
export async function updateHero(hero: HeroContent): Promise<ApiResponse<HeroContent>> {
  const validationError = buildValidationError<HeroContent>(heroSchema, hero)
  if (validationError) return validationError

  try {
    return await apiPut<HeroContent>(API_ENDPOINTS.CONTENT_HERO, { hero })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update hero section'
    }
  }
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

/**
 * Update About section content.
 * Validates paragraphs, skills array, and image URL before persisting.
 * PUT /api/content/about
 */
export async function updateAbout(about: AboutContent): Promise<ApiResponse<AboutContent>> {
  const validationError = buildValidationError<AboutContent>(aboutSchema, about)
  if (validationError) return validationError

  try {
    return await apiPut<AboutContent>(API_ENDPOINTS.CONTENT_ABOUT, { about })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update about section'
    }
  }
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

/**
 * Create a new skill.
 * Validates name, icon, and category before persisting.
 * POST /api/content/skills
 */
export async function createSkill(
  skill: Omit<Skill, 'id' | 'order'>
): Promise<ApiResponse<Skill>> {
  // Validate the partial skill (id and order are server-generated)
  const partialSchema = skillSchema.omit({ id: true, order: true })
  const validationError = buildValidationError<Skill>(partialSchema, skill)
  if (validationError) return validationError

  try {
    return await apiPost<Skill>(API_ENDPOINTS.CONTENT_SKILLS, { skill })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create skill'
    }
  }
}

/**
 * Update an existing skill.
 * Validates all skill fields before persisting.
 * PUT /api/content/skills/:id
 */
export async function updateSkill(id: string, skill: Skill): Promise<ApiResponse<Skill>> {
  if (!id?.trim()) {
    return { success: false, error: 'Skill ID is required' }
  }

  const validationError = buildValidationError<Skill>(skillSchema, skill)
  if (validationError) return validationError

  try {
    return await apiPut<Skill>(`${API_ENDPOINTS.CONTENT_SKILLS}/${id}`, { skill })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update skill'
    }
  }
}

/**
 * Delete a skill by ID.
 * DELETE /api/content/skills/:id
 */
export async function deleteSkill(id: string): Promise<ApiResponse<{ message: string }>> {
  if (!id?.trim()) {
    return { success: false, error: 'Skill ID is required' }
  }

  try {
    return await apiDelete(`${API_ENDPOINTS.CONTENT_SKILLS}/${id}`)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete skill'
    }
  }
}

/**
 * Reorder skills by providing the full ordered array.
 * PUT /api/content/skills/reorder
 */
export async function reorderSkills(skills: Skill[]): Promise<ApiResponse<Skill[]>> {
  if (!Array.isArray(skills) || skills.length === 0) {
    return { success: false, error: 'Skills array must not be empty' }
  }

  try {
    return await apiPut<Skill[]>(API_ENDPOINTS.SKILLS_REORDER, { skills })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder skills'
    }
  }
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

/**
 * Create a new project.
 * Validates required fields and URLs before persisting.
 * POST /api/content/projects
 */
export async function createProject(
  project: Omit<Project, 'id' | 'order'>
): Promise<ApiResponse<Project>> {
  const partialSchema = projectSchema.omit({ id: true, order: true })
  const validationError = buildValidationError<Project>(partialSchema, project)
  if (validationError) return validationError

  try {
    return await apiPost<Project>(API_ENDPOINTS.CONTENT_PROJECTS, { project })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project'
    }
  }
}

/**
 * Update an existing project.
 * Validates all project fields including URLs before persisting.
 * PUT /api/content/projects/:id
 */
export async function updateProject(
  id: string,
  project: Project
): Promise<ApiResponse<Project>> {
  if (!id?.trim()) {
    return { success: false, error: 'Project ID is required' }
  }

  const validationError = buildValidationError<Project>(projectSchema, project)
  if (validationError) return validationError

  try {
    return await apiPut<Project>(`${API_ENDPOINTS.CONTENT_PROJECTS}/${id}`, { project })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project'
    }
  }
}

/**
 * Delete a project by ID.
 * DELETE /api/content/projects/:id
 */
export async function deleteProject(id: string): Promise<ApiResponse<{ message: string }>> {
  if (!id?.trim()) {
    return { success: false, error: 'Project ID is required' }
  }

  try {
    return await apiDelete(`${API_ENDPOINTS.CONTENT_PROJECTS}/${id}`)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project'
    }
  }
}

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------

/**
 * Create a new experience entry.
 * Validates required fields before persisting.
 * POST /api/content/experience
 */
export async function createExperience(
  experience: Omit<Experience, 'id' | 'order'>
): Promise<ApiResponse<Experience>> {
  const partialSchema = experienceSchema.omit({ id: true, order: true })
  const validationError = buildValidationError<Experience>(partialSchema, experience)
  if (validationError) return validationError

  try {
    return await apiPost<Experience>(API_ENDPOINTS.CONTENT_EXPERIENCE, { experience })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create experience entry'
    }
  }
}

/**
 * Update an existing experience entry.
 * Validates all fields before persisting.
 * PUT /api/content/experience/:id
 */
export async function updateExperience(
  id: string,
  experience: Experience
): Promise<ApiResponse<Experience>> {
  if (!id?.trim()) {
    return { success: false, error: 'Experience ID is required' }
  }

  const validationError = buildValidationError<Experience>(experienceSchema, experience)
  if (validationError) return validationError

  try {
    return await apiPut<Experience>(`${API_ENDPOINTS.CONTENT_EXPERIENCE}/${id}`, { experience })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update experience entry'
    }
  }
}

/**
 * Delete an experience entry by ID.
 * DELETE /api/content/experience/:id
 */
export async function deleteExperience(id: string): Promise<ApiResponse<{ message: string }>> {
  if (!id?.trim()) {
    return { success: false, error: 'Experience ID is required' }
  }

  try {
    return await apiDelete(`${API_ENDPOINTS.CONTENT_EXPERIENCE}/${id}`)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete experience entry'
    }
  }
}

/**
 * Reorder experience entries by providing the full ordered array.
 * PUT /api/content/experience/reorder
 */
export async function reorderExperience(
  experience: Experience[]
): Promise<ApiResponse<Experience[]>> {
  if (!Array.isArray(experience) || experience.length === 0) {
    return { success: false, error: 'Experience array must not be empty' }
  }

  try {
    return await apiPut<Experience[]>(API_ENDPOINTS.EXPERIENCE_REORDER, { experience })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder experience entries'
    }
  }
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

/**
 * Update Contact section content.
 * Validates email format and social link URLs before persisting.
 * PUT /api/content/contact
 */
export async function updateContact(
  contact: ContactContent
): Promise<ApiResponse<ContactContent>> {
  const validationError = buildValidationError<ContactContent>(contactSchema, contact)
  if (validationError) return validationError

  try {
    return await apiPut<ContactContent>(API_ENDPOINTS.CONTENT_CONTACT, { contact })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact section'
    }
  }
}

// ---------------------------------------------------------------------------
// Named export object (for consumers that prefer object-style imports)
// ---------------------------------------------------------------------------

export const contentService = {
  fetchContent,
  updateHero,
  updateAbout,
  createSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
  createProject,
  updateProject,
  deleteProject,
  createExperience,
  updateExperience,
  deleteExperience,
  reorderExperience,
  updateContact
}
