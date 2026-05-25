import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { dataService } from '../services/dataService'
import { requireAuth } from '../middleware/auth'
import { validateCsrfToken } from '../middleware/csrf'
import {
  heroSchema,
  aboutSchema,
  skillSchema,
  projectSchema,
  certificateSchema,
  experienceSchema,
  contactSchema,
  getValidationErrors,
} from '../../src/types/schemas'

const router = Router()

function normalizeProjectCategories(body: { category?: unknown; categories?: unknown }): {
  category: string
  categories: string[]
} {
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const categories = Array.isArray(body.categories)
    ? body.categories.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : []

  const normalized = categories.length > 0 ? categories : category ? [category] : []

  return {
    category: normalized[0] ?? '',
    categories: normalized,
  }
}

/**
 * GET /api/content
 * Retrieve all portfolio content
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Load portfolio data using dataService
    const data = await dataService.loadData()

    // Return complete portfolio data structure
    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Content retrieval error:', error)

    // Return appropriate error response
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load portfolio content',
    })
  }
})

/**
 * PUT /api/content/hero
 * Update hero section content
 * Requires authentication
 */
router.put('/hero', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    // Validate request body against heroSchema
    const validation = heroSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: getValidationErrors(validation.error),
      })
    }

    // Update hero section using dataService
    await dataService.updateSection('hero', validation.data)

    // Return updated hero data
    return res.json({
      success: true,
      data: validation.data,
      message: 'Hero section updated successfully',
    })
  } catch (error) {
    console.error('Hero update error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update hero section',
    })
  }
})

/**
 * PUT /api/content/about
 * Update about section content
 * Requires authentication
 */
router.put('/about', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    // Validate request body against aboutSchema
    const validation = aboutSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: getValidationErrors(validation.error),
      })
    }

    // Update about section using dataService
    await dataService.updateSection('about', validation.data)

    // Return updated about data
    return res.json({
      success: true,
      data: validation.data,
      message: 'About section updated successfully',
    })
  } catch (error) {
    console.error('About update error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update about section',
    })
  }
})

/**
 * PUT /api/content/skills/reorder
 * Reorder skills
 * Requires authentication
 * NOTE: This route must be defined before /skills/:id to avoid route conflicts
 */
router.put(
  '/skills/reorder',
  requireAuth,
  validateCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const { skills } = req.body

      if (!Array.isArray(skills)) {
        return res.status(400).json({
          success: false,
          error: 'Skills must be an array',
        })
      }

      // Validate all skills
      const validations = skills.map((skill) => skillSchema.safeParse(skill))
      const hasErrors = validations.some((v) => !v.success)

      if (hasErrors) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed for one or more skills',
        })
      }

      // Update skills section with new order
      await dataService.updateSection('skills', skills)

      // Return success
      return res.json({
        success: true,
        data: skills,
        message: 'Skills reordered successfully',
      })
    } catch (error) {
      console.error('Skills reorder error:', error)
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder skills',
      })
    }
  },
)

/**
 * POST /api/content/skills
 * Create a new skill
 * Requires authentication
 */
router.post('/skills', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    // Load current data
    const data = await dataService.loadData()

    // Generate unique ID and calculate order
    const newSkill = {
      id: uuidv4(),
      name: req.body.name,
      icon: req.body.icon,
      category: req.body.category,
      order: data.skills.length > 0 ? Math.max(...data.skills.map((s) => s.order)) + 1 : 0,
    }

    // Validate the new skill
    const validation = skillSchema.safeParse(newSkill)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: getValidationErrors(validation.error),
      })
    }

    // Add to skills array
    data.skills.push(validation.data)

    // Update skills section
    await dataService.updateSection('skills', data.skills)

    // Return created skill
    return res.status(201).json({
      success: true,
      data: validation.data,
      message: 'Skill created successfully',
    })
  } catch (error) {
    console.error('Skill creation error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create skill',
    })
  }
})

/**
 * PUT /api/content/skills/:id
 * Update an existing skill
 * Requires authentication
 */
router.put('/skills/:id', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Load current data
    const data = await dataService.loadData()

    // Find skill by ID
    const skillIndex = data.skills.findIndex((s) => s.id === id)

    if (skillIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found',
      })
    }

    // Preserve order if not provided
    const updatedSkill = {
      ...req.body,
      id,
      order: req.body.order !== undefined ? req.body.order : data.skills[skillIndex].order,
    }

    // Validate the updated skill
    const validation = skillSchema.safeParse(updatedSkill)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: getValidationErrors(validation.error),
      })
    }

    // Update skill in array
    data.skills[skillIndex] = validation.data

    // Update skills section
    await dataService.updateSection('skills', data.skills)

    // Return updated skill
    return res.json({
      success: true,
      data: validation.data,
      message: 'Skill updated successfully',
    })
  } catch (error) {
    console.error('Skill update error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update skill',
    })
  }
})

