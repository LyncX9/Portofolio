# Services Layer

This directory contains service modules that handle API communication and business logic.

## Services

- **authService**: Authentication and session management
- **contentService**: Portfolio content CRUD operations
- **imageService**: Image upload, deletion, and replacement

## Architecture

Services act as an abstraction layer between Pinia stores and the backend API. They:
- Handle API requests using utilities from `@/utils/api`
- Transform data between frontend and backend formats
- Implement error handling and retry logic
- Provide type-safe interfaces for stores to consume

## Usage

```typescript
import { authService } from '@/services/authService'
import { contentService } from '@/services/contentService'
import { imageService } from '@/services/imageService'
```
