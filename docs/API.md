# Portfolio Admin API Documentation

Base URL: `http://localhost:3000` (development) / your production domain

All endpoints return JSON. Authenticated endpoints require a valid session cookie (`admin_session`) and a CSRF token header (`x-csrf-token`) for state-changing operations.

---

## Authentication

### POST /api/auth/login

Authenticate the admin user and create a session.

**Rate limit:** 10 requests per 15-minute window per IP.

**Request body:**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "token": "<session-token>",
    "expiresAt": "2025-01-01T12:00:00.000Z",
    "user": { "username": "admin" },
    "csrfToken": "<csrf-token>"
  }
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| 400 | Missing username or password |
| 401 | Invalid credentials |
| 429 | Too many login attempts |
| 500 | Internal server error |

**Cookies set:**
- `admin_session` — HTTP-only, Secure (production), SameSite=Strict, 24-hour expiry
- `csrf_token` — Readable by client, Secure (production), SameSite=Strict, 24-hour expiry

---

### POST /api/auth/logout

Invalidate the current session.

**Headers required:**
- `x-csrf-token: <csrf-token>`

**Success response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| 400 | No active session |
| 403 | Missing or invalid CSRF token |
| 500 | Internal server error |

---

### GET /api/auth/session

Check the current session status.

**Success response (200) — authenticated:**
```json
{
  "success": true,
  "data": {
    "isAuthenticated": true,
    "user": { "username": "admin" },
    "expiresAt": "2025-01-01T12:00:00.000Z",
    "csrfToken": "<csrf-token>"
  }
}
```

**Success response (200) — not authenticated:**
```json
{
  "success": true,
  "data": {
    "isAuthenticated": false,
    "user": null,
    "expiresAt": null
  }
}
```

---

## Content

All content write endpoints require authentication (`admin_session` cookie) and a valid CSRF token (`x-csrf-token` header).

### GET /api/content

Retrieve all portfolio content. Public endpoint — no authentication required.

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "hero": { ... },
    "about": { ... },
    "skills": [ ... ],
    "projects": [ ... ],
    "experience": [ ... ],
    "contact": { ... },
    "metadata": {
      "lastUpdated": "2025-01-01T00:00:00.000Z",
      "version": "1.0.0"
    }
  }
}
```

---

### PUT /api/content/hero

Update the Hero section.

**Request body:**
```json
{
  "greeting": "Hi, I'm",
  "name": "John Doe",
  "title": "Full Stack Developer",
  "description": "I build things for the web.",
  "bio": "Short biography text.",
  "profileImage": "/uploads/hero/profile.jpg",
  "universityLink": "https://university.edu"
}
```

**Success response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Hero section updated successfully"
}
```

---

### PUT /api/content/about

Update the About section.

**Request body:**
```json
{
  "paragraphs": ["Paragraph one.", "Paragraph two."],
  "skills": ["TypeScript", "Vue.js"],
  "aboutImage": "/uploads/about/photo.jpg"
}
```

**Success response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "About section updated successfully"
}
```

---

### POST /api/content/skills

Create a new skill.

**Request body:**
```json
{
  "name": "TypeScript",
  "icon": "typescript",
  "category": "Language"
}
```

**Success response (201):**
```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "name": "TypeScript",
    "icon": "typescript",
    "category": "Language",
    "order": 5
  },
  "message": "Skill created successfully"
}
```

---

### PUT /api/content/skills/:id

Update an existing skill.

**URL params:** `id` — skill UUID

**Request body:** Same fields as POST (all optional except those required by schema).

**Success response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Skill updated successfully"
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| 404 | Skill not found |

---

### DELETE /api/content/skills/:id

Delete a skill.

**URL params:** `id` — skill UUID

**Success response (200):**
```json
{
  "success": true,
  "message": "Skill deleted successfully"
}
```

---

### PUT /api/content/skills/reorder

Reorder all skills. Send the complete skills array in the desired order.

**Request body:**
```json
{
  "skills": [
    { "id": "<uuid>", "name": "TypeScript", "icon": "typescript", "category": "Language", "order": 0 },
    { "id": "<uuid>", "name": "Vue.js", "icon": "vue", "category": "Framework", "order": 1 }
  ]
}
```

**Success response (200):**
```json
{
  "success": true,
  "data": [ ... ],
  "message": "Skills reordered successfully"
}
```

---

### POST /api/content/projects

Create a new project.

**Request body:**
```json
{
  "title": "My Project",
  "category": "Web App",
  "description": "A cool project.",
  "features": ["Feature 1", "Feature 2"],
  "image": "/uploads/projects/thumb.jpg",
  "link": "https://myproject.com",
  "githubLink": "https://github.com/user/repo",
  "featured": false
}
```

**Success response (201):**
```json
{
  "success": true,
  "data": { "id": "<uuid>", ... },
  "message": "Project created successfully"
}
```

---

### PUT /api/content/projects/:id

Update an existing project.

**URL params:** `id` — project UUID

**Request body:** Same fields as POST.

**Success response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Project updated successfully"
}
```