/**
 * DELETE /api/content/skills/:id
 * Delete a skill
 * Requires authentication
 */
router.delete(
  '/skills/:id',
  requireAuth,
  validateCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // Load current data
      const data = await dataService.loadData()

      // Find skill by ID
      const skillIndex = data.skills.findIndex((s) => s.id === id)

      if (skillIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Skill not found',
        })
      }

      // Remove skill from array
      data.skills.splice(skillIndex, 1)

      // Update skills section
      await dataService.updateSection('skills', data.skills)

      // Return success
      return res.json({
        success: true,
        message: 'Skill deleted successfully',
      })
    } catch (error) {
      console.error('Skill deletion error:', error)
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete skill',
      })
    }
  },
)

/**
 * PUT /api/content/experience/reorder
 * Reorder experience entries
 * Requires authentication
 * NOTE: This route must be defined before /experience/:id to avoid route conflicts
 */
router.put(
  '/experience/reorder',
  requireAuth,
  validateCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const { experience } = req.body

      if (!Array.isArray(experience)) {
        return res.status(400).json({
          success: false,
          error: 'Experience must be an array',
        })
      }

      // Validate all experience entries
      const validations = experience.map((exp) => experienceSchema.safeParse(exp))
      const hasErrors = validations.some((v) => !v.success)

      if (hasErrors) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed for one or more experience entries',
        })
      }

      // Update experience section with new order
      await dataService.updateSection('experience', experience)

      // Return success
      return res.json({
        success: true,
        data: experience,
        message: 'Experience reordered successfully',
      })
    } catch (error) {
      console.error('Experience reorder error:', error)
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder experience',
      })
    }
  },
)

/**
 * POST /api/content/projects
 * Create a new project
 * Requires authentication
 */
router.post('/projects', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    // Load current data
    const data = await dataService.loadData()
    const categoryData = normalizeProjectCategories(req.body)

    // Generate unique ID and calculate order
    const newProject = {
      id: uuidv4(),
      title: req.body.title,
      category: categoryData.category,
      categories: categoryData.categories,
      description: req.body.description,
      features: req.body.features || [],
      image: req.body.image,
      link: req.body.link,
      githubLink: req.body.githubLink || '',
      featured: req.body.featured || false,
      order: data.projects.length > 0 ? Math.max(...data.projects.map((p) => p.order)) + 1 : 0,
    }

    // Validate the new project
    const validation = projectSchema.safeParse(newProject)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: getValidationErrors(validation.error),
      })
    }

    // Add to projects array
    data.projects.push(validation.data)

    // Update projects section
    await dataService.updateSection('projects', data.projects)

    // Return created project
    return res.status(201).json({
      success: true,
      data: validation.data,
      message: 'Project created successfully',
    })
  } catch (error) {
    console.error('Project creation error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    })
  }
})

/**
 * POST /api/content/experience
 * Create a new experience entry
 * Requires authentication
 */
router.post('/experience', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    // Load current data
    const data = await dataService.loadData()

    // Generate unique ID and calculate order
    const newExperience = {
      id: uuidv4(),
      title: req.body.title,
      company: req.body.company,
      duration: req.body.duration,
      descriptions: req.body.descriptions || [],
      order: data.experience.length > 0 ? Math.max(...data.experience.map((e) => e.order)) + 1 : 0,
    }

    // Validate the new experience
    const validation = experienceSchema.safeParse(newExperience)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: getValidationErrors(validation.error),
      })
    }

    // Add to experience array
    data.experience.push(validation.data)

    // Update experience section
    await dataService.updateSection('experience', data.experience)

    // Return created experience
    return res.status(201).json({
      success: true,
      data: validation.data,
      message: 'Experience created successfully',
    })
  } catch (error) {
    console.error('Experience creation error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create experience',
    })
  }
})

/**
 * PUT /api/content/projects/:id
 * Update an existing project
 * Requires authentication
 */
