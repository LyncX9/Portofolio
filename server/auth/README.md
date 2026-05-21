# Authentication Module

This module provides secure password hashing and credential management for the admin dashboard.

## Features

- **Secure Password Hashing**: Uses bcrypt with cost factor 12 for industry-standard password security
- **Credential Storage**: Stores admin credentials in `data/admin-credentials.json`
- **Environment Variable Initialization**: Automatically initializes credentials from environment variables
- **Credential Validation**: Validates username and password against stored credentials

## Usage

### Initialize Credentials

Credentials are automatically initialized from environment variables on first run:

```typescript
import { initializeCredentials } from './server/auth/credentials'

// Set environment variables
process.env.ADMIN_USERNAME = 'admin' // Optional, defaults to 'admin'
process.env.ADMIN_PASSWORD = 'your-secure-password' // Required

// Initialize credentials (only runs if credentials don't exist)
await initializeCredentials()
```

### Validate Credentials

```typescript
import { validateCredentials } from './server/auth/credentials'

const isValid = await validateCredentials('admin', 'password')
if (isValid) {
  // Create session
} else {
  // Show error
}
```

### Hash Password

```typescript
import { hashPassword } from './server/auth/credentials'

const hash = await hashPassword('plainTextPassword')
```

### Verify Password

```typescript
import { verifyPassword } from './server/auth/credentials'

const isValid = await verifyPassword('plainTextPassword', hash)
```

## Credential File Structure

The `data/admin-credentials.json` file has the following structure:

```json
{
  "username": "admin",
  "passwordHash": "$2b$12$...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Security Features

- **bcrypt Hashing**: Uses bcrypt with cost factor 12 (2^12 = 4096 iterations)
- **Salt Generation**: Each password hash includes a unique salt
- **Timing-Safe Comparison**: bcrypt.compare uses constant-time comparison to prevent timing attacks
- **No Plain Text Storage**: Passwords are never stored in plain text

## Environment Variables

- `ADMIN_USERNAME`: Admin username (optional, defaults to 'admin')
- `ADMIN_PASSWORD`: Admin password (required for initial setup)

## Testing

Run tests with:

```bash
npm test server/auth/credentials.test.ts
```

## Future Enhancements

- Password change functionality
- Multiple admin users
- Password strength validation
- Account lockout after failed attempts
- Password expiration policies
