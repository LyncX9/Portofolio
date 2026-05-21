import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import contentRoutes from './content'
import { dataService } from '../services/dataService'
import { validateSession } from '../auth/sessions'

// Mock dependencies
vi.mock('../services/dataService', () => ({
  dataService: {
    loadData: vi.fn(),
    updateSection: vi.fn()
  }
}))

vi.mock('../auth/sessions', () => ({
  validateSession: vi.fn()
}))

vi.mock('../middleware/csrf', () => ({
  validateCsrfToken: vi.fn((req, res, next) => next())
}))

describe('Content CRUD Routes', () => {
  let app: express.Application
  const validToken = 'valid-session-token'
  const mockSession = { username: 'testadmin', expiresAt: Date.now() + 86400000 }

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/api/content', contentRoutes)
    
    // Clear all mocks
    vi.clearAllMocks()
    
    // Default mock for valid session
    vi.mocked(validateSession).mockReturnValue(mockSession)
  })

  describe('PUT /api/content/hero', () => {
    it('should update hero section with valid data', async () => {
      const heroData = {
        greeting: 'Hello',
        name: 'John Doe',
        title: 'Developer',
        description: 'A passionate developer',
        bio: 'Bio text',
        profileImage: 'https://example.com/profile.jpg',
        universityLink: 'https://university.edu'
      }

      vi.mocked(dataService.updateSection).mockResolvedValue()

      const response = await request(app)
        .put('/api/content/hero')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(heroData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(heroData)
      expect(dataService.updateSection).toHaveBeenCalledWith('hero', heroData)
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/content/hero')
        .send({})

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    it('should return 400 with invalid data', async () => {
      const invalidData = {
        greeting: '',
        name: 'John'
      }

      const response = await request(app)
        .put('/api/content/hero')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
    })
  })

  describe('PUT /api/content/about', () => {
    it('should update about section with valid data', async () => {
      const aboutData = {
        paragraphs: ['Paragraph 1', 'Paragraph 2'],
        skills: ['JavaScript', 'TypeScript'],
        aboutImage: 'https://example.com/about.jpg'
      }

      vi.mocked(dataService.updateSection).mockResolvedValue()

      const response = await request(app)
        .put('/api/content/about')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(aboutData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(aboutData)
      expect(dataService.updateSection).toHaveBeenCalledWith('about', aboutData)
    })

    it('should return 400 with empty paragraphs', async () => {
      const invalidData = {
        paragraphs: [],
        skills: ['JavaScript'],
        aboutImage: 'https://example.com/about.jpg'
      }

      const response = await request(app)
        .put('/api/content/about')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/content/skills', () => {
    it('should create a new skill', async () => {
      const mockData = {
        skills: [
          { id: '1', name: 'JavaScript', icon: 'js', category: 'Frontend', order: 0 }
        ],
        hero: {},
        about: {},
        projects: [],
        experience: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)
      vi.mocked(dataService.updateSection).mockResolvedValue()

      const newSkill = {
        name: 'TypeScript',
        icon: 'ts',
        category: 'Frontend'
      }

      const response = await request(app)
        .post('/api/content/skills')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(newSkill)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject(newSkill)
      expect(response.body.data.id).toBeDefined()
      expect(response.body.data.order).toBe(1)
    })

    it('should return 400 with missing required fields', async () => {
      const invalidSkill = {
        name: 'TypeScript'
      }

      const response = await request(app)
        .post('/api/content/skills')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(invalidSkill)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/content/skills/:id', () => {
    it('should update an existing skill', async () => {
      const mockData = {
        skills: [
          { id: 'skill-1', name: 'JavaScript', icon: 'js', category: 'Frontend', order: 0 }
        ],
        hero: {},
        about: {},
        projects: [],
        experience: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)
      vi.mocked(dataService.updateSection).mockResolvedValue()

      const updatedSkill = {
        name: 'JavaScript ES6',
        icon: 'js-new',
        category: 'Frontend'
      }

      const response = await request(app)
        .put('/api/content/skills/skill-1')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(updatedSkill)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('JavaScript ES6')
    })

    it('should return 404 for non-existent skill', async () => {
      const mockData = {
        skills: [],
        hero: {},
        about: {},
        projects: [],
        experience: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)

      const response = await request(app)
        .put('/api/content/skills/non-existent')
        .set('Cookie', [`admin_session=${validToken}`])
        .send({ name: 'Test', icon: 'test', category: 'Test' })

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/content/skills/:id', () => {
    it('should delete a skill', async () => {
      const mockData = {
        skills: [
          { id: 'skill-1', name: 'JavaScript', icon: 'js', category: 'Frontend', order: 0 }
        ],
        hero: {},
        about: {},
        projects: [],
        experience: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)
      vi.mocked(dataService.updateSection).mockResolvedValue()

      const response = await request(app)
        .delete('/api/content/skills/skill-1')
        .set('Cookie', [`admin_session=${validToken}`])

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Skill deleted successfully')
    })

    it('should return 404 for non-existent skill', async () => {
      const mockData = {
        skills: [],
        hero: {},
        about: {},
        projects: [],
        experience: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)

      const response = await request(app)
        .delete('/api/content/skills/non-existent')
        .set('Cookie', [`admin_session=${validToken}`])

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/content/skills/reorder', () => {
    it('should reorder skills', async () => {
      const reorderedSkills = [
        { id: 'skill-2', name: 'TypeScript', icon: 'ts', category: 'Frontend', order: 0 },
        { id: 'skill-1', name: 'JavaScript', icon: 'js', category: 'Frontend', order: 1 }
      ]

      vi.mocked(dataService.updateSection).mockResolvedValue()

      const response = await request(app)
        .put('/api/content/skills/reorder')
        .set('Cookie', [`admin_session=${validToken}`])
        .send({ skills: reorderedSkills })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(dataService.updateSection).toHaveBeenCalledWith('skills', reorderedSkills)
    })

    it('should return 400 if skills is not an array', async () => {
      const response = await request(app)
        .put('/api/content/skills/reorder')
        .set('Cookie', [`admin_session=${validToken}`])
        .send({ skills: 'not-an-array' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/content/projects', () => {
    it('should create a new project', async () => {
      const mockData = {
        projects: [],
        skills: [],
        hero: {},
        about: {},
        experience: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)
      vi.mocked(dataService.updateSection).mockResolvedValue()

      const newProject = {
        title: 'New Project',
        category: 'Web',
        description: 'A new web project with many features',
        features: ['Feature 1', 'Feature 2'],
        image: 'https://example.com/project.jpg',
        link: 'https://project.com',
        githubLink: 'https://github.com/user/project',
        featured: true
      }

      const response = await request(app)
        .post('/api/content/projects')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(newProject)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject(newProject)
      expect(response.body.data.id).toBeDefined()
      expect(response.body.data.order).toBe(0)
    })
  })

  describe('PUT /api/content/projects/:id', () => {
    it('should update an existing project', async () => {
      const mockData = {
        projects: [
          {
            id: 'project-1',
            title: 'Old Title',
            category: 'Web',
            description: 'Old description with enough text',
            features: ['Feature 1'],
            image: 'https://example.com/old.jpg',
            link: 'https://old.com',
            featured: false,
            order: 0
          }
        ],
        skills: [],
        hero: {},
        about: {},
        experience: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)
      vi.mocked(dataService.updateSection).mockResolvedValue()

      const updatedProject = {
        title: 'New Title',
        category: 'Mobile',
        description: 'New description with enough text',
        features: ['Feature 1', 'Feature 2'],
        image: 'https://example.com/new.jpg',
        link: 'https://new.com',
        githubLink: '',
        featured: true
      }

      const response = await request(app)
        .put('/api/content/projects/project-1')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(updatedProject)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe('New Title')
    })
  })

  describe('DELETE /api/content/projects/:id', () => {
    it('should delete a project', async () => {
      const mockData = {
        projects: [
          {
            id: 'project-1',
            title: 'Project',
            category: 'Web',
            description: 'Description text',
            features: ['Feature'],
            image: 'https://example.com/img.jpg',
            link: 'https://link.com',
            featured: false,
            order: 0
          }
        ],
        skills: [],
        hero: {},
        about: {},
        experience: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)
      vi.mocked(dataService.updateSection).mockResolvedValue()

      const response = await request(app)
        .delete('/api/content/projects/project-1')
        .set('Cookie', [`admin_session=${validToken}`])

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('POST /api/content/experience', () => {
    it('should create a new experience entry', async () => {
      const mockData = {
        experience: [],
        skills: [],
        hero: {},
        about: {},
        projects: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)
      vi.mocked(dataService.updateSection).mockResolvedValue()

      const newExperience = {
        title: 'Senior Developer',
        company: 'Tech Corp',
        duration: '2020-2023',
        descriptions: ['Led development team', 'Implemented new features']
      }

      const response = await request(app)
        .post('/api/content/experience')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(newExperience)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject(newExperience)
      expect(response.body.data.id).toBeDefined()
    })
  })

  describe('PUT /api/content/experience/:id', () => {
    it('should update an existing experience entry', async () => {
      const mockData = {
        experience: [
          {
            id: 'exp-1',
            title: 'Developer',
            company: 'Old Corp',
            duration: '2018-2020',
            descriptions: ['Worked on projects'],
            order: 0
          }
        ],
        skills: [],
        hero: {},
        about: {},
        projects: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)
      vi.mocked(dataService.updateSection).mockResolvedValue()

      const updatedExperience = {
        title: 'Senior Developer',
        company: 'New Corp',
        duration: '2018-2023',
        descriptions: ['Led projects', 'Mentored juniors']
      }

      const response = await request(app)
        .put('/api/content/experience/exp-1')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(updatedExperience)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe('Senior Developer')
    })
  })

  describe('DELETE /api/content/experience/:id', () => {
    it('should delete an experience entry', async () => {
      const mockData = {
        experience: [
          {
            id: 'exp-1',
            title: 'Developer',
            company: 'Corp',
            duration: '2020-2023',
            descriptions: ['Work'],
            order: 0
          }
        ],
        skills: [],
        hero: {},
        about: {},
        projects: [],
        contact: {},
        metadata: {}
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData as any)
      vi.mocked(dataService.updateSection).mockResolvedValue()

      const response = await request(app)
        .delete('/api/content/experience/exp-1')
        .set('Cookie', [`admin_session=${validToken}`])

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('PUT /api/content/experience/reorder', () => {
    it('should reorder experience entries', async () => {
      const reorderedExperience = [
        {
          id: 'exp-2',
          title: 'Senior Dev',
          company: 'Corp B',
          duration: '2020-2023',
          descriptions: ['Work'],
          order: 0
        },
        {
          id: 'exp-1',
          title: 'Junior Dev',
          company: 'Corp A',
          duration: '2018-2020',
          descriptions: ['Work'],
          order: 1
        }
      ]

      vi.mocked(dataService.updateSection).mockResolvedValue()

      const response = await request(app)
        .put('/api/content/experience/reorder')
        .set('Cookie', [`admin_session=${validToken}`])
        .send({ experience: reorderedExperience })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('PUT /api/content/contact', () => {
    it('should update contact section with valid data', async () => {
      const contactData = {
        email: 'john@example.com',
        subtitle: 'Get in touch',
        socialLinks: [
          {
            id: 'social-1',
            icon: 'github',
            label: 'GitHub',
            href: 'https://github.com/johndoe'
          }
        ]
      }

      vi.mocked(dataService.updateSection).mockResolvedValue()

      const response = await request(app)
        .put('/api/content/contact')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(contactData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(contactData)
      expect(dataService.updateSection).toHaveBeenCalledWith('contact', contactData)
    })

    it('should return 400 with invalid email', async () => {
      const invalidData = {
        email: 'not-an-email',
        subtitle: 'Get in touch',
        socialLinks: []
      }

      const response = await request(app)
        .put('/api/content/contact')
        .set('Cookie', [`admin_session=${validToken}`])
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })
})
