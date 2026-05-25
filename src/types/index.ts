// Core Data Types for Admin Dashboard CRUD

// Hero Section
export interface HeroContent {
  greeting: string
  name: string
  title: string
  description: string
  bio: string
  profileImage: string
  universityLink: string
}

// About Section
export interface AboutContent {
  paragraphs: string[]
  skills: string[]
  aboutImage: string
}

// Skills Section
export interface Skill {
  id: string
  name: string
  icon: string
  category: string
  order: number
}

// Projects Section
export interface Project {
  id: string
  title: string
  category: string
  categories?: string[]
  description: string
  features: string[]
  image: string
  link: string
  githubLink?: string
  featured: boolean
  order: number
}

// Certificates Section
export interface Certificate {
  id: string
  title: string
  issuer: string
  issuedAt: string
  description: string
  image: string
  credentialUrl?: string
  order: number
}

// Experience Section
export interface Experience {
  id: string
  title: string
  company: string
  duration: string
  descriptions: string[]
  order: number
}

// Contact Section
export interface ContactContent {
  email: string
  subtitle: string
  socialLinks: SocialLink[]
}

export interface SocialLink {
  id: string
  icon: string
  label: string
  href: string
}

// Complete Portfolio Data Structure
export interface PortfolioData {
  hero: HeroContent
  about: AboutContent
  skills: Skill[]
  projects: Project[]
  certificates: Certificate[]
  experience: Experience[]
  contact: ContactContent
  metadata: {
    lastUpdated: string
    version: string
  }
}

// Authentication
export interface AuthCredentials {
  username: string
  password: string
}

export interface AuthSession {
  token: string
  expiresAt: number
  username: string
  csrfToken?: string
}

export interface AuthState {
  isAuthenticated: boolean
  session: AuthSession | null
  user: { username: string } | null
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ImageUploadResponse {
  success: boolean
  filename: string
  url: string
  error?: string
}

// Validation Error Types
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationErrors {
  [key: string]: string
}

// Re-export validation schemas and utilities
export * from './schemas'