---

### DELETE /api/content/projects/:id

Delete a project.

**URL params:** `id` — project UUID

**Success response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### POST /api/content/experience

Create a new experience entry.

**Request body:**
```json
{
  "title": "Software Engineer",
  "company": "Acme Corp",
  "duration": "Jan 2023 – Present",
  "descriptions": ["Built features.", "Improved performance."]
}
```

**Success response (201):**
```json
{
  "success": true,
  "data": { "id": "<uuid>", ... },
  "message": "Experience created successfully"
}
```

---

### PUT /api/content/experience/:id

Update an existing experience entry.

**URL params:** `id` — experience UUID

**Request body:** Same fields as POST.

**Success response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Experience updated successfully"
}
```

---

### DELETE /api/content/experience/:id

Delete an experience entry.

**URL params:** `id` — experience UUID

**Success response (200):**
```json
{
  "success": true,
  "message": "Experience deleted successfully"
}
```

---

### PUT /api/content/experience/reorder

Reorder all experience entries.

**Request body:**
```json
{
  "experience": [
    { "id": "<uuid>", "title": "...", "company": "...", "duration": "...", "descriptions": [], "order": 0 }
  ]
}
```

**Success response (200):**
```json
{
  "success": true,
  "data": [ ... ],
  "message": "Experience reordered successfully"
}
```

---

### PUT /api/content/contact

Update the Contact section.

**Request body:**
```json
{
  "email": "hello@example.com",
  "subtitle": "Get in touch",
  "socialLinks": [
    { "id": "<uuid>", "icon": "github", "label": "GitHub", "href": "https://github.com/user" }
  ]
}
```

**Success response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contact section updated successfully"
}
```

---

### GET /api/backup

Download the current portfolio data as a JSON file. Requires authentication.

**Response:** A downloadable JSON file with `Content-Disposition: attachment` header.

**Filename format:** `portfolio-backup-<ISO-timestamp>.json`

**Success response (200):** Full portfolio data JSON (same structure as `GET /api/content`).

**Error responses:**
| Status | Reason |
|--------|--------|
| 401 | Not authenticated |
| 500 | Failed to generate backup |

---

## Images

All image endpoints require authentication.

### POST /api/images/upload

Upload an image file.

**Content-Type:** `multipart/form-data`

**Form fields:**
- `file` — the image file (JPG, PNG, GIF, WebP; max 5 MB)
- `category` — subdirectory category (e.g. `hero`, `projects`, `about`)

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "filename": "1234567890-uuid.jpg",
    "url": "/uploads/hero/1234567890-uuid.jpg"
  }
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| 400 | Invalid file type or file too large |
| 401 | Not authenticated |
| 500 | Upload failed |

---

### DELETE /api/images/:filename

Delete an uploaded image.

**URL params:** `filename` — the image filename (not the full path)

**Success response (200):**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## Health Check

### GET /api/health

Check server status. No authentication required.

**Success response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Security

### Cookie Security (Requirement 12.3)

Session cookies are configured with:
- `HttpOnly: true` — prevents JavaScript access, mitigates XSS token theft
- `Secure: true` (production only) — transmitted over HTTPS only
- `SameSite: Strict` — prevents cross-site request forgery via cookie

### CSRF Protection (Requirement 12.4)

All state-changing endpoints (POST, PUT, DELETE) require a valid CSRF token:
1. On login, a `csrf_token` cookie is set (readable by JavaScript).
2. The client must read this cookie and include its value in the `x-csrf-token` request header.
3. The server validates that the header value matches the cookie value using a timing-safe comparison.

### Rate Limiting (Brute-Force Protection)

The login endpoint is rate-limited to **10 attempts per 15 minutes per IP**. Exceeding this limit returns HTTP 429 with a descriptive error message.

### Input Sanitization (XSS Prevention)

All string values in request bodies are sanitized using the `xss` library before processing. This strips dangerous HTML tags and attributes to prevent stored XSS attacks.

---

## Common Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "errors": {
    "fieldName": "Validation error for this field"
  }
}
```

The `errors` object is only present for validation failures (HTTP 400).
