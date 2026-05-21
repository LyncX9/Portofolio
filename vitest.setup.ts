/**
 * Vitest Global Setup
 * 
 * This file runs once before all tests to set up the test environment.
 */

import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { initializeCredentials } from './server/auth/credentials'

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// Initialize credentials for testing
process.env.ADMIN_USERNAME = 'testadmin'
process.env.ADMIN_PASSWORD = 'testpassword123'

// Initialize credentials before all tests
await initializeCredentials().catch(() => {
  // Credentials might already exist, which is fine
})

console.log('✅ Test environment initialized')
