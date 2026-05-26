import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth'
import contentRoutes from './routes/content'
import imageRoutes from './routes/images'
import { initializeCredentials } from './auth'
import { sanitizeInput } from './middleware/sanitize'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Sanitize all incoming request bodies to prevent XSS
app.use(sanitizeInput)

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// In production, serve the built Vue frontend from dist/
if (IS_PRODUCTION) {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/images', imageRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// In production, serve index.html for all non-API routes (SPA fallback)
if (IS_PRODUCTION) {
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

// Initialize credentials on startup
initializeCredentials()
  .then((initialized) => {
    if (initialized) {
      console.log('Admin credentials initialized from environment variables')
    } else {
      console.log('Admin credentials already exist')
    }
  })
  .catch((error) => {
    console.error('Failed to initialize credentials:', error)
    process.exit(1)
  })

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
