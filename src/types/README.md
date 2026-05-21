# TypeScript Type Definitions

This directory contains all TypeScript interfaces and types used throughout the Admin Dashboard CRUD application.

## Available Types

### Content Types
- **HeroContent**: Hero section data (greeting, name, title, description, bio, profile image, university link)
- **AboutContent**: About section data (paragraphs, skills list, about image)
- **Skill**: Individual skill item (id, name, icon, category, order)
- **Project**: Project item (id, title, category, description, features, image, links, featured status, order)
- **Experience**: Work experience entry (id, title, company, duration, descriptions, order)
- **ContactContent**: Contact section data (email, subtitle, social links)
- **SocialLink**: Social media link (id, icon, label, href)

### Complete Data Structure
- **PortfolioData**: Complete portfolio data combining all content sections with metadata

### Authentication Types
- **AuthCredentials**: Login credentials (username, password)
- **AuthSession**: Active session data (token, expiration, username)
- **AuthState**: Authentication state (isAuthenticated, session, user)

### API Response Types
- **ApiResponse<T>**: Generic API response wrapper (success, data, error, message)
- **ImageUploadResponse**: Image upload response (success, filename, url, error)

## Usage

Import types as needed:

```typescript
import type { HeroContent, Project, ApiResponse } from '@/types'

// Use in component
const hero: HeroContent = {
  greeting: 'Hello',
  name: 'John Doe',
  // ...
}

// Use with API response
const response: ApiResponse<Project[]> = await fetchProjects()
```

## Requirements Validation

This file validates the following requirements:
- **Requirement 2.1**: Hero section content structure
- **Requirement 3.1**: About section content structure
- **Requirement 4.1**: Skills section structure
- **Requirement 5.1**: Projects section structure
- **Requirement 6.1**: Experience section structure
- **Requirement 7.1**: Contact section structure
- **Requirement 9.1**: Complete portfolio data structure
