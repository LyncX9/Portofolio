# File Operations Utilities

This module provides atomic file write operations with built-in safety features for the portfolio admin backend.

## Features

- **Atomic Writes**: Uses temp file + rename strategy to ensure data integrity
- **File Locking**: Prevents concurrent writes to the same file
- **Retry Logic**: Automatic retry with exponential backoff on failures
- **Automatic Backups**: Creates backups before overwriting files
- **Backup Management**: Automatically cleans up old backups (keeps last 10)

## Usage

### Basic Atomic Write

```typescript
import { writeDataAtomic } from './server/utils/fileOperations'

const data = JSON.stringify({ hero: { name: 'John Doe' } })
await writeDataAtomic('/path/to/portfolio-data.json', data)
```

### Write with Custom Options

```typescript
await writeDataAtomic('/path/to/portfolio-data.json', data, {
  maxRetries: 5,           // Maximum retry attempts (default: 3)
  initialDelay: 200,       // Initial delay for backoff in ms (default: 100)
  createBackup: true,      // Create backup before write (default: true)
  backupDir: '/path/to/backups'  // Custom backup directory
})
```

### Read with Retry

```typescript
import { readDataWithRetry } from './server/utils/fileOperations'

const data = await readDataWithRetry('/path/to/portfolio-data.json', {
  maxRetries: 3,
  initialDelay: 100
})
```

### List Backups

```typescript
import { listBackups } from './server/utils/fileOperations'

// Get all backups for a file (sorted newest first)
const backups = await listBackups('/path/to/portfolio-data.json')
console.log(backups) // ['/path/to/backups/portfolio-data.json.2024-01-15T10-30-00.backup', ...]
```

### Restore from Backup

```typescript
import { restoreFromBackup, listBackups } from './server/utils/fileOperations'

// Get the most recent backup
const backups = await listBackups('/path/to/portfolio-data.json')
const latestBackup = backups[0]

// Restore from backup
await restoreFromBackup(latestBackup, '/path/to/portfolio-data.json')
```

## How It Works

### Atomic Write Strategy

1. **Acquire Lock**: Prevents concurrent writes to the same file
2. **Create Backup**: Saves current file to backup directory (optional)
3. **Write to Temp File**: Writes data to a temporary file with unique name
4. **Verify Write**: Checks file size matches expected size
5. **Atomic Rename**: Renames temp file to target file (atomic on POSIX systems)
6. **Release Lock**: Allows other operations to proceed

### Retry Logic

If a write operation fails, the utility will:
- Retry up to `maxRetries` times (default: 3)
- Use exponential backoff: `initialDelay * 2^attempt`
- Add random jitter (0-20% of delay) to prevent thundering herd
- Throw `AtomicWriteError` if all retries fail

### Backup Management

- Backups are created with timestamp: `filename.2024-01-15T10-30-00-123.backup`
- Old backups are automatically cleaned up (keeps last 10)
- Cleanup happens asynchronously and doesn't block writes
- Each file has its own set of backups

## Error Handling

### AtomicWriteError

Thrown when write operation fails after all retries:

```typescript
try {
  await writeDataAtomic('/path/to/file.json', data)
} catch (error) {
  if (error instanceof AtomicWriteError) {
    console.error('Failed to write file:', error.message)
    console.error('Caused by:', error.cause)
  }
}
```

### FileLockError

Thrown when unable to acquire file lock (rare):

```typescript
import { FileLockError } from './server/utils/fileOperations'

try {
  await writeDataAtomic('/path/to/file.json', data)
} catch (error) {
  if (error instanceof FileLockError) {
    console.error('Could not acquire file lock:', error.message)
  }
}
```

## Best Practices

1. **Always use atomic writes** for critical data files
2. **Keep backups enabled** for production data
3. **Use custom backup directory** to separate backups from data
4. **Monitor backup disk usage** as backups accumulate
5. **Test restore procedures** regularly
6. **Handle errors appropriately** in your application

## Example: Portfolio Data Service

```typescript
import { writeDataAtomic, readDataWithRetry } from './server/utils/fileOperations'
import path from 'node:path'

const DATA_FILE = path.join(process.cwd(), 'data', 'portfolio-data.json')
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups')

export async function savePortfolioData(data: PortfolioData): Promise<void> {
  // Validate data before writing
  const validated = portfolioSchema.parse(data)
  
  // Add metadata
  validated.metadata = {
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  }
  
  // Write atomically with backup
  await writeDataAtomic(DATA_FILE, JSON.stringify(validated, null, 2), {
    createBackup: true,
    backupDir: BACKUP_DIR,
    maxRetries: 3
  })
}

export async function loadPortfolioData(): Promise<PortfolioData> {
  const data = await readDataWithRetry(DATA_FILE)
  return JSON.parse(data)
}
```

## Testing

Run the test suite:

```bash
npm test server/utils/fileOperations.test.ts
```

Run with coverage:

```bash
npm run test:coverage
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 9.2**: Data validation and integrity before persisting
- **Requirement 9.6**: Atomic updates to prevent partial data corruption

## Related Files

- `server/utils/fileOperations.ts` - Main implementation
- `server/utils/fileOperations.test.ts` - Unit tests
- `data/portfolio-data.json` - Main data file
- `data/backups/` - Backup directory
