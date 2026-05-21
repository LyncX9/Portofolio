/**
 * Credential Initialization Script
 * 
 * This script initializes admin credentials from environment variables.
 * Run this script once during initial setup or when credentials need to be reset.
 * 
 * Usage:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=your-password node --loader tsx server/auth/init-credentials.ts
 */

import { initializeCredentials, loadCredentials } from './credentials'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('Admin Credential Initialization')
  console.log('================================\n')

  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    console.log('Creating data directory...')
    mkdirSync(dataDir, { recursive: true })
  }

  try {
    // Check if credentials already exist
    const existing = loadCredentials()
    if (existing) {
      console.log('⚠️  Credentials already exist!')
      console.log(`   Username: ${existing.username}`)
      console.log(`   Created: ${existing.createdAt}`)
      console.log(`   Updated: ${existing.updatedAt}`)
      console.log('\nTo reset credentials, delete data/admin-credentials.json and run this script again.')
      process.exit(0)
    }

    // Initialize credentials
    console.log('Initializing credentials from environment variables...')
    const initialized = await initializeCredentials()

    if (initialized) {
      const credentials = loadCredentials()
      console.log('✅ Credentials initialized successfully!')
      console.log(`   Username: ${credentials?.username}`)
      console.log(`   Created: ${credentials?.createdAt}`)
      console.log('\n⚠️  Keep your credentials secure!')
      console.log('   - Do not commit data/admin-credentials.json to version control')
      console.log('   - Do not share your ADMIN_PASSWORD')
      console.log('   - Use a strong password with at least 12 characters')
    } else {
      console.log('❌ Failed to initialize credentials')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error initializing credentials:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

main()
