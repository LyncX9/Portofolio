# Authentication Module Usage Examples

## Initial Setup

### 1. Set Environment Variables

Create a `.env` file in the project root:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=MySecurePassword123!
```

### 2. Initialize Credentials

Run the initialization script:

```bash
# Using tsx (TypeScript execution)
npx tsx server/auth/init-credentials.ts

# Or using Node with loader
node --loader tsx server/auth/init-credentials.ts
```

This will create `data/admin-credentials.json` with the hashed password.

## Usage in Server Code

### Example 1: Login Endpoint

```typescript
import express from 'express'
import { validateCredentials } from './server/auth'

const app = express()
app.use(express.json())

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    })
  }

  try {
    // Validate credentials
    const isValid = await validateCredentials(username, password)

    if (isValid) {
      // Create session (implementation in next task)
      return res.json({
        success: true,
        message: 'Login successful'
      })
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
    }
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})
```

### Example 2: Server Initialization

```typescript
import { initializeCredentials } from './server/auth'

async function startServer() {
  // Initialize credentials on server start
  try {
    const initialized = await initializeCredentials()
    if (initialized) {
      console.log('✅ Admin credentials initialized')
    } else {
      console.log('ℹ️  Using existing credentials')
    }
  } catch (error) {
    console.error('❌ Failed to initialize credentials:', error)
    process.exit(1)
  }

  // Start your server
  // ...
}

startServer()
```

### Example 3: Password Change Endpoint (Future Enhancement)

```typescript
import { validateCredentials, hashPassword, saveCredentials, loadCredentials } from './server/auth'

app.post('/api/auth/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body

  // Get current credentials
  const credentials = loadCredentials()
  if (!credentials) {
    return res.status(500).json({ error: 'Credentials not found' })
  }

  // Verify current password
  const isValid = await validateCredentials(credentials.username, currentPassword)
  if (!isValid) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  // Hash new password
  const newHash = await hashPassword(newPassword)

  // Update credentials
  saveCredentials({
    ...credentials,
    passwordHash: newHash,
    updatedAt: new Date().toISOString()
  })

  res.json({ success: true, message: 'Password changed successfully' })
})
```

## Security Best Practices

1. **Never log passwords**: Always log sanitized data
2. **Use HTTPS**: Always use HTTPS in production to protect credentials in transit
3. **Rate limiting**: Implement rate limiting on login endpoints to prevent brute force attacks
4. **Strong passwords**: Enforce strong password requirements
5. **Secure storage**: Keep `data/admin-credentials.json` out of version control
6. **Environment variables**: Never commit `.env` files to version control

## Testing

```typescript
import { validateCredentials, initializeCredentials } from './server/auth'

// Set up test credentials
process.env.ADMIN_USERNAME = 'testadmin'
process.env.ADMIN_PASSWORD = 'testpass123'

await initializeCredentials()

// Test validation
const isValid = await validateCredentials('testadmin', 'testpass123')
console.log('Valid credentials:', isValid) // true

const isInvalid = await validateCredentials('testadmin', 'wrongpass')
console.log('Invalid credentials:', isInvalid) // false
```

## Troubleshooting

### Error: "ADMIN_PASSWORD environment variable is required"

Make sure you have set the `ADMIN_PASSWORD` environment variable before running the initialization script.

### Error: "Credentials not initialized"

Run the initialization script first to create the credentials file.

### Error: "Failed to save credentials"

Check that the `data/` directory exists and has write permissions.

## Next Steps

After implementing credential storage, the next task is to implement session management:
- Session creation with UUID tokens
- Session validation with expiration checking
- Session cleanup for expired sessions
- HTTP-only cookie handling