router.put('/projects/:id', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const categoryData = normalizeProjectCategories(req.body)

    // Load current data
    const data = await dataService.loadData()

    // Find project by ID
    const projectIndex = data.projects.findIndex((p) => p.id === id)

    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      })
    }

    // Preserve order if not provided
    const updatedProject = {
      ...req.body,
      id,
      category: categoryData.category,
      categories: categoryData.categories,
      order: req.body.order !== undefined ? req.body.order : data.projects[projectIndex].order,
    }

    // Validate the updated project
    const validation = projectSchema.safeParse(updatedProject)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: getValidationErrors(validation.error),
      })
    }

    // Update project in array
    data.projects[projectIndex] = validation.data

    // Update projects section
    await dataService.updateSection('projects', data.projects)

    // Return updated project
    return res.json({
      success: true,
      data: validation.data,
      message: 'Project updated successfully',
    })
  } catch (error) {
    console.error('Project update error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    })
  }
})

/**
 * DELETE /api/content/projects/:id
 * Delete a project
 * Requires authentication
 */
router.delete(
  '/projects/:id',
  requireAuth,
  validateCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // Load current data
      const data = await dataService.loadData()

      // Find project by ID
      const projectIndex = data.projects.findIndex((p) => p.id === id)

      if (projectIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        })
      }

      // Remove project from array
      data.projects.splice(projectIndex, 1)

      // Update projects section
      await dataService.updateSection('projects', data.projects)

      // Return success
      return res.json({
        success: true,
        message: 'Project deleted successfully',
      })
    } catch (error) {
      console.error('Project deletion error:', error)
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
      })
    }
  },
)

/**
 * POST /api/content/certificates
 * Create a new certificate
 * Requires authentication
 */
router.post(
  '/certificates',
  requireAuth,
  validateCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const data = await dataService.loadData()

      const newCertificate = {
        id: uuidv4(),
        title: req.body.title,
        issuer: req.body.issuer,
        issuedAt: req.body.issuedAt,
        description: req.body.description,
        image: req.body.image,
        credentialUrl: req.body.credentialUrl || '',
        order:
          data.certificates.length > 0 ? Math.max(...data.certificates.map((c) => c.order)) + 1 : 0,
      }

      const validation = certificateSchema.safeParse(newCertificate)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: getValidationErrors(validation.error),
        })
      }

      data.certificates.push(validation.data)
      await dataService.updateSection('certificates', data.certificates)

      return res.status(201).json({
        success: true,
        data: validation.data,
        message: 'Certificate created successfully',
      })
    } catch (error) {
      console.error('Certificate creation error:', error)
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create certificate',
      })
    }
  },
)

/**
 * PUT /api/content/certificates/:id
 * Update an existing certificate
 * Requires authentication
 */
router.put(
  '/certificates/:id',
  requireAuth,
  validateCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const data = await dataService.loadData()
      const certificateIndex = data.certificates.findIndex((c) => c.id === id)

      if (certificateIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Certificate not found',
        })
      }

      const updatedCertificate = {
        ...req.body,
        id,
        order:
          req.body.order !== undefined ? req.body.order : data.certificates[certificateIndex].order,
      }

      const validation = certificateSchema.safeParse(updatedCertificate)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: getValidationErrors(validation.error),
        })
      }

      data.certificates[certificateIndex] = validation.data
      await dataService.updateSection('certificates', data.certificates)

      return res.json({
        success: true,
        data: validation.data,
        message: 'Certificate updated successfully',
      })
    } catch (error) {
      console.error('Certificate update error:', error)
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update certificate',
      })
    }
  },
)

/**
 * DELETE /api/content/certificates/:id
 * Delete a certificate
 * Requires authentication
 */
router.delete(
  '/certificates/:id',
  requireAuth,
  validateCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const data = await dataService.loadData()
      const certificateIndex = data.certificates.findIndex((c) => c.id === id)

      if (certificateIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Certificate not found',
        })
      }

      data.certificates.splice(certificateIndex, 1)
      await dataService.updateSection('certificates', data.certificates)

      return res.json({
        success: true,
        message: 'Certificate deleted successfully',
      })
    } catch (error) {
      console.error('Certificate deletion error:', error)
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete certificate',
      })
    }
  },
)

/**
 * PUT /api/content/experience/:id
 * Update an existing experience entry
 * Requires authentication
 */
