<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import TextInput from '@/components/admin/forms/TextInput.vue'
import { useContentStore } from '@/stores/content'
import { useUiStore } from '@/stores/ui'
import type { ContactContent, SocialLink } from '@/types'
import { contactSchema, socialLinkSchema, getValidationErrors } from '@/types/schemas'

// ─── Stores ───────────────────────────────────────────────────────────────────

const contentStore = useContentStore()
const uiStore = useUiStore()

// ─── State ────────────────────────────────────────────────────────────────────

/** Working copy of contact data being edited */
const formData = ref<ContactContent>({
  email: '',
  subtitle: '',
  socialLinks: []
})

/** Snapshot of the last saved state — used to detect dirty state */
const savedSnapshot = ref<string>('')

/** Validation errors keyed by field name */
const validationErrors = ref<Record<string, string>>({})

/** Whether a save operation is in progress */
const isSaving = ref(false)

/** Controls visibility of the add/edit social link form */
const showSocialLinkForm = ref(false)

/** Index of the social link being edited (-1 means creating new) */
const editingLinkIndex = ref<number>(-1)

/** Working copy of the social link being added or edited */
const socialLinkForm = ref<Omit<SocialLink, 'id'>>({
  icon: '',
  label: '',
  href: ''
})

/** Validation errors for the social link sub-form */
const socialLinkErrors = ref<Record<string, string>>({})

// ─── Computed ─────────────────────────────────────────────────────────────────

/** True when the form has unsaved changes */
const isDirty = computed<boolean>(() => {
  const current = JSON.stringify(formData.value)
  return current !== savedSnapshot.value
})

/** True when there are no validation errors */
const isValid = computed<boolean>(() => Object.keys(validationErrors.value).length === 0)

/** True when the save button should be enabled */
const canSave = computed<boolean>(() => isDirty.value && isValid.value && !isSaving.value)

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadContactData()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadContactData(): Promise<void> {
  if (!contentStore.contact) {
    await contentStore.loadContent()
  }

  if (contentStore.contact) {
    applyStoreData(contentStore.contact)
  } else if (contentStore.error) {
    uiStore.showNotification('error', `Failed to load contact data: ${contentStore.error}`)
  }
}

/** Copy store data into the local form and take a snapshot */
function applyStoreData(data: ContactContent): void {
  formData.value = {
    email: data.email,
    subtitle: data.subtitle,
    socialLinks: data.socialLinks.map(link => ({ ...link }))
  }
  savedSnapshot.value = JSON.stringify(formData.value)
  validationErrors.value = {}
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate all form fields using the contactSchema.
 * Returns true when the form is valid.
 */
function validateFields(): boolean {
  const result = contactSchema.safeParse(formData.value)

  if (!result.success) {
    const errors = getValidationErrors(result.error)
    // Flatten nested social link errors to top-level keys
    const flatErrors: Record<string, string> = {}
    for (const [key, msg] of Object.entries(errors)) {
      flatErrors[key] = msg
    }
    validationErrors.value = flatErrors
    return false
  }

  validationErrors.value = {}
  return true
}

/** Validate a single top-level field on blur */
function validateField(field: 'email' | 'subtitle'): void {
  const result = contactSchema.safeParse(formData.value)

  if (result.success) {
    const updated = { ...validationErrors.value }
    delete updated[field]
    validationErrors.value = updated
  } else {
    const errors = getValidationErrors(result.error)
    if (errors[field]) {
      validationErrors.value = { ...validationErrors.value, [field]: errors[field] }
    } else {
      const updated = { ...validationErrors.value }
      delete updated[field]
      validationErrors.value = updated
    }
  }
}

// ─── Social link sub-form ─────────────────────────────────────────────────────

/** Open the form to add a new social link */
function openAddSocialLink(): void {
  editingLinkIndex.value = -1
  socialLinkForm.value = { icon: '', label: '', href: '' }
  socialLinkErrors.value = {}
  showSocialLinkForm.value = true
}

/** Open the form to edit an existing social link */
function openEditSocialLink(index: number): void {
  const link = formData.value.socialLinks[index]
  if (!link) return
  editingLinkIndex.value = index
  socialLinkForm.value = { icon: link.icon, label: link.label, href: link.href }
  socialLinkErrors.value = {}
  showSocialLinkForm.value = true
}

/** Cancel the social link sub-form without saving */
function cancelSocialLinkForm(): void {
  showSocialLinkForm.value = false
  socialLinkErrors.value = {}
}

/** Validate the social link sub-form fields */
function validateSocialLinkForm(): boolean {
  // Build a temporary object with a placeholder id for schema validation
  const candidate = { id: 'temp', ...socialLinkForm.value }
  const result = socialLinkSchema.safeParse(candidate)

  if (!result.success) {
    socialLinkErrors.value = getValidationErrors(result.error)
    return false
  }

  socialLinkErrors.value = {}
  return true
}

/** Save the social link sub-form (add or update) */
function saveSocialLink(): void {
  if (!validateSocialLinkForm()) return

  const links = [...formData.value.socialLinks]

  if (editingLinkIndex.value === -1) {
    // Add new link — generate a simple unique id
    const newLink: SocialLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...socialLinkForm.value
    }
    links.push(newLink)
  } else {
    // Update existing link, preserve its id
    const existing = links[editingLinkIndex.value]
    if (existing) {
      links[editingLinkIndex.value] = { id: existing.id, ...socialLinkForm.value }
    }
  }

  formData.value = { ...formData.value, socialLinks: links }
  showSocialLinkForm.value = false
  socialLinkErrors.value = {}

  // Clear any top-level socialLinks validation error now that we have entries
  if (validationErrors.value['socialLinks']) {
    const updated = { ...validationErrors.value }
    delete updated['socialLinks']
    validationErrors.value = updated
  }
}

