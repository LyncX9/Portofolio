# Validation Schemas and Utilities Usage Guide

This document provides examples of how to use the Zod validation schemas and utility functions defined in `schemas.ts`.

## Available Schemas

- `heroSchema` - Validates Hero section content
- `aboutSchema` - Validates About section content
- `skillSchema` - Validates individual skills
- `projectSchema` - Validates project data
- `experienceSchema` - Validates experience entries
- `contactSchema` - Validates contact information
- `socialLinkSchema` - Validates social media links
- `emailSchema` - Validates email addresses
- `urlSchema` - Validates URLs
- `authCredentialsSchema` - Validates authentication credentials
- `portfolioDataSchema` - Validates complete portfolio data structure

## Validation Utility Functions

### 1. validateData()

Validates data against a schema and returns a result object with success status.

```typescript
import { validateData, heroSchema } from '@/types/schemas'

const heroData = {
  greeting: 'Hello',
  name: 'John Doe',
  title: 'Developer',
  description: 'A passionate developer',
  bio: 'I love coding',
  profileImage: 'https://example.com/image.jpg',
  universityLink: 'https://university.edu'
}

const result = validateData(heroSchema, heroData)

if (result.success) {
  console.log('Valid data:', result.data)
} else {
  console.log('Validation errors:', result.errors)
}
```

### 2. validateDataStrict()

Validates data and throws an error if validation fails. Use in try-catch blocks.

```typescript
import { validateDataStrict, projectSchema } from '@/types/schemas'

try {
  const validatedProject = validateDataStrict(projectSchema, projectData)
  // Use validatedProject safely
} catch (error) {
  console.error('Validation failed:', error)
}
```

### 3. getValidationErrors()

Extracts user-friendly error messages from Zod validation errors.

```typescript
import { validateData, heroSchema, getValidationErrors } from '@/types/schemas'

const result = validateData(heroSchema, invalidData)

if (!result.success) {
  const errors = getValidationErrors(result.errors)
  // errors = { 'greeting': 'Greeting is required', 'profileImage': 'Must be a valid URL' }
  
  // Display errors in UI
  Object.entries(errors).forEach(([field, message]) => {
    console.log(`${field}: ${message}`)
  })
}
```

### 4. validateField()

Validates a single field against a schema.

```typescript
import { validateField, emailSchema } from '@/types/schemas'

const emailError = validateField(emailSchema, 'user@example.com')
if (emailError) {
  console.log('Email error:', emailError)
} else {
  console.log('Email is valid')
}
```

### 5. validateEmail()

Convenience function to validate email addresses.

```typescript
import { validateEmail } from '@/types/schemas'

const error = validateEmail('user@example.com')
if (error) {
  console.log('Invalid email:', error)
}
```

### 6. validateUrl()

Convenience function to validate URLs.

```typescript
import { validateUrl } from '@/types/schemas'

const error = validateUrl('https://example.com')
if (error) {
  console.log('Invalid URL:', error)
}
```

### 7. validateRequired()

Validates that a string is not empty (after trimming).

```typescript
import { validateRequired } from '@/types/schemas'

const error = validateRequired(username, 'Username')
if (error) {
  console.log(error) // "Username is required"
}
```

### 8. validateArrayNotEmpty()

Validates that an array contains at least one item.

```typescript
import { validateArrayNotEmpty } from '@/types/schemas'

const error = validateArrayNotEmpty(skills, 'Skills')
if (error) {
  console.log(error) // "Skills must contain at least one item"
}
```

### 9. validateMultiple()

Validates multiple fields and returns all error messages.

```typescript
import { validateMultiple, validateRequired, validateEmail, validateUrl } from '@/types/schemas'

const errors = validateMultiple([
  () => validateRequired(name, 'Name'),
  () => validateEmail(email),
  () => validateUrl(website)
])

if (errors.length > 0) {
  console.log('Validation errors:', errors)
}
```

### 10. isValidUrl()

Checks if a value is a valid URL (returns boolean).

