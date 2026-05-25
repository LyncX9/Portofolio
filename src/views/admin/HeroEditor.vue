<script setup lang="ts">
import { ref, reactive, computed, watch, inject, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import TextInput from '@/components/admin/forms/TextInput.vue'
import ImageUpload from '@/components/admin/forms/ImageUpload.vue'
import AdminSectionPreview from '@/components/admin/AdminSectionPreview.vue'
import HeroSection from '@/components/HeroSection.vue'
import { useContentStore } from '@/stores/content'
import { useUiStore } from '@/stores/ui'
import { imageService } from '@/services/imageService'
import type { HeroContent } from '@/types'
import { heroSchema, getValidationErrors } from '@/types/schemas'

// ─── Stores ───────────────────────────────────────────────────────────────────

const contentStore = useContentStore()
const uiStore = useUiStore()

// ─── Unsaved-changes integration with AdminDashboard ─────────────────────────

const setUnsavedChanges = inject<(value: boolean) => void>('setUnsavedChanges')

// ─── State ────────────────────────────────────────────────────────────────────

/** Working copy of hero data — edited in the form */
const form = reactive<HeroContent>({
  greeting: '',
  name: '',
  title: '',
  description: '',
  bio: '',
  profileImage: '',
  universityLink: ''
})

/** Snapshot of the last saved / loaded data for dirty-state comparison */
const savedSnapshot = ref<HeroContent | null>(null)

/** Pending image file selected by the user (not yet uploaded) */
const pendingImageFile = ref<File | null>(null)
const pendingImagePreview = ref<string>('')

/** Inline validation errors keyed by field name */
const validationErrors = reactive<Record<string, string>>({})

/** Whether a save operation is in progress */
const isSaving = ref(false)

// ─── Computed ─────────────────────────────────────────────────────────────────

/** True when the form differs from the last saved snapshot */
const isDirty = computed<boolean>(() => {
  if (!savedSnapshot.value) return false
  if (pendingImageFile.value) return true
  return (Object.keys(form) as (keyof HeroContent)[]).some(
    (key) => form[key] !== savedSnapshot.value![key]
  )
})

/** True when there are any validation errors */
const hasErrors = computed<boolean>(() => Object.keys(validationErrors).length > 0)

/** Save button is disabled while saving or when there are validation errors */
const isSaveDisabled = computed<boolean>(() => isSaving.value || hasErrors.value)

const previewHero = computed<HeroContent>(() => ({
  ...form,
  profileImage: pendingImagePreview.value || form.profileImage,
}))

// ─── Sync dirty state with AdminDashboard ─────────────────────────────────────

watch(isDirty, (value) => {
  setUnsavedChanges?.(value)
})

watch(pendingImageFile, (file) => {
  if (pendingImagePreview.value) {
    URL.revokeObjectURL(pendingImagePreview.value)
    pendingImagePreview.value = ''
  }
  if (file) {
    pendingImagePreview.value = URL.createObjectURL(file)
  }
})

// ─── Load ─────────────────────────────────────────────────────────────────────

function applyHeroData(data: HeroContent): void {
  form.greeting = data.greeting
  form.name = data.name
  form.title = data.title
  form.description = data.description
  form.bio = data.bio
  form.profileImage = data.profileImage
  form.universityLink = data.universityLink
  savedSnapshot.value = { ...data }
}

async function loadHeroData(): Promise<void> {
  // If the store already has hero data, use it directly
  if (contentStore.hero) {
    applyHeroData(contentStore.hero)
    return
  }

  // Otherwise fetch from the API
  await contentStore.loadContent()

  if (contentStore.hero) {
    applyHeroData(contentStore.hero)
  } else if (contentStore.error) {
    uiStore.showNotification('error', `Failed to load hero data: ${contentStore.error}`)
  }
}

onMounted(loadHeroData)

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFields(): boolean {
  // Clear previous errors
  Object.keys(validationErrors).forEach((key) => delete validationErrors[key])

  const result = heroSchema.safeParse({
    ...form,
    profileImage: pendingImageFile.value ? (form.profileImage || '/images/profile.jpg') : form.profileImage,
  })

  if (!result.success) {
    const errors = getValidationErrors(result.error)
    if (errors.profileImage) {
      errors.profileImage = 'Upload a profile photo before saving.'
    }
    Object.assign(validationErrors, errors)
    return false
  }

  return true
}

/** Validate a single field on blur */
function validateField(field: keyof HeroContent): void {
  // Re-run full schema but only surface the error for this field
  const result = heroSchema.safeParse({
    ...form,
    profileImage: pendingImageFile.value ? (form.profileImage || '/images/profile.jpg') : form.profileImage,
  })

  if (result.success) {
    delete validationErrors[field]
  } else {
    const errors = getValidationErrors(result.error)
    if (errors[field]) {
      validationErrors[field] = field === 'profileImage' ? 'Upload a profile photo before saving.' : errors[field]
    } else {
      delete validationErrors[field]
    }
  }
}

// ─── Image handling ───────────────────────────────────────────────────────────

function handleImageUpload(file: File): void {
  pendingImageFile.value = file
  // Clear any previous profileImage validation error since a new file is staged
  delete validationErrors['profileImage']
}

function handleImageRemove(): void {
  pendingImageFile.value = null
  form.profileImage = ''
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function handleSave(): Promise<void> {
  // 1. Validate all fields
  if (!validateFields()) {
    uiStore.showNotification('error', 'Please fix the validation errors before saving.')
    return
  }

  isSaving.value = true

  try {
    // 2. Upload new image if one was selected
    if (pendingImageFile.value) {
      const oldFilename = extractFilename(form.profileImage)

      let uploadResponse

      if (oldFilename) {
        uploadResponse = await imageService.replaceImage(
          oldFilename,
          pendingImageFile.value,
          'hero',
          (percent) => {
            // Progress is handled inside ImageUpload component; nothing extra needed here
            void percent
          }
        )
      } else {
        uploadResponse = await imageService.uploadImage(
          pendingImageFile.value,
          'hero'
        )
      }

      if (!uploadResponse.success || !uploadResponse.data) {
        uiStore.showNotification(
          'error',
          uploadResponse.error ?? 'Image upload failed. Please try again.'
        )
        return
      }

      // 3. Update the image reference in the form data
      form.profileImage = uploadResponse.data.url
      pendingImageFile.value = null
    }

    // 4. Persist to the store / API
    const success = await contentStore.updateHero({ ...form })

    if (success) {
      // 5. Reset dirty state
      savedSnapshot.value = { ...form }
      setUnsavedChanges?.(false)
      uiStore.showNotification('success', 'Hero section saved successfully.')
    } else {
      uiStore.showNotification(
        'error',
        contentStore.error ?? 'Failed to save hero section. Please try again.'
      )
    }
  } finally {
    isSaving.value = false
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

function handleCancel(): void {
  if (savedSnapshot.value) {
    applyHeroData(savedSnapshot.value)
  }
  pendingImageFile.value = null
  Object.keys(validationErrors).forEach((key) => delete validationErrors[key])
}

// ─── Navigation guard ─────────────────────────────────────────────────────────

onBeforeRouteLeave(() => {
  if (isDirty.value) {
    return window.confirm('You have unsaved changes. Are you sure you want to leave?')
  }
})

// ─── Cleanup ──────────────────────────────────────────────────────────────────

onBeforeUnmount(() => {
  setUnsavedChanges?.(false)
  if (pendingImagePreview.value) {
    URL.revokeObjectURL(pendingImagePreview.value)
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the bare filename from a URL or path.
 * Returns an empty string if the input is empty or not a recognisable path.
 */
function extractFilename(url: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/')
    return parts[parts.length - 1] ?? ''
  } catch {
    // Not a full URL — treat as a path
    const parts = url.split('/')
    return parts[parts.length - 1] ?? ''
  }
}
</script>

<template>
  <div class="hero-editor">
    <!-- Page header -->
    <div class="editor-header">
      <h1 class="editor-title">Hero Section</h1>
      <p class="editor-subtitle">Edit your name, title, description, and upload your profile photo.</p>
    </div>

    <!-- Loading state while fetching initial data -->
    <div v-if="contentStore.isLoading && !savedSnapshot" class="loading-state" aria-live="polite">
      <span class="loading-spinner" aria-hidden="true"></span>
      Loading hero data…
    </div>

    <!-- Editor form -->
    <form
      v-else
      class="editor-form"
      novalidate
      @submit.prevent="handleSave"
    >
      <div class="editor-workspace">
        <div class="editor-fields">
      <!-- ── Profile image ──────────────────────────────────────────────── -->
      <section class="form-section">
        <h2 class="section-title">Profile Image</h2>
        <ImageUpload
          :current-image="form.profileImage"
          :max-size="5"
          @upload="handleImageUpload"
          @remove="handleImageRemove"
        />
        <p v-if="validationErrors['profileImage']" class="field-error" role="alert">
          {{ validationErrors['profileImage'] }}
        </p>
      </section>

      <!-- ── Text fields ───────────────────────────────────────────────── -->
      <section class="form-section">
        <h2 class="section-title">Content</h2>

        <div class="form-grid">
          <!-- Greeting -->
          <TextInput
            v-model="form.greeting"
            label="Greeting"
            placeholder="e.g. Hi, I'm"
            :required="true"
            :error="validationErrors['greeting']"
            @blur="validateField('greeting')"
          />

          <!-- Name -->
          <TextInput
            v-model="form.name"
            label="Name"
            placeholder="e.g. Jane Doe"
            :required="true"
            :error="validationErrors['name']"
            @blur="validateField('name')"
          />

          <!-- Title -->
          <TextInput
            v-model="form.title"
            label="Title"
            placeholder="e.g. Full-Stack Developer"
            :required="true"
            :error="validationErrors['title']"
            @blur="validateField('title')"
          />

          <!-- Description -->
          <TextInput
            v-model="form.description"
            label="Description"
            placeholder="Short tagline or description"
            :required="true"
            :error="validationErrors['description']"
            @blur="validateField('description')"
          />

          <!-- Bio -->
          <div class="full-width">
            <TextInput
              v-model="form.bio"
              label="Bio"
              placeholder="A brief biography shown in the hero section"
              :required="true"
              :error="validationErrors['bio']"
              @blur="validateField('bio')"
            />
          </div>

          <!-- University Link -->
          <TextInput
            v-model="form.universityLink"
            label="University Link"
            placeholder="https://university.edu"
            :required="true"
            :error="validationErrors['universityLink']"
            @blur="validateField('universityLink')"
          />
        </div>
      </section>

      <!-- ── Action buttons ────────────────────────────────────────────── -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn--secondary"
          :disabled="isSaving"
          @click="handleCancel"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="btn btn--primary"
          :disabled="isSaveDisabled"
          :aria-busy="isSaving"
        >
          <span v-if="isSaving" class="btn-spinner" aria-hidden="true"></span>
          {{ isSaving ? 'Saving…' : 'Save Changes' }}
        </button>
      </div>

      <!-- Dirty-state indicator -->
      <p v-if="isDirty && !isSaving" class="dirty-indicator" role="status" aria-live="polite">
        You have unsaved changes.
      </p>
        </div>

        <AdminSectionPreview
          title="Hero section"
          subtitle="Preview ini ikut berubah saat kamu mengetik atau memilih foto baru."
        >
          <HeroSection :hero="previewHero" />
        </AdminSectionPreview>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.hero-editor {
  max-width: none;
}

.editor-header {
  margin-bottom: 2rem;
}

.editor-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.375rem;
}

.editor-subtitle {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* ── Loading ─────────────────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

.loading-spinner {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ── Form ────────────────────────────────────────────────────────────────── */
.editor-form {
  display: block;
}

.editor-workspace {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(min(560px, 100%), 1.1fr);
  gap: 1.5rem;
  align-items: start;
}

.editor-fields {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.full-width {
  grid-column: 1 / -1;
}

/* ── Field error (used below ImageUpload) ────────────────────────────────── */
.field-error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-accent);
}

/* ── Actions ─────────────────────────────────────────────────────────────── */
.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    opacity 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background-color: var(--color-primary);
  color: #ffffff;
}

.btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover, #7c3aed);
}

.btn--secondary {
  background-color: var(--color-background-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover:not(:disabled) {
  background-color: var(--color-border);
}

/* ── Button spinner ──────────────────────────────────────────────────────── */
.btn-spinner {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ── Dirty indicator ─────────────────────────────────────────────────────── */
.dirty-indicator {
  text-align: right;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* ── Keyframes ───────────────────────────────────────────────────────────── */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .editor-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: 1;
  }

  .form-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .btn {
    justify-content: center;
  }
}
</style>
