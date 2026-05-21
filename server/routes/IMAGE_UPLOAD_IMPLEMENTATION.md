# Image Upload Implementation

## Overview

This document describes the implementation of the image upload endpoint for the Admin Dashboard CRUD feature.

## Endpoint: POST /api/images/upload

### Purpose
Upload image files to the server with validation and unique filename generation.

### Authentication
Requires authentication via the `requireAuth` middleware.

### Request Format
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file` (required): The image file to upload
  - `category` (optional): Category for organizing uploads (default: 'general')

### Validation Rules

1. **File Type Validation**:
   - Accepted MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
   - Invalid file types are rejected with error message

2. **File Size Validation**:
   - Maximum file size: 5MB (5,242,880 bytes)
   - Files exceeding this limit are rejected

3. **Category Validation**:
   - Must contain only alphanumeric characters and hyphens
   - Prevents path traversal attacks

### Filename Generation

Generated filenames follow this pattern:
```
{category}-{timestamp}-{uuid}{extension}
```

Example: `hero-1704067200000-a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`

This ensures:
- Unique filenames (no collisions)
- Easy identification of category
- Chronological ordering
- Original file extension preservation

### Storage Structure

Images are stored in:
```
public/
  uploads/
    {category}/
      {filename}
```

The directory structure is created automatically if it doesn't exist.

### Response Format

**Success (200)**:
```json
{
  "success": true,
  "data": {
    "filename": "hero-1704067200000-uuid.jpg",
    "url": "/uploads/hero/hero-1704067200000-uuid.jpg",
    "size": 12345
  }
}
```

**Error (400/500)**:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Error Handling

- **No file provided**: 400 Bad Request
- **Invalid category**: 400 Bad Request
- **Invalid file type**: 500 Internal Server Error (from multer)
- **File too large**: 500 Internal Server Error (from multer)
- **Server error**: 500 Internal Server Error

## Endpoint: DELETE /api/images/:filename

### Purpose
Delete an uploaded image file.

### Authentication
Requires authentication via the `requireAuth` middleware.

### Request Format
- **Method**: DELETE
- **URL Parameter**: `filename` - The name of the file to delete

### Validation Rules

1. **Filename Format Validation**:
   - Must match pattern: `{category}-{timestamp}-{uuid}.{ext}`
   - Extension must be: jpg, jpeg, png, gif, or webp
   - Prevents path traversal attacks

2. **File Existence Check**:
   - Verifies file exists before attempting deletion
   - Returns 404 if file not found

### Response Format

**Success (200)**:
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Error (400/404/500)**:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Error Handling

- **Invalid filename format**: 400 Bad Request
- **File not found**: 404 Not Found
- **Server error**: 500 Internal Server Error

## Security Considerations

1. **Authentication Required**: Both endpoints require valid authentication
2. **File Type Validation**: Only image files are accepted
3. **File Size Limits**: Prevents DoS attacks via large file uploads
4. **Category Validation**: Prevents path traversal attacks
5. **Filename Validation**: Prevents malicious filename patterns
6. **Unique Filenames**: Prevents overwriting existing files

## Requirements Validation

This implementation satisfies the following requirements:

- **8.1**: Accepts JPG, PNG, GIF, and WebP formats ✓
- **8.2**: Validates file size (max 5MB) ✓
- **8.3**: Generates unique filenames with timestamp and UUID ✓
- **8.4**: Saves to public/uploads/{category}/ directory ✓
- Returns filename and public URL ✓

## Testing

Comprehensive unit tests cover:
- Valid image uploads (JPG, PNG)
- File type validation
- File size validation
- Missing file handling
- Category validation
- Unique filename generation
- Directory creation
- Image deletion
- Invalid filename handling
- Non-existent file handling

All tests pass successfully.

## Dependencies

- **multer**: Handles multipart/form-data file uploads
- **uuid**: Generates unique identifiers for filenames
- **fs/promises**: Async file system operations
- **path**: Path manipulation utilities

## Integration

The image routes are registered in `server/index.ts`:
```typescript
import imageRoutes from './routes/images'
app.use('/api/images', imageRoutes)
```

## Frontend Integration

The frontend `imageService` is already configured to use these endpoints:
- Upload: `POST /api/images/upload`
- Delete: `DELETE /api/images/:filename`

The service handles FormData creation and includes the category parameter.