```typescript
import { isValidUrl } from '@/types/schemas'

if (isValidUrl('https://example.com')) {
  console.log('Valid URL')
}
```

### 11. isValidEmail()

Checks if a value is a valid email (returns boolean).

```typescript
import { isValidEmail } from '@/types/schemas'

if (isValidEmail('user@example.com')) {
  console.log('Valid email')
}
```

## Usage in Vue Components

### Example: Form Validation in a Component

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { validateData, heroSchema, getValidationErrors } from '@/types/schemas'
import type { HeroContent } from '@/types'

const heroData = ref<HeroContent>({
  greeting: '',
  name: '',
  title: '',
  description: '',
  bio: '',
  profileImage: '',
  universityLink: ''
})

const validationErrors = ref<Record<string, string>>({})

const isValid = computed(() => {
  return Object.keys(validationErrors.value).length === 0
})

function validateForm() {
  const result = validateData(heroSchema, heroData.value)
  
  if (result.success) {
    validationErrors.value = {}
    return true
  } else {
    validationErrors.value = getValidationErrors(result.errors)
    return false
  }
}

function handleSubmit() {
  if (validateForm()) {
    // Submit the form
    console.log('Form is valid, submitting...')
  } else {
    console.log('Form has errors:', validationErrors.value)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="heroData.name" type="text" placeholder="Name" />
      <span v-if="validationErrors.name" class="error">
        {{ validationErrors.name }}
      </span>
    </div>
    
    <div>
      <input v-model="heroData.profileImage" type="text" placeholder="Profile Image URL" />
      <span v-if="validationErrors.profileImage" class="error">
        {{ validationErrors.profileImage }}
      </span>
    </div>
    
    <button type="submit" :disabled="!isValid">Submit</button>
  </form>
</template>
```

### Example: Real-time Field Validation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { validateEmail, validateUrl } from '@/types/schemas'

const email = ref('')
const emailError = ref<string | null>(null)

const website = ref('')
const websiteError = ref<string | null>(null)

function validateEmailField() {
  emailError.value = validateEmail(email.value)
}

function validateWebsiteField() {
  websiteError.value = validateUrl(website.value)
}
</script>

<template>
  <div>
    <input 
      v-model="email" 
      type="email" 
      placeholder="Email"
      @blur="validateEmailField"
    />
    <span v-if="emailError" class="error">{{ emailError }}</span>
  </div>
  
  <div>
    <input 
      v-model="website" 
      type="url" 
      placeholder="Website"
      @blur="validateWebsiteField"
    />
    <span v-if="websiteError" class="error">{{ websiteError }}</span>
  </div>
</template>
```

## Type Inference

All schemas export TypeScript types that can be used throughout your application:

```typescript
import type { 
  HeroSchemaType, 
  ProjectSchemaType, 
  SkillSchemaType 
} from '@/types/schemas'

// These types are inferred from the Zod schemas
const hero: HeroSchemaType = {
  greeting: 'Hello',
  name: 'John Doe',
  // ... TypeScript will enforce the correct structure
}
```

## Best Practices

1. **Use `validateData()` for user input** - It provides detailed error messages without throwing exceptions
2. **Use `validateDataStrict()` for API responses** - Throw errors for unexpected data structures
3. **Use `getValidationErrors()` to display errors in forms** - Convert Zod errors to user-friendly messages
4. **Use convenience functions for common validations** - `validateEmail()`, `validateUrl()`, etc.
5. **Validate on blur for better UX** - Don't validate on every keystroke
6. **Combine validations with `validateMultiple()`** - Validate multiple fields at once
7. **Use boolean helpers for conditional logic** - `isValidEmail()`, `isValidUrl()`

## Error Message Customization

All schemas include custom error messages. You can customize them by modifying the schema definitions in `schemas.ts`:

```typescript
// Example: Custom error message
export const heroSchema = z.object({
  name: z.string().min(1, 'Please enter your name'), // Custom message
  // ...
})
```
