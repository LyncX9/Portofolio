import { z } from 'zod'

// Hero validation schema
export const heroSchema = z.object({
  greeting: z.string().min(1, 'Greeting is required'),
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  bio: z.string().min(1, 'Bio is required'),
  profileImage: z.string().url('Must be a valid URL'),
  universityLink: z.string().url('Must be a valid URL')
})

// About validation schema
export const aboutSchema = z.object({
  paragraphs: z.array(z.string().min(1, 'Paragraph cannot be empty')).min(1, 'At least one paragraph is required'),
  skills: z.array(z.string().min(1, 'Skill cannot be empty')).min(1, 'At least one skill is required'),
  aboutImage: z.string().url('Must be a valid URL')
})

// Skill validation schema
export const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Skill name is required'),
  icon: z.string().min(1, 'Icon is required'),
  category: z.string().min(1, 'Category is required'),
  order: z.number()
})

// Project validation schema
export const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  image: z.string().url('Must be a valid URL'),
  link: z.string().url('Must be a valid URL'),
  githubLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  featured: z.boolean(),
  order: z.number()
})

// Experience validation schema
export const experienceSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  duration: z.string().min(1, 'Duration is required'),
  descriptions: z.array(z.string().min(1, 'Description cannot be empty')).min(1, 'At least one description is required'),
  order: z.number()
})

// Social Link validation schema
export const socialLinkSchema = z.object({
  id: z.string(),
  icon: z.string().min(1, 'Icon is required'),
  label: z.string().min(1, 'Label is required'),
  href: z.string().url('Must be a valid URL')
})

// Contact validation schema
export const contactSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  socialLinks: z.array(socialLinkSchema).min(1, 'At least one social link is required')
})

// Email validation
export const emailSchema = z.string().email('Must be a valid email address')

// URL validation
export const urlSchema = z.string().url('Must be a valid URL')

// Auth credentials validation
export const authCredentialsSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

// Complete portfolio data validation
export const portfolioDataSchema = z.object({
  hero: heroSchema,
  about: aboutSchema,
  skills: z.array(skillSchema),
  projects: z.array(projectSchema),
  experience: z.array(experienceSchema),
  contact: contactSchema,
  metadata: z.object({
    lastUpdated: z.string(),
    version: z.string()
  })
})

// Type inference from schemas
export type HeroSchemaType = z.infer<typeof heroSchema>
export type AboutSchemaType = z.infer<typeof aboutSchema>
export type SkillSchemaType = z.infer<typeof skillSchema>
export type ProjectSchemaType = z.infer<typeof projectSchema>
export type ExperienceSchemaType = z.infer<typeof experienceSchema>
export type ContactSchemaType = z.infer<typeof contactSchema>
export type PortfolioDataSchemaType = z.infer<typeof portfolioDataSchema>

// Validation utility functions

/**
 * Validates data against a Zod schema and returns validation result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success status, validated data (if successful), and errors (if failed)
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Validates data and throws an error if validation fails
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data
 * @throws ZodError if validation fails
 */
export function validateDataStrict<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Extracts user-friendly error messages from Zod validation errors
 * @param error - Zod error object
 * @returns Record of field paths to error messages
 */
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  error.issues.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  return errors
}

/**
 * Validates a single field against a schema
 * @param schema - Zod schema to validate against
 * @param value - Value to validate
 * @returns Error message if validation fails, null if successful
 */
export function validateField<T>(schema: z.ZodSchema<T>, value: unknown): string | null {
  const result = schema.safeParse(value)
  if (result.success) {
    return null
  }
  return result.error.issues[0]?.message || 'Validation failed'
}

/**
 * Validates an email address
 * @param email - Email address to validate
 * @returns Error message if invalid, null if valid
 */
export function validateEmail(email: string): string | null {
  return validateField(emailSchema, email)
}

/**
 * Validates a URL
 * @param url - URL to validate
 * @returns Error message if invalid, null if valid
 */
export function validateUrl(url: string): string | null {
  return validateField(urlSchema, url)
}

/**
 * Validates that a string is not empty (after trimming)
 * @param value - String to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message if empty, null if valid
 */
export function validateRequired(value: string, fieldName: string = 'Field'): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Validates that an array is not empty
 * @param array - Array to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message if empty, null if valid
 */
export function validateArrayNotEmpty<T>(array: T[], fieldName: string = 'Array'): string | null {
  if (!array || array.length === 0) {
    return `${fieldName} must contain at least one item`
  }
  return null
}

/**
 * Validates multiple fields and returns all errors
 * @param validations - Array of validation functions that return error messages or null
 * @returns Array of error messages (empty if all validations pass)
 */
export function validateMultiple(validations: (() => string | null)[]): string[] {
  return validations.map((validate) => validate()).filter((error): error is string => error !== null)
}

/**
 * Checks if a value is a valid URL format
 * @param value - Value to check
 * @returns True if valid URL, false otherwise
 */
export function isValidUrl(value: string): boolean {
  return validateUrl(value) === null
}

/**
 * Checks if a value is a valid email format
 * @param value - Value to check
 * @returns True if valid email, false otherwise
 */
export function isValidEmail(value: string): boolean {
  return validateEmail(value) === null
}
