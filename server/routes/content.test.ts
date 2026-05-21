import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import contentRoutes from './content'
import { dataService } from '../services/dataService'

// Mock the dataService
vi.mock('../services/dataService', () => ({
  dataService: {
    loadData: vi.fn()
  }
}))

describe('Content Routes', () => {
  let app: express.Application

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express()
    app.use(express.json())
    app.use('/api/content', contentRoutes)
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('GET /api/content', () => {
    it('should return portfolio data successfully', async () => {
      // Arrange
      const mockData = {
        hero: {
          greeting: 'Hello',
          name: 'John Doe',
          title: 'Developer',
          description: 'A passionate developer',
          bio: 'Bio text',
          profileImage: '/images/profile.jpg',
          universityLink: 'https://university.edu'
        },
        about: {
          paragraphs: ['Paragraph 1', 'Paragraph 2'],
          skills: ['JavaScript', 'TypeScript'],
          aboutImage: '/images/about.jpg'
        },
        skills: [
          {
            id: '1',
            name: 'JavaScript',
            icon: 'js-icon',
            category: 'Frontend',
            order: 1
          }
        ],
        projects: [
          {
            id: '1',
            title: 'Project 1',
            category: 'Web',
            description: 'A web project',
            features: ['Feature 1'],
            image: '/images/project1.jpg',
            link: 'https://project1.com',
            featured: true,
            order: 1
          }
        ],
        experience: [
          {
            id: '1',
            title: 'Developer',
            company: 'Company A',
            duration: '2020-2023',
            descriptions: ['Worked on projects'],
            order: 1
          }
        ],
        contact: {
          email: 'john@example.com',
          subtitle: 'Get in touch',
          socialLinks: [
            {
              id: '1',
              icon: 'github',
              label: 'GitHub',
              href: 'https://github.com/johndoe'
            }
          ]
        },
        metadata: {
          lastUpdated: '2024-01-01T00:00:00.000Z',
          version: '1.0.0'
        }
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData)

      // Act
      const response = await request(app).get('/api/content')

      // Assert
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockData
      })
      expect(dataService.loadData).toHaveBeenCalledTimes(1)
    })

    it('should return 500 error when data loading fails', async () => {
      // Arrange
      const errorMessage = 'Failed to read file'
      vi.mocked(dataService.loadData).mockRejectedValue(new Error(errorMessage))

      // Act
      const response = await request(app).get('/api/content')

      // Assert
      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        success: false,
        error: errorMessage
      })
      expect(dataService.loadData).toHaveBeenCalledTimes(1)
    })

    it('should handle non-Error exceptions', async () => {
      // Arrange
      vi.mocked(dataService.loadData).mockRejectedValue('Unknown error')

      // Act
      const response = await request(app).get('/api/content')

      // Assert
      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to load portfolio content'
      })
    })

    it('should return complete PortfolioData structure', async () => {
      // Arrange
      const mockData = {
        hero: {
          greeting: 'Hi',
          name: 'Jane Smith',
          title: 'Designer',
          description: 'Creative designer',
          bio: 'Bio',
          profileImage: '/profile.jpg',
          universityLink: 'https://uni.edu'
        },
        about: {
          paragraphs: ['About me'],
          skills: ['Design'],
          aboutImage: '/about.jpg'
        },
        skills: [],
        projects: [],
        experience: [],
        contact: {
          email: 'jane@example.com',
          subtitle: 'Contact me',
          socialLinks: []
        },
        metadata: {
          lastUpdated: '2024-01-02T00:00:00.000Z',
          version: '1.0.0'
        }
      }

      vi.mocked(dataService.loadData).mockResolvedValue(mockData)

      // Act
      const response = await request(app).get('/api/content')

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('hero')
      expect(response.body.data).toHaveProperty('about')
      expect(response.body.data).toHaveProperty('skills')
      expect(response.body.data).toHaveProperty('projects')
      expect(response.body.data).toHaveProperty('experience')
      expect(response.body.data).toHaveProperty('contact')
      expect(response.body.data).toHaveProperty('metadata')
    })
  })
})
