import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import contentRoutes from './content'
import { dataService } from '../services/dataService'

describe('Content Routes Integration', () => {
  let app: express.Application

  beforeAll(() => {
    // Create Express app with actual dataService (no mocks)
    app = express()
    app.use(express.json())
    app.use('/api/content', contentRoutes)
  })

  describe('GET /api/content', () => {
    it('should retrieve actual portfolio data from file', async () => {
      // Act
      const response = await request(app).get('/api/content')

      // Assert
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      
      // Verify complete structure
      expect(response.body.data).toHaveProperty('hero')
      expect(response.body.data).toHaveProperty('about')
      expect(response.body.data).toHaveProperty('skills')
      expect(response.body.data).toHaveProperty('projects')
      expect(response.body.data).toHaveProperty('experience')
      expect(response.body.data).toHaveProperty('contact')
      expect(response.body.data).toHaveProperty('metadata')
      
      // Verify hero section has required fields
      expect(response.body.data.hero).toHaveProperty('greeting')
      expect(response.body.data.hero).toHaveProperty('name')
      expect(response.body.data.hero).toHaveProperty('title')
      expect(response.body.data.hero).toHaveProperty('description')
      expect(response.body.data.hero).toHaveProperty('bio')
      expect(response.body.data.hero).toHaveProperty('profileImage')
      expect(response.body.data.hero).toHaveProperty('universityLink')
      
      // Verify metadata
      expect(response.body.data.metadata).toHaveProperty('lastUpdated')
      expect(response.body.data.metadata).toHaveProperty('version')
    })

    it('should return data that matches dataService.loadData()', async () => {
      // Arrange - Load data directly from dataService
      const directData = await dataService.loadData()

      // Act - Load data via API endpoint
      const response = await request(app).get('/api/content')

      // Assert - Both should return the same data
      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(directData)
    })

    it('should return valid JSON response', async () => {
      // Act
      const response = await request(app).get('/api/content')

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toMatch(/json/)
      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow()
    })
  })
})
