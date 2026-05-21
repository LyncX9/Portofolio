# Portfolio

A personal portfolio site with a built-in admin dashboard for managing content. Built with **Vue 3 + TypeScript** (frontend) and **Express + Node.js** (backend API).

---

## Table of Contents

- [Requirements](#requirements)
- [Quick Start (Development)](#quick-start-development)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [API Overview](#api-overview)
- [Backup & Restore](#backup--restore)
- [Project Structure](#project-structure)

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | `^20.19.0` or `>=22.12.0` |
| npm | `>=10` |

---

## Quick Start (Development)

```sh
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env — at minimum set ADMIN_PASSWORD and SESSION_SECRET

# 3. Start the Express API server (port 3000)
node --experimental-vm-modules --loader ts-node/esm server/index.ts
# or, if you have tsx installed:
npx tsx server/index.ts

# 4. In a separate terminal, start the Vite dev server (port 5173)
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`, so you only need to open `http://localhost:5173`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Express API server port |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `ADMIN_USERNAME` | `admin` | Admin dashboard login username |
| `ADMIN_PASSWORD` | *(required)* | Admin dashboard login password (min 12 chars) |
| `SESSION_SECRET` | *(required)* | Secret for signing session/CSRF tokens |
| `SESSION_DURATION_MS` | `86400000` | Session lifetime in ms (default 24 h) |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS |

Generate a secure `SESSION_SECRET`:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Production Deployment

### 1. Build the frontend

```sh
npm run build
```

This compiles the Vue app into `dist/`. The Express server can serve these static files directly.

### 2. Configure environment

```sh
cp .env.example .env
```

Set at minimum:

```dotenv
NODE_ENV=production
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong-password>
SESSION_SECRET=<random-hex-string>
CLIENT_URL=https://your-domain.com
```

### 3. Serve static files from Express (optional)

Add the following to `server/index.ts` to serve the built frontend from the same process:

```ts
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { serveStatic } from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, '../dist')))

// Fallback: send index.html for all non-API routes (SPA routing)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})
```

### 4. Start the server

```sh
node server/index.ts
# or with a process manager:
npx pm2 start server/index.ts --name portfolio
```

### 5. Health check

Verify the server is running:

```sh
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}
```

### Using PM2 (recommended for production)

```sh
npm install -g pm2

# Start
pm2 start server/index.ts --name portfolio --interpreter node \
  --node-args="--loader ts-node/esm"

# Auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs portfolio
```

### Using Docker (optional)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server/index.ts"]
```

```sh
docker build -t portfolio .
docker run -p 3000:3000 --env-file .env portfolio
```

---

## API Overview

All content endpoints are prefixed with `/api/content`. Protected routes require a valid session cookie obtained via `POST /api/auth/login`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | — | Health check |
| `POST` | `/api/auth/login` | — | Log in |
| `POST` | `/api/auth/logout` | ✓ | Log out |
| `GET` | `/api/content` | — | Get all portfolio data |
| `PUT` | `/api/content/hero` | ✓ | Update hero section |
| `PUT` | `/api/content/about` | ✓ | Update about section |
| `PUT` | `/api/content/contact` | ✓ | Update contact section |
| `POST/PUT/DELETE` | `/api/content/skills` | ✓ | Manage skills |
| `POST/PUT/DELETE` | `/api/content/projects` | ✓ | Manage projects |
| `POST/PUT/DELETE` | `/api/content/experience` | ✓ | Manage experience |
| `GET` | `/api/content/backup` | ✓ | Download data backup |
| `GET` | `/api/content/backups` | ✓ | List available backups |
| `POST` | `/api/content/restore` | ✓ | Restore from backup |

See [`docs/API.md`](docs/API.md) for full endpoint documentation.

---

## Backup & Restore

Every save operation automatically creates a timestamped backup in `data/backups/`. Up to 10 backups are retained.

**List backups:**

```sh
curl -b cookies.txt http://localhost:3000/api/content/backups
```

**Restore from a backup:**

```sh
curl -b cookies.txt -X POST http://localhost:3000/api/content/restore \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -d '{"backupFilename": "portfolio-data.json.2024-01-15T10-30-00-000Z.backup"}'
```

---

## Project Structure

```
├── data/                   # Portfolio data and backups
│   ├── portfolio-data.json
│   └── backups/
├── dist/                   # Built frontend (generated by npm run build)
├── docs/                   # API documentation
├── public/                 # Static assets
├── server/                 # Express backend
│   ├── auth/               # Authentication (sessions, credentials)
│   ├── middleware/         # Auth, CSRF, sanitization middleware
│   ├── routes/             # API route handlers
│   ├── services/           # Data service (read/write/backup)
│   ├── utils/              # File operations, image utilities
│   └── index.ts            # Server entry point
├── src/                    # Vue 3 frontend
│   ├── components/         # Vue components (portfolio + admin)
│   ├── composables/        # Reusable composition functions
│   ├── router/             # Vue Router configuration
│   ├── services/           # API client services
│   ├── stores/             # Pinia state stores
│   └── types/              # TypeScript types and Zod schemas
├── .env.example            # Environment variable template
├── vite.config.ts          # Vite build configuration
└── package.json
```

---

## Development Scripts

```sh
npm run dev          # Start Vite dev server
npm run build        # Type-check + build for production
npm run preview      # Preview production build locally
npm run test         # Run all tests (vitest)
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest UI
npm run lint         # Lint and auto-fix with ESLint
npm run format       # Format source files with Prettier
```

---

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension (disable Vetur if installed).
