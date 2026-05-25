<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import TextArea from '@/components/admin/forms/TextArea.vue'
import ArrayInput from '@/components/admin/forms/ArrayInput.vue'
import ImageUpload from '@/components/admin/forms/ImageUpload.vue'
import AdminSectionPreview from '@/components/admin/AdminSectionPreview.vue'
import AboutSection from '@/components/AboutSection.vue'
import { useContentStore } from '@/stores/content'
import { useUiStore } from '@/stores/ui'
import { uploadImage } from '@/services/imageService'
import type { AboutContent } from '@/types'

// ── Stores ────────────────────────────────────────────────────────────────────

const contentStore = useContentStore()
const uiStore = useUiStore()

// ── Local form state ──────────────────────────────────────────────────────────

/** Working copy of the about data being edited */
const formData = ref<AboutContent>({
  paragraphs: [],
  skills: [],
  aboutImage: ''
})

/** Snapshot of the last saved state — used to detect dirty state */
const savedSnapshot = ref<string>('')

/** Pending image file selected by the user (not yet uploaded) */
const pendingImageFile = ref<File | null>(null)
const pendingImagePreview = ref<string>('')

/** Validation errors keyed by field name */
const validationErrors = ref<Record<string, string>>({})

/** Whether a save operation is in progress */
const isSaving = ref(false)

// ── Computed ──────────────────────────────────────────────────────────────────

/** True when the form has unsaved changes */
const isDirty = computed<boolean>(() => {
  const current = JSON.stringify(formData.value)
  return current !== savedSnapshot.value || pendingImageFile.value !== null
})

/** True when there are no validation errors */
const isValid = computed<boolean>(() => Object.keys(validationErrors.value).length === 0)

/** True when the save button should be enabled */
const canSave = computed<boolean>(() => isDirty.value && isValid.value && !isSaving.value)

const previewAbout = computed<AboutContent>(() => ({
  ...formData.value,
  aboutImage: pendingImagePreview.value || formData.value.aboutImage,
}))

watch(pendingImageFile, (file) => {
  if (pendingImagePreview.value) {
    URL.revokeObjectURL(pendingImagePreview.value)
    pendingImagePreview.value = ''
  }
  if (file) {
    pendingImagePreview.value = URL.createObjectURL(file)
  }
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadAboutData()
})

// ── Data loading ──────────────────────────────────────────────────────────────

/**
 * Load about data from the content store.
 * If the store hasn't loaded content yet, trigger a full load first.
 */
async function loadAboutData(): Promise<void> {
  if (!contentStore.about) {
    await contentStore.loadContent()
  }

  if (contentStore.about) {
    applyStoreData(contentStore.about)
  }
}