router.put(
  '/experience/:id',
  requireAuth,
  validateCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // Load current data
      const data = await dataService.loadData()

      // Find experience by ID
      const experienceIndex = data.experience.findIndex((e) => e.id === id)

      if (experienceIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Experience not found',
        })
      }

      // Preserve order if not provided
      const updatedExperience = {
        ...req.body,
        id,
        order:
          req.body.order !== undefined ? req.body.order : data.experience[experienceIndex].order,
      }

      // Validate the updated experience
      const validation = experienceSchema.safeParse(updatedExperience)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: getValidationErrors(validation.error),
        })
      }

      // Update experience in array
      data.experience[experienceIndex] = validation.data

      // Update experience section
      await dataService.updateSection('experience', data.experience)

      // Return updated experience
      return res.json({
        success: true,
        data: validation.data,
        message: 'Experience updated successfully',
      })
    } catch (error) {
      console.error('Experience update error:', error)
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update experience',
      })
    }
  },
)

/**
 * DELETE /api/content/experience/:id
 * Delete an experience entry
 * Requires authentication
 */
router.delete(
  '/experience/:id',
  requireAuth,
  validateCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // Load current data
      const data = await dataService.loadData()

      // Find experience by ID
      const experienceIndex = data.experience.findIndex((e) => e.id === id)

      if (experienceIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Experience not found',
        })
      }

      // Remove experience from array
      data.experience.splice(experienceIndex, 1)

      // Update experience section
      await dataService.updateSection('experience', data.experience)

      // Return success
      return res.json({
        success: true,
        message: 'Experience deleted successfully',
      })
    } catch (error) {
      console.error('Experience deletion error:', error)
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete experience',
      })
    }
  },
)

/**
 * PUT /api/content/contact
 * Update contact section content
 * Requires authentication
 */
router.put('/contact', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    // Validate request body against contactSchema
    const validation = contactSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: getValidationErrors(validation.error),
      })
    }

    // Update contact section using dataService
    await dataService.updateSection('contact', validation.data)

    // Return updated contact data
    return res.json({
      success: true,
      data: validation.data,
      message: 'Contact section updated successfully',
    })
  } catch (error) {
    console.error('Contact update error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact section',
    })
  }
})

/**
 * GET /api/backup
 * Download current portfolio data as a JSON file.
 * Requires authentication.
 * Satisfies Requirement 9.6 — atomic backup support.
 */
router.get('/backup', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = await dataService.loadData()

    // Build a filename with a timestamp for easy identification
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `portfolio-backup-${timestamp}.json`

    // Set headers so the browser treats this as a file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/json')

    return res.json(data)
  } catch (error) {
    console.error('Backup error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate backup',
    })
  }
})

/**
 * GET /api/content/backups
 * List all available backup files.
 * Requires authentication.
 * Satisfies Requirement 9.6 — backup management.
 */
router.get('/backups', requireAuth, async (req: Request, res: Response) => {
  try {
    const backups = await dataService.listBackups()

    // Return just the filenames (not full paths) for security
    const backupFilenames = backups.map((b) => {
      const parts = b.replace(/\\/g, '/').split('/')
      return parts[parts.length - 1]
    })

    return res.json({
      success: true,
      data: backupFilenames,
    })
  } catch (error) {
    console.error('List backups error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list backups',
    })
  }
})

/**
 * POST /api/content/restore
 * Restore portfolio data from a named backup file.
 * Requires authentication.
 * Satisfies Requirement 9.6 — restore from backup.
 *
 * Body: { backupFilename: string }
 */
router.post('/restore', requireAuth, validateCsrfToken, async (req: Request, res: Response) => {
  try {
    const { backupFilename } = req.body

    if (!backupFilename || typeof backupFilename !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'backupFilename is required',
      })
    }

    // Sanitize: reject any path traversal attempts
    const sanitized = backupFilename.replace(/\\/g, '/').split('/').pop() ?? ''
    if (!sanitized || sanitized !== backupFilename) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup filename',
      })
    }

    // Validate the filename looks like a real backup (must end with .backup)
    if (!sanitized.endsWith('.backup')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup filename: must end with .backup',
      })
    }

    // List available backups and verify the requested one exists
    const availableBackups = await dataService.listBackups()
    const matchingBackup = availableBackups.find((b) => {
      const parts = b.replace(/\\/g, '/').split('/')
      return parts[parts.length - 1] === sanitized
    })

    if (!matchingBackup) {
      return res.status(404).json({
        success: false,
        error: 'Backup file not found',
      })
    }

    // Restore from the validated backup path
    await dataService.restoreFromBackup(matchingBackup)

    return res.json({
      success: true,
      message: `Portfolio data restored from backup: ${sanitized}`,
    })
  } catch (error) {
    console.error('Restore error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore from backup',
    })
  }
})

export default router