/** Delete a social link by index */
function deleteSocialLink(index: number): void {
  const links = formData.value.socialLinks.filter((_, i) => i !== index)
  formData.value = { ...formData.value, socialLinks: links }
}

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * Validate all fields then persist via the content store.
 * Requirements: 7.2, 7.5, 7.6
 */
async function handleSave(): Promise<void> {
  if (!validateFields()) {
    uiStore.showNotification('error', 'Please fix the validation errors before saving.')
    return
  }

  isSaving.value = true

  try {
    const success = await contentStore.updateContact({ ...formData.value })

    if (success) {
      savedSnapshot.value = JSON.stringify(formData.value)
      uiStore.showNotification('success', 'Contact section saved successfully.')
    } else {
      uiStore.showNotification(
        'error',
        contentStore.error ?? 'Failed to save contact section. Please try again.'
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

// ─── Cancel ───────────────────────────────────────────────────────────────────

/** Discard all unsaved changes and reload from the store */
function handleCancel(): void {
  if (contentStore.contact) {
    applyStoreData(contentStore.contact)
  }
  showSocialLinkForm.value = false
  socialLinkErrors.value = {}
}

// ─── Navigation guard ─────────────────────────────────────────────────────────

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

function handleBeforeUnload(event: BeforeUnloadEvent): void {
  if (isDirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
</script>

<template>
  <div class="contact-editor">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="editor-header">
      <div class="editor-header__title-group">
        <h1 class="editor-header__title">Contact Section</h1>
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
    <div v-if="contentStore.isLoading && !savedSnapshot" class="loading-state">
      <span class="loading-state__spinner" aria-hidden="true" />
      <p>Loading contact data…</p>
    </div>

    <!-- ── Form ───────────────────────────────────────────────────────────── -->
    <form
      v-else
      class="editor-form"
      novalidate
      @submit.prevent="handleSave"
    >
      <!-- ── Contact details ───────────────────────────────────────────── -->
      <section class="form-section" aria-labelledby="contact-details-heading">
        <div class="form-section__header">
          <h2 id="contact-details-heading" class="form-section__title">Contact Details</h2>
          <p class="form-section__description">
            Your email address and the subtitle shown in the contact section.
          </p>
        </div>

        <div class="form-grid">
          <TextInput
            v-model="formData.email"
            label="Email Address"
            placeholder="you@example.com"
            :required="true"
            :error="validationErrors['email']"
            @blur="validateField('email')"
          />

          <TextInput
            v-model="formData.subtitle"
            label="Subtitle"
            placeholder="e.g. Feel free to reach out!"
            :required="true"
            :error="validationErrors['subtitle']"
            @blur="validateField('subtitle')"
          />
        </div>
      </section>

      <!-- ── Social Links ───────────────────────────────────────────────── -->
      <section class="form-section" aria-labelledby="social-links-heading">
        <div class="form-section__header">
          <h2 id="social-links-heading" class="form-section__title">Social Links</h2>
          <p class="form-section__description">
            Links to your social profiles. Each link requires an icon class, a label, and a URL.
          </p>
        </div>

        <!-- General social links error -->
        <p
          v-if="validationErrors['socialLinks']"
          class="field-error"
          role="alert"
        >
          {{ validationErrors['socialLinks'] }}
        </p>

        <!-- Social links list -->
        <div v-if="formData.socialLinks.length > 0" class="social-links-list">
          <div
            v-for="(link, index) in formData.socialLinks"
            :key="link.id"
            class="social-link-item"
          >
            <div class="social-link-item__info">
              <span class="social-link-item__icon" :class="link.icon" aria-hidden="true" />
              <div class="social-link-item__details">
                <span class="social-link-item__label">{{ link.label }}</span>
                <span class="social-link-item__href">{{ link.href }}</span>
              </div>
            </div>
            <div class="social-link-item__actions">
              <button
                type="button"
                class="btn-icon btn-icon--edit"
                :aria-label="`Edit ${link.label}`"
                @click="openEditSocialLink(index)"
              >
                ✎
              </button>
              <button
                type="button"
                class="btn-icon btn-icon--danger"
                :aria-label="`Delete ${link.label}`"
                @click="deleteSocialLink(index)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <p v-else class="empty-state">No social links yet. Add one below.</p>

        <!-- Add social link button -->
        <button
          v-if="!showSocialLinkForm"
          type="button"
          class="btn btn--outline btn--sm"
          @click="openAddSocialLink"
        >
          + Add Social Link
        </button>

        <!-- Social link sub-form -->
        <div v-if="showSocialLinkForm" class="social-link-form" role="region" aria-label="Social link form">
          <h3 class="social-link-form__title">
            {{ editingLinkIndex === -1 ? 'Add Social Link' : 'Edit Social Link' }}
          </h3>

          <div class="form-grid">
            <TextInput
              v-model="socialLinkForm.icon"
              label="Icon Class"
              placeholder="e.g. fab fa-github"
              :required="true"
              :error="socialLinkErrors['icon']"
            />

            <TextInput
              v-model="socialLinkForm.label"
              label="Label"
              placeholder="e.g. GitHub"
              :required="true"
              :error="socialLinkErrors['label']"
            />

            <div class="full-width">
              <TextInput
                v-model="socialLinkForm.href"
                label="URL"
                placeholder="https://github.com/username"
                :required="true"
                :error="socialLinkErrors['href']"
              />
            </div>
          </div>

          <div class="social-link-form__actions">
            <button
              type="button"
              class="btn btn--secondary btn--sm"
              @click="cancelSocialLinkForm"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn--primary btn--sm"
              @click="saveSocialLink"
            >
              {{ editingLinkIndex === -1 ? 'Add' : 'Update' }}
            </button>
          </div>
        </div>
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
    </form>
  </div>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.contact-editor {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 800px;
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

/* ── Form grid ───────────────────────────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.full-width {
  grid-column: 1 / -1;
}

/* ── Social links list ───────────────────────────────────────────────────── */
.social-links-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.social-link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: var(--color-background, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 8px;
  gap: 1rem;
}

.social-link-item__info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.social-link-item__icon {
  font-size: 1.25rem;
  color: var(--color-primary, #a855f7);
  flex-shrink: 0;
}

.social-link-item__details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.social-link-item__label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
}

.social-link-item__href {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.social-link-item__actions {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}

/* ── Social link sub-form ────────────────────────────────────────────────── */
.social-link-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background-color: var(--color-background, #ffffff);
  border: 1px solid var(--color-primary, #a855f7);
  border-radius: 8px;
}

.social-link-form__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.social-link-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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

/* ── Icon buttons ────────────────────────────────────────────────────────── */
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
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.btn-icon--edit {
  color: var(--color-text-secondary);
}

.btn-icon--edit:hover {
  color: var(--color-primary, #a855f7);
  background-color: rgba(168, 85, 247, 0.1);
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
@media (max-width: 640px) {
  .contact-editor {
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

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: 1;
  }

  .social-link-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .social-link-item__actions {
    align-self: flex-end;
  }
}
</style>