/** Copy store data into the local form and take a snapshot */
function applyStoreData(data: AboutContent): void {
  formData.value = {
    paragraphs: [...data.paragraphs],
    skills: [...data.skills],
    aboutImage: data.aboutImage
  }
  savedSnapshot.value = JSON.stringify(formData.value)
  pendingImageFile.value = null
  validationErrors.value = {}
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate all form fields.
 * Returns true when the form is valid.
 */
function validateFields(): boolean {
  const errors: Record<string, string> = {}

  // At least one paragraph is required and none may be blank
  if (formData.value.paragraphs.length === 0) {
    errors['paragraphs'] = 'At least one biography paragraph is required.'
  } else {
    const hasBlank = formData.value.paragraphs.some(p => p.trim() === '')
    if (hasBlank) {
      errors['paragraphs'] = 'Paragraphs cannot be empty. Remove blank entries before saving.'
    }
  }

  // Skills list must have at least one entry
  if (formData.value.skills.length === 0) {
    errors['skills'] = 'At least one skill is required.'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

/** Validate a single paragraph by index and update errors accordingly */
function validateParagraph(index: number): void {
  const value = formData.value.paragraphs[index] ?? ''
  const key = `paragraph_${index}`

  if (value.trim() === '') {
    validationErrors.value = { ...validationErrors.value, [key]: 'Paragraph cannot be empty.' }
  } else {
    const updated = { ...validationErrors.value }
    delete updated[key]
    // Also clear the general paragraphs error if all are now valid
    const hasBlank = formData.value.paragraphs.some(p => p.trim() === '')
    if (!hasBlank) delete updated['paragraphs']
    validationErrors.value = updated
  }
}

// ── Paragraph helpers ─────────────────────────────────────────────────────────

/** Add a new empty paragraph */
function addParagraph(): void {
  formData.value.paragraphs = [...formData.value.paragraphs, '']
}

/** Remove a paragraph by index */
function removeParagraph(index: number): void {
  formData.value.paragraphs = formData.value.paragraphs.filter((_, i) => i !== index)
  // Clean up per-paragraph validation errors
  const updated = { ...validationErrors.value }
  delete updated[`paragraph_${index}`]
  validationErrors.value = updated
}

/** Update a single paragraph value (preserves formatting) */
function updateParagraph(index: number, value: string): void {
  const updated = [...formData.value.paragraphs]
  updated[index] = value // preserve raw value including line breaks / spacing
  formData.value.paragraphs = updated
}

// ── Image handling ────────────────────────────────────────────────────────────

/** Called when the user selects a new image in the ImageUpload component */
function handleImageUpload(file: File): void {
  pendingImageFile.value = file
}

/** Called when the user removes the current image */
function handleImageRemove(): void {
  pendingImageFile.value = null
  formData.value.aboutImage = ''
}

// ── Save ──────────────────────────────────────────────────────────────────────

/**
 * Validate, optionally upload a new image, then persist via the content store.
 * Requirements: 3.2, 3.5, 3.6
 */
async function handleSave(): Promise<void> {
  if (!validateFields()) {
    uiStore.showNotification('error', 'Please fix the validation errors before saving.')
    return
  }

  isSaving.value = true

  try {
    // ── 1. Upload new image if one was selected ──────────────────────────────
    if (pendingImageFile.value) {
      const uploadResult = await uploadImage(pendingImageFile.value, 'about')

      if (!uploadResult.success || !uploadResult.data) {
        uiStore.showNotification(
          'error',
          uploadResult.error ?? 'Image upload failed. Please try again.'
        )
        return
      }

      // Update the image reference with the newly uploaded URL
      formData.value.aboutImage = uploadResult.data.url
      pendingImageFile.value = null
    }

    // ── 2. Build the payload — paragraphs are stored as-is to preserve formatting ──
    const payload: AboutContent = {
      paragraphs: formData.value.paragraphs, // raw strings, formatting preserved
      skills: [...formData.value.skills],
      aboutImage: formData.value.aboutImage
    }

    // ── 3. Persist via content store ─────────────────────────────────────────
    const success = await contentStore.updateAbout(payload)

    if (success) {
      // Update snapshot so isDirty resets to false
      savedSnapshot.value = JSON.stringify(formData.value)
      uiStore.showNotification('success', 'About section saved successfully.')
    } else {
      uiStore.showNotification(
        'error',
        contentStore.error ?? 'Failed to save about section. Please try again.'
      )
    }
  } catch (err) {
    uiStore.showNotification(
      'error',
      err instanceof Error ? err.message : 'An unexpected error occurred.'
    )
  } finally {
    isSaving.value = false
  }
}

// ── Cancel ────────────────────────────────────────────────────────────────────

/** Discard all unsaved changes and reload from the store */
function handleCancel(): void {
  if (contentStore.about) {
    applyStoreData(contentStore.about)
  }
}

// ── Unsaved-changes guard ─────────────────────────────────────────────────────

onBeforeRouteLeave((_to, _from, next) => {
  if (isDirty.value) {
    const confirmed = window.confirm(
      'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
    )
    next(confirmed)
  } else {
    next()
  }
})

// Warn on browser tab close / refresh
function handleBeforeUnload(event: BeforeUnloadEvent): void {
  if (isDirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))
onBeforeUnmount(() => {
  if (pendingImagePreview.value) {
    URL.revokeObjectURL(pendingImagePreview.value)
  }
})
</script>

<template>
  <div class="about-editor">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="editor-header">
      <div class="editor-header__title-group">
        <h1 class="editor-header__title">About Section</h1>
        <span v-if="isDirty" class="editor-header__dirty-badge" aria-label="Unsaved changes">
          Unsaved changes
        </span>
      </div>

      <div class="editor-header__actions">
        <button
          type="button"
          class="btn btn--secondary"
          :disabled="isSaving"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn--primary"
          :disabled="!canSave"
          :aria-disabled="!canSave"
          @click="handleSave"
        >
          <span v-if="isSaving" class="btn__spinner" aria-hidden="true" />
          {{ isSaving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- ── Loading state ──────────────────────────────────────────────────── -->
    <div v-if="contentStore.isLoading && !formData.paragraphs.length" class="loading-state">
      <span class="loading-state__spinner" aria-hidden="true" />
      <p>Loading about section…</p>
    </div>

    <!-- ── Form ───────────────────────────────────────────────────────────── -->
    <form
      v-else
      class="editor-form"
      novalidate
      @submit.prevent="handleSave"
    >
      <div class="editor-workspace">
        <div class="editor-fields">
      <!-- ── Biography Paragraphs ──────────────────────────────────────── -->
      <section class="form-section" aria-labelledby="paragraphs-heading">
        <div class="form-section__header">
          <h2 id="paragraphs-heading" class="form-section__title">Biography Paragraphs</h2>
          <p class="form-section__description">
            Each paragraph is displayed independently. Formatting (line breaks, spacing) is preserved.
          </p>
        </div>

        <!-- General paragraphs error -->
        <p
          v-if="validationErrors['paragraphs']"
          class="field-error"
          role="alert"
        >
          {{ validationErrors['paragraphs'] }}
        </p>

        <div class="paragraphs-list">
          <div
            v-for="(paragraph, index) in formData.paragraphs"
            :key="index"
            class="paragraph-item"
          >
            <div class="paragraph-item__header">
              <span class="paragraph-item__label">Paragraph {{ index + 1 }}</span>
              <button
                type="button"
                class="btn-icon btn-icon--danger"
                :aria-label="`Remove paragraph ${index + 1}`"
                @click="removeParagraph(index)"
              >
                ✕
              </button>
            </div>

            <TextArea
              :model-value="paragraph"
              :placeholder="`Write paragraph ${index + 1}…`"
              :rows="4"
              :error="validationErrors[`paragraph_${index}`]"
              @update:model-value="updateParagraph(index, $event)"
              @blur="validateParagraph(index)"
            />
          </div>

          <!-- Empty state -->
          <p v-if="formData.paragraphs.length === 0" class="empty-state">
            No paragraphs yet. Add one below.
          </p>
        </div>

        <button
          type="button"
          class="btn btn--outline btn--sm"
          @click="addParagraph"
        >
          + Add Paragraph
        </button>
      </section>

      <!-- ── Skills List ───────────────────────────────────────────────── -->
      <section class="form-section" aria-labelledby="skills-heading">
        <div class="form-section__header">
          <h2 id="skills-heading" class="form-section__title">Skills List</h2>
          <p class="form-section__description">
            Skills displayed in the About section. Drag to reorder.
          </p>
        </div>

        <ArrayInput
          v-model="formData.skills"
          label="Skills"
          placeholder="Add a skill (e.g. TypeScript)…"
          add-button-text="Add Skill"
        />

        <p
          v-if="validationErrors['skills']"
          class="field-error"
          role="alert"
        >
          {{ validationErrors['skills'] }}
        </p>
      </section>

      <!-- ── About Image ───────────────────────────────────────────────── -->
      <section class="form-section" aria-labelledby="image-heading">
        <div class="form-section__header">
          <h2 id="image-heading" class="form-section__title">About Image</h2>
          <p class="form-section__description">
            The image displayed alongside your biography. Max 5 MB. JPG, PNG, GIF, or WebP.
          </p>
        </div>

        <ImageUpload
          :current-image="formData.aboutImage"
          :max-size="5"
          @upload="handleImageUpload"
          @remove="handleImageRemove"
        />
      </section>

      <!-- ── Bottom action bar ─────────────────────────────────────────── -->
      <div class="editor-actions">
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
          :disabled="!canSave"
          :aria-disabled="!canSave"
        >
          <span v-if="isSaving" class="btn__spinner" aria-hidden="true" />
          {{ isSaving ? 'Saving…' : 'Save Changes' }}
        </button>
      </div>
        </div>

        <AdminSectionPreview
          title="About section"
          subtitle="Teks, skill, dan foto yang kamu ubah akan langsung muncul di sini."
        >
          <AboutSection :about="previewAbout" />
        </AdminSectionPreview>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.about-editor {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: none;
  padding: 1.5rem;
}

/* ── Editor header ───────────────────────────────────────────────────────── */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.editor-header__title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.editor-header__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.editor-header__dirty-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background-color: rgba(234, 179, 8, 0.15);
  color: #ca8a04;
  border: 1px solid rgba(234, 179, 8, 0.4);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.editor-header__actions {
  display: flex;
  gap: 0.75rem;
}

/* ── Loading state ───────────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.loading-state__spinner {
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

/* ── Form sections ───────────────────────────────────────────────────────── */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: var(--color-background-secondary, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
}

.form-section__header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-section__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-section__description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* ── Paragraphs list ─────────────────────────────────────────────────────── */
.paragraphs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.paragraph-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.paragraph-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.paragraph-item__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.empty-state {
  margin: 0;
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-align: center;
  border: 1px dashed var(--color-border, #e2e8f0);
  border-radius: 8px;
}

/* ── Validation error ────────────────────────────────────────────────────── */
.field-error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-accent, #ec4899);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-error::before {
  content: '⚠';
}

/* ── Bottom action bar ───────────────────────────────────────────────────── */
.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    opacity 0.2s ease;
  white-space: nowrap;
}

.btn:disabled,
.btn[aria-disabled='true'] {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn--primary {
  background-color: var(--color-primary, #a855f7);
  color: #ffffff;
}

.btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #7c3aed);
}

.btn--secondary {
  background-color: var(--color-background-secondary, #f1f5f9);
  color: var(--color-text, #1e293b);
  border: 1px solid var(--color-border, #e2e8f0);
}

.btn--secondary:hover:not(:disabled) {
  background-color: var(--color-border, #e2e8f0);
}

.btn--outline {
  background-color: transparent;
  color: var(--color-primary, #a855f7);
  border: 1px solid var(--color-primary, #a855f7);
}

.btn--outline:hover:not(:disabled) {
  background-color: rgba(168, 85, 247, 0.08);
}

.btn--sm {
  padding: 0.4rem 0.875rem;
  font-size: 0.875rem;
}

/* ── Icon button ─────────────────────────────────────────────────────────── */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.btn-icon--danger {
  color: var(--color-text-secondary);
}

.btn-icon--danger:hover {
  color: var(--color-accent, #ec4899);
  background-color: rgba(236, 72, 153, 0.1);
}

/* ── Spinner ─────────────────────────────────────────────────────────────── */
.btn__spinner {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

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

@media (max-width: 640px) {
  .about-editor {
    padding: 1rem;
  }

  .editor-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .editor-header__actions,
  .editor-actions {
    width: 100%;
    justify-content: stretch;
  }

  .editor-header__actions .btn,
  .editor-actions .btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
