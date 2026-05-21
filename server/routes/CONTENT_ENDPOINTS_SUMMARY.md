# Content API Endpoints

This document describes the content retrieval endpoints for the portfolio application.

## GET /api/content

Retrieves all portfolio content from the data store.

### Request

- **Method**: GET
- **URL**: `/api/content`
- **Authentication**: Not required (public endpoint)
- **Headers**: None required

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "hero": {
      "greeting": "Hello",
      "name": "John Doe",
      "title": "Software Developer",
      "description": "Building amazing things",
      "bio": "Passionate developer",
      "profileImage": "/images/profile.jpg",
      "universityLink": "https://university.edu"
    },
    "about": {
      "paragraphs": [
        "First paragraph",
        "Second paragraph"
      ],
      "skills": [
        "JavaScript",
        "TypeScript",
        "Vue"
      ],
      "aboutImage": "/images/about.jpg"
    },
    "skills": [
      {
        "id": "1",
        "name": "JavaScript",
        "icon": "js-icon",
        "category": "Frontend",
        "order": 1
      }
    ],
    "projects": [
      {
        "id": "1",
        "title": "Project 1",
        "category": "Web",
        "description": "A great project",
        "features": ["Feature 1", "Feature 2"],
        "image": "/images/project1.jpg",
        "link": "https://project1.com",
        "githubLink": "https://github.com/user/project1",
        "featured": true,
        "order": 1
      }
    ],
    "experience": [
      {
        "id": "1",
        "title": "Senior Developer",
        "company": "Tech Company",
        "duration": "2020-2023",
        "descriptions": [
          "Led development team",
          "Implemented new features"
        ],
        "order": 1
      }
    ],
    "contact": {
      "email": "john@example.com",
      "subtitle": "Get in touch",
      "socialLinks": [
        {
          "id": "1",
          "icon": "github",
          "label": "GitHub",
          "href": "https://github.com/johndoe"
        }
      ]
    },
    "metadata": {
      "lastUpdated": "2024-01-01T00:00:00.000Z",
      "version": "1.0.0"
    }
  }
}
```

#### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to load portfolio content"
}
```

### Implementation Details

- **Data Source**: Reads from `data/portfolio-data.json`
- **Service**: Uses `dataService.loadData()` method
- **Error Handling**: 
  - Catches file read failures
  - Catches JSON parse errors
  - Returns descriptive error messages
- **Retry Logic**: Automatically retries failed reads up to 3 times with exponential backoff

### Usage Example

#### Using fetch API

```javascript
async function loadPortfolioContent() {
  try {
    const response = await fetch('http://localhost:3000/api/content')
    const result = await response.json()
    
    if (result.success) {
      console.log('Portfolio data:', result.data)
      return result.data
    } else {
      console.error('Error:', result.error)
      return null
    }
  } catch (error) {
    console.error('Network error:', error)
    return null
  }
}
```

#### Using axios

```javascript
import axios from 'axios'

async function loadPortfolioContent() {
  try {
    const response = await axios.get('http://localhost:3000/api/content')
    return response.data.data
  } catch (error) {
    console.error('Error loading content:', error)
    return null
  }
}
```

### Testing

The endpoint includes comprehensive test coverage:

- **Unit Tests** (`content.test.ts`): Tests with mocked dataService
  - Successful data retrieval
  - Error handling for file read failures
  - Non-Error exception handling
  - Complete data structure validation

- **Integration Tests** (`content.integration.test.ts`): Tests with actual dataService
  - Real file system operations
  - Data consistency verification
  - JSON response validation

Run tests with:
```bash
npm test -- server/routes/content --run
```

### Related Files

- **Route Handler**: `server/routes/content.ts`
- **Data Service**: `server/services/dataService.ts`
- **Data File**: `data/portfolio-data.json`
- **Tests**: 
  - `server/routes/content.test.ts`
  - `server/routes/content.integration.test.ts`

### Future Enhancements

This endpoint is part of Task 5.1 in the admin dashboard CRUD implementation. Future tasks will add:

- PUT endpoints for updating content sections
- POST/DELETE endpoints for managing items (skills, projects, experience)
- Authentication middleware for protected endpoints
- CSRF protection for state-changing operations
