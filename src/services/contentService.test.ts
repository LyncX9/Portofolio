/**
 * Unit tests for contentService
 *
 * Tests cover:
 * - fetchContent: successful retrieval and network errors
 * - updateHero / updateAbout / updateContact: validation + happy path + errors
 * - createSkill / updateSkill / deleteSkill / reorderSkills: validation + happy path + errors
 * - createProject / updateProject / deleteProject: validation + happy path + errors
 * - createExperience / updateExperience / deleteExperience / reorderExperience: validation + happy path + errors
 *
 * Requirements: 2.3, 3.5, 4.3, 5.3, 6.4, 7.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
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
} from './contentService'
import type {
  HeroContent,
  AboutContent,
  Skill,
  Project,
  Experience,
  ContactContent,
  PortfolioData
} from '@/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validHero: HeroContent = {
  greeting: 'Hello',
  name: 'Jane Doe',
  title: 'Full-Stack Developer',
  description: 'I build things for the web.',
  bio: 'A short bio.',
  profileImage: 'https://example.com/profile.jpg',
  universityLink: 'https://university.edu'
}

const validAbout: AboutContent = {
  paragraphs: ['First paragraph.', 'Second paragraph.'],
  skills: ['TypeScript', 'Vue'],
  aboutImage: 'https://example.com/about.jpg'
}

const validSkill: Skill = {
  id: 'skill-1',
  name: 'TypeScript',
  icon: 'ts-icon',
  category: 'Frontend',
  order: 1
}

const validProject: Project = {
  id: 'proj-1',
  title: 'My Project',
  category: 'Web',
  description: 'A detailed description of the project.',
  features: ['Feature A', 'Feature B'],
  image: 'https://example.com/project.jpg',
  link: 'https://example.com',
  githubLink: 'https://github.com/user/repo',
  featured: true,
  order: 1
}

const validExperience: Experience = {
  id: 'exp-1',
  title: 'Software Engineer',
  company: 'Acme Corp',
  duration: '2021 – Present',
  descriptions: ['Built features', 'Reviewed PRs'],
  order: 1
}

const validContact: ContactContent = {
  email: 'jane@example.com',
  subtitle: 'Get in touch',
  socialLinks: [
    { id: 'sl-1', icon: 'github', label: 'GitHub', href: 'https://github.com/jane' }
  ]
}

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

function mockFetchSuccess<T>(data: T) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data })
  } as unknown as Response)
}

function mockFetchHttpError(status: number, errorMsg: string) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    json: async () => ({ error: errorMsg })
  } as unknown as Response)
}

function mockFetchNetworkError(message: string) {
  global.fetch = vi.fn().mockRejectedValue(new Error(message))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('contentService', () => {
  beforeEach(() => {
    // Reset fetch mock before each test so validation tests start with no mock
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // fetchContent
  // -------------------------------------------------------------------------

  describe('fetchContent', () => {
    it('returns portfolio data on success', async () => {
      const mockData = { hero: validHero } as unknown as PortfolioData
      mockFetchSuccess(mockData)

      const result = await fetchContent()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
    })

    it('returns error response on HTTP failure', async () => {
      mockFetchHttpError(500, 'Internal server error')

      const result = await fetchContent()

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('returns error response on network failure', async () => {
      mockFetchNetworkError('Failed to fetch')

      const result = await fetchContent()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to fetch')
    })
  })

  // -------------------------------------------------------------------------
  // updateHero
  // -------------------------------------------------------------------------

  describe('updateHero', () => {
    it('sends PUT request and returns updated hero on success', async () => {
      mockFetchSuccess(validHero)

      const result = await updateHero(validHero)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/hero'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('rejects when required field is empty', async () => {
      const invalid = { ...validHero, name: '' }

      const result = await updateHero(invalid)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rejects when profileImage is not a valid URL', async () => {
      const invalid = { ...validHero, profileImage: 'not-a-url' }

      const result = await updateHero(invalid)

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns error response on HTTP failure', async () => {
      mockFetchHttpError(422, 'Unprocessable entity')

      const result = await updateHero(validHero)

      expect(result.success).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // updateAbout
  // -------------------------------------------------------------------------

  describe('updateAbout', () => {
    it('sends PUT request and returns updated about on success', async () => {
      mockFetchSuccess(validAbout)

      const result = await updateAbout(validAbout)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/about'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('rejects when paragraphs array is empty', async () => {
      const invalid = { ...validAbout, paragraphs: [] }

      const result = await updateAbout(invalid)

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rejects when aboutImage is not a valid URL', async () => {
      const invalid = { ...validAbout, aboutImage: 'bad-url' }

      const result = await updateAbout(invalid)

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Skills CRUD
  // -------------------------------------------------------------------------

  describe('createSkill', () => {
    it('sends POST request and returns created skill on success', async () => {
      mockFetchSuccess(validSkill)
      const { id: _id, order: _order, ...newSkill } = validSkill

      const result = await createSkill(newSkill)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/skills'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('rejects when name is empty', async () => {
      const result = await createSkill({ name: '', icon: 'icon', category: 'Frontend' })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rejects when icon is empty', async () => {
      const result = await createSkill({ name: 'TypeScript', icon: '', category: 'Frontend' })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('updateSkill', () => {
    it('sends PUT request and returns updated skill on success', async () => {
      mockFetchSuccess(validSkill)

      const result = await updateSkill('skill-1', validSkill)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/skills/skill-1'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('rejects when id is empty', async () => {
      const result = await updateSkill('', validSkill)

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rejects when skill data is invalid', async () => {
      const result = await updateSkill('skill-1', { ...validSkill, name: '' })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('deleteSkill', () => {
    it('sends DELETE request on success', async () => {
      mockFetchSuccess({ message: 'Deleted' })

      const result = await deleteSkill('skill-1')

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/skills/skill-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('rejects when id is empty', async () => {
      const result = await deleteSkill('')

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('reorderSkills', () => {
    it('sends PUT request with skills array on success', async () => {
      mockFetchSuccess([validSkill])

      const result = await reorderSkills([validSkill])

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/skills/reorder'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('rejects when skills array is empty', async () => {
      const result = await reorderSkills([])

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Projects CRUD
  // -------------------------------------------------------------------------

  describe('createProject', () => {
    it('sends POST request and returns created project on success', async () => {
      mockFetchSuccess(validProject)
      const { id: _id, order: _order, ...newProject } = validProject

      const result = await createProject(newProject)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/projects'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('rejects when title is empty', async () => {
      const { id: _id, order: _order, ...newProject } = validProject
      const result = await createProject({ ...newProject, title: '' })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rejects when link is not a valid URL', async () => {
      const { id: _id, order: _order, ...newProject } = validProject
      const result = await createProject({ ...newProject, link: 'not-a-url' })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rejects when description is too short', async () => {
      const { id: _id, order: _order, ...newProject } = validProject
      const result = await createProject({ ...newProject, description: 'Short' })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('updateProject', () => {
    it('sends PUT request and returns updated project on success', async () => {
      mockFetchSuccess(validProject)

      const result = await updateProject('proj-1', validProject)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/projects/proj-1'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('rejects when id is empty', async () => {
      const result = await updateProject('', validProject)

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('deleteProject', () => {
    it('sends DELETE request on success', async () => {
      mockFetchSuccess({ message: 'Deleted' })

      const result = await deleteProject('proj-1')

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/projects/proj-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('rejects when id is empty', async () => {
      const result = await deleteProject('')

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Experience CRUD
  // -------------------------------------------------------------------------

  describe('createExperience', () => {
    it('sends POST request and returns created experience on success', async () => {
      mockFetchSuccess(validExperience)
      const { id: _id, order: _order, ...newExp } = validExperience

      const result = await createExperience(newExp)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/experience'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('rejects when title is empty', async () => {
      const { id: _id, order: _order, ...newExp } = validExperience
      const result = await createExperience({ ...newExp, title: '' })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rejects when company is empty', async () => {
      const { id: _id, order: _order, ...newExp } = validExperience
      const result = await createExperience({ ...newExp, company: '' })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('updateExperience', () => {
    it('sends PUT request and returns updated experience on success', async () => {
      mockFetchSuccess(validExperience)

      const result = await updateExperience('exp-1', validExperience)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/experience/exp-1'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('rejects when id is empty', async () => {
      const result = await updateExperience('', validExperience)

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('deleteExperience', () => {
    it('sends DELETE request on success', async () => {
      mockFetchSuccess({ message: 'Deleted' })

      const result = await deleteExperience('exp-1')

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/experience/exp-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('rejects when id is empty', async () => {
      const result = await deleteExperience('')

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('reorderExperience', () => {
    it('sends PUT request with experience array on success', async () => {
      mockFetchSuccess([validExperience])

      const result = await reorderExperience([validExperience])

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/experience/reorder'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('rejects when experience array is empty', async () => {
      const result = await reorderExperience([])

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // updateContact
  // -------------------------------------------------------------------------

  describe('updateContact', () => {
    it('sends PUT request and returns updated contact on success', async () => {
      mockFetchSuccess(validContact)

      const result = await updateContact(validContact)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/contact'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('rejects when email is invalid', async () => {
      const result = await updateContact({ ...validContact, email: 'not-an-email' })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rejects when social link href is not a valid URL', async () => {
      const result = await updateContact({
        ...validContact,
        socialLinks: [{ id: 'sl-1', icon: 'github', label: 'GitHub', href: 'bad-url' }]
      })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rejects when social links array is empty', async () => {
      const result = await updateContact({ ...validContact, socialLinks: [] })

      expect(result.success).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns error response on HTTP failure', async () => {
      mockFetchHttpError(500, 'Server error')

      const result = await updateContact(validContact)

      expect(result.success).toBe(false)
    })
  })
})
