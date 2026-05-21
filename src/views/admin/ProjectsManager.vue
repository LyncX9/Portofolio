<script setup lang="ts">
import { ref, reactive, computed, onMounted, inject, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { useUiStore } from '@/stores/ui'
import { imageService } from '@/services/imageService'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import TextInput from '@/components/admin/forms/TextInput.vue'
import TextArea from '@/components/admin/forms/TextArea.vue'
import ArrayInput from '@/components/admin/forms/ArrayInput.vue'
import ImageUpload from '@/components/admin/forms/ImageUpload.vue'
import type { Project } from '@/types'
import { projectSchema, getValidationErrors } from '@/types/schemas'

// ─── Stores ───────────────────────────────────────────────────────────────────

const contentStore = useContentStore()
const uiStore = useUiStore()

// ─── Unsaved-changes integration with AdminDashboard ─────────────────────────

const setUnsavedChanges = inject<(value: boolean) => void>('setUnsavedChanges')

// ─── State ────────────────────────────────────────────────────────────────────

/** Local sorted copy of projects for display */
const localProjects = ref<Project[]>([])

/** Whether the create form is open */
const isCreating = ref<boolean>(false)

/** Project currently being edited (null = not editing) */
const editingProject = ref<Project | null>(null)

/** Pending image file selected by the user (not yet uploaded) */
const pendingImageFile = ref<File | null>(null)

/** Snapshot of the form data at last save/load (for dirty detection) */
const savedSnapshot = ref<Omit<Project, 'id' | 'order'> | null>(null)

/** Project pending deletion (shown in confirm dialog) */
const projectToDelete = ref<Project | null>(null)

/** Whether the delete confirm dialog is open */
const isDeleteDialogOpen = ref<boolean>(false)

/** Whether a save operation is in progress */
const isSaving = ref<boolean>(false)

/** Form data for create / edit */
const form = reactive<{
  title: string
  category: string
  description: string
  features: string[]
  image: string
  link: string
  githubLink: string
  featured: boolean
}>({
  title: '',
  category: '',
  description: '',
  features: [],
  image: '',
  link: '',
  githubLink: '',
  featured: false,
})

/** Inline validation errors keyed by field name */
const validationErrors = reactive<Record<string, string>>({})

// ─── Computed ─────────────────────────────────────────────────────────────────

const isFormOpen = computed(() => isCreating.value || editingProject.value !== null)

const isLoading = computed(() => contentStore.isLoading)

/** True when the form differs from the last saved snapshot */
const isDirty = computed<boolean>(() => {
  if (!isFormOpen.value) return false
  if (!savedSnapshot.value) return isCreating.value
  if (pendingImageFile.value) return true
  const snap = savedSnapshot.value
  return (
    form.title !== snap.title ||
    form.category !== snap.category ||
    form.description !== snap.description ||
    form.link !== snap.link ||
    form.githubLink !== (snap.githubLink ?? '') ||
    form.featured !== snap.featured ||
    form.image !== snap.image ||
    JSON.stringify(form.features) !== JSON.stringify(snap.features)
  )
})

/** True when there are any validation errors */
const hasErrors = computed<boolean>(() => Object.keys(validationErrors).length > 0)

/** Save button is disabled while saving or when there are validation errors */
const isSaveDisabled = computed<boolean>(() => isSaving.value || hasErrors.value)

// ─── Sync dirty state with AdminDashboard ─────────────────────────────────────

watch(isDirty, (value) => {
  setUnsavedChanges?.(value)
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadProjects()
})

// ─── Load ─────────────────────────────────────────────────────────────────────

async function loadProjects(): Promise<void> {
  if (!contentStore.isContentLoaded) {
    await contentStore.loadContent()
  }
  syncLocalProjects()
}

/** Sync local list from the store (sorted by order) */
function syncLocalProjects(): void {
  localProjects.value = [...contentStore.projectsList]
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function openCreateForm(): void {
  editingProject.value = null
  pendingImageFile.value = null
  Object.assign(form, {
    title: '',
    category: '',
    description: '',
    features: [],
    image: '',
    link: '',
    githubLink: '',
    featured: false,
  })
  Object.keys(validationErrors).forEach((k) => delete validationErrors[k])
  savedSnapshot.value = null
  isCreating.value = true
}

function openEditForm(project: Project): void {
  isCreating.value = false
  pendingImageFile.value = null
  Object.assign(form, {
    title: project.title,
    category: project.category,
    description: project.description,
    features: [...project.features],
    image: project.image,
    link: project.link,
    githubLink: project.githubLink ?? '',
    featured: project.featured,
  })
  savedSnapshot.value = {
    title: project.title,
    category: project.category,
    description: project.description,
    features: [...project.features],
    image: project.image,
    link: project.link,
    githubLink: project.githubLink ?? '',
    featured: project.featured,
  }
  Object.keys(validationErrors).forEach((k) => delete validationErrors[k])
  editingProject.value = { ...project }
}

function closeForm(): void {
  isCreating.value = false
  editingProject.value = null
  pendingImageFile.value = null
  savedSnapshot.value = null
  Object.assign(form, {
    title: '',
    category: '',
    description: '',
    features: [],
    image: '',
    link: '',
    githubLink: '',
    featured: false,
  })
  Object.keys(validationErrors).forEach((k) => delete validationErrors[k])
  setUnsavedChanges?.(false)
}

// ─── Validation ───────────────────────────────────────────────────────────────

function buildValidationPayload() {
  return {
    id: editingProject.value?.id ?? 'temp-id',
    title: form.title,
    category: form.category,
    description: form.description,
    features: form.features,
    image: form.image || 'https://placeholder.com/image.jpg',
    link: form.link,
    githubLink: form.githubLink || undefined,
    featured: form.featured,
    order: editingProject.value?.order ?? 0,
  }
}

function validateForm(): boolean {
  Object.keys(validationErrors).forEach((k) => delete validationErrors[k])

  // Build a partial schema that doesn't require image (it may be pending upload)
  const payload = buildValidationPayload()
  const result = projectSchema.safeParse(payload)

  if (!result.success) {
    const errors = getValidationErrors(result.error)
    // Don't surface the placeholder image error if a file is pending
    if (pendingImageFile.value && errors['image']) {
      delete errors['image']
    }
    Object.assign(validationErrors, errors)
    return Object.keys(validationErrors).length === 0
  }

  return true
}

function validateSingleField(field: string): void {
  const payload = buildValidationPayload()
  const result = projectSchema.safeParse(payload)

  if (result.success) {
    delete validationErrors[field]
  } else {
    const errors = getValidationErrors(result.error)
    if (errors[field]) {
      validationErrors[field] = errors[field]
    } else {
      delete validationErrors[field]
    }
  }
}

// ─── Image handling ───────────────────────────────────────────────────────────

function handleImageUpload(file: File): void {
  pendingImageFile.value = file
  delete validationErrors['image']
}

function handleImageRemove(): void {
  pendingImageFile.value = null
  form.image = ''
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractFilename(url: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/')
    return parts[parts.length - 1] ?? ''
  } catch {
    const parts = url.split('/')
    return parts[parts.length - 1] ?? ''
  }
}

// ─── Image upload helper ──────────────────────────────────────────────────────

async function uploadPendingImage(category: string = 'projects'): Promise<string | null> {
  if (!pendingImageFile.value) return form.image

  const oldFilename = extractFilename(form.image)

  let uploadResponse
  if (oldFilename) {
    uploadResponse = await imageService.replaceImage(
      oldFilename,
      pendingImageFile.value,
      category
    )
  } else {
    uploadResponse = await imageService.uploadImage(pendingImageFile.value, category)
  }

  if (!uploadResponse.success || !uploadResponse.data) {
    uiStore.showNotification(
      'error',
      uploadResponse.error ?? 'Image upload failed. Please try again.'
    )
    return null
  }

  return uploadResponse.data.url
}

// ─── CRUD handlers ────────────────────────────────────────────────────────────

/** Task 17.2 – createProject handler */
async function handleCreate(): Promise<void> {
  if (!validateForm()) {
    uiStore.showNotification('error', 'Please fix the validation errors before saving.')
    return
  }

  isSaving.value = true

  try {
    // Upload image if one was selected
    if (pendingImageFile.value) {
      const imageUrl = await uploadPendingImage('projects')
      if (imageUrl === null) return
      form.image = imageUrl
      pendingImageFile.value = null
    }

    const created = await contentStore.createProject({
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      features: form.features,
      image: form.image,
      link: form.link.trim(),
      githubLink: form.githubLink.trim() || undefined,
      featured: form.featured,
    })

    if (created) {
      uiStore.showNotification('success', `Project "${created.title}" created successfully.`)
      closeForm()
      syncLocalProjects()
    } else {
      uiStore.showNotification('error', contentStore.error ?? 'Failed to create project.')
    }
  } finally {
    isSaving.value = false
  }
}

/** Task 17.2 – updateProject handler */
async function handleUpdate(): Promise<void> {
  if (!editingProject.value) return
  if (!validateForm()) {
    uiStore.showNotification('error', 'Please fix the validation errors before saving.')
    return
  }

  isSaving.value = true

  try {
    // Upload image if a new one was selected
    if (pendingImageFile.value) {
      const imageUrl = await uploadPendingImage('projects')
      if (imageUrl === null) return
      form.image = imageUrl
      pendingImageFile.value = null
    }

    const updated: Project = {
      ...editingProject.value,
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      features: form.features,
      image: form.image,
      link: form.link.trim(),
      githubLink: form.githubLink.trim() || undefined,
      featured: form.featured,
    }

    const success = await contentStore.updateProject(editingProject.value.id, updated)

    if (success) {
      uiStore.showNotification('success', `Project "${updated.title}" updated successfully.`)
      savedSnapshot.value = {
        title: updated.title,
        category: updated.category,
        description: updated.description,
        features: [...updated.features],
        image: updated.image,
        link: updated.link,
        githubLink: updated.githubLink ?? '',
        featured: updated.featured,
      }
      editingProject.value = { ...updated }
      setUnsavedChanges?.(false)
      syncLocalProjects()
    } else {
      uiStore.showNotification('error', contentStore.error ?? 'Failed to update project.')
    }
  } finally {
    isSaving.value = false
  }
}

/** Task 17.2 – deleteProject handler with cascading image delete */
function requestDelete(project: Project): void {
  projectToDelete.value = project
  isDeleteDialogOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!projectToDelete.value) return

  const project = projectToDelete.value
  const title = project.title

  isDeleteDialogOpen.value = false
  projectToDelete.value = null

  // Cascading image delete: remove the associated image before deleting the project
  if (project.image) {
    const filename = extractFilename(project.image)
    if (filename) {
      try {
        await imageService.deleteImage(filename)
      } catch (err) {
        // Log but don't block the project deletion
        console.warn('Failed to delete project image:', err)
      }
    }
  }

  const success = await contentStore.deleteProject(project.id)

  if (success) {
    uiStore.showNotification('success', `Project "${title}" deleted.`)
    // If we were editing this project, close the form
    if (editingProject.value?.id === project.id) {
      closeForm()
    }
    syncLocalProjects()
  } else {
    uiStore.showNotification('error', contentStore.error ?? 'Failed to delete project.')
  }
}

function cancelDelete(): void {
  isDeleteDialogOpen.value = false
  projectToDelete.value = null
}

// ─── Cancel form ──────────────────────────────────────────────────────────────

function handleCancel(): void {
  if (editingProject.value && savedSnapshot.value) {
    // Restore form to saved state
    Object.assign(form, {
      title: savedSnapshot.value.title,
      category: savedSnapshot.value.category,
      description: savedSnapshot.value.description,
      features: [...savedSnapshot.value.features],
      image: savedSnapshot.value.image,
      link: savedSnapshot.value.link,
      githubLink: savedSnapshot.value.githubLink ?? '',
      featured: savedSnapshot.value.featured,
    })
    pendingImageFile.value = null
    Object.keys(validationErrors).forEach((k) => delete validationErrors[k])
  } else {
    closeForm()
  }
}

// ─── Navigation guard ─────────────────────────────────────────────────────────

onBeforeRouteLeave(() => {
  if (isDirty.value) {
    return window.confirm('You have unsaved changes. Are you sure you want to leave?')
  }
})
</script>

<template>
  <div class="projects-manager">
    <!-- ── Page header ─────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="page-header__text">
        <h1 class="page-title">Projects Manager</h1>
        <p class="page-subtitle">Add, edit, or remove your portfolio projects.</p>
      </div>

      <button
        class="btn btn-primary"
        :disabled="isLoading || isFormOpen"
        @click="openCreateForm"
      >
        <span aria-hidden="true">＋</span> Create New Project
      </button>
    </div>

    <!-- ── Loading state ──────────────────────────────────────────────────── -->
    <div v-if="isLoading && localProjects.length === 0" class="loading-state" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <span>Loading projects…</span>
    </div>

    <!-- ── Create / Edit form ─────────────────────────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="isFormOpen" class="project-form-card" aria-label="Project form">
        <h2 class="form-title">{{ isCreating ? 'Create New Project' : 'Edit Project' }}</h2>

        <!-- Project image -->
        <div class="form-section">
          <h3 class="section-label">Project Image</h3>
          <ImageUpload
            :current-image="form.image"
            :max-size="5"
            @upload="handleImageUpload"
            @remove="handleImageRemove"
          />
          <p v-if="validationErrors['image']" class="field-error" role="alert">
            {{ validationErrors['image'] }}
          </p>
        </div>

        <!-- Core fields -->
        <div class="form-grid">
          <TextInput
            v-model="form.title"
            label="Title"
            placeholder="e.g. Portfolio Website"
            required
            :error="validationErrors['title']"
            @blur="validateSingleField('title')"
          />

          <TextInput
            v-model="form.category"
            label="Category"
            placeholder="e.g. Web App, Mobile, API"
            required
            :error="validationErrors['category']"
            @blur="validateSingleField('category')"
          />

          <TextInput
            v-model="form.link"
            label="Project Link"
            placeholder="https://example.com"
            required
            :error="validationErrors['link']"
            @blur="validateSingleField('link')"
          />

          <TextInput
            v-model="form.githubLink"
            label="GitHub Link"
            placeholder="https://github.com/user/repo"
            :error="validationErrors['githubLink']"
            @blur="validateSingleField('githubLink')"
          />
        </div>

        <!-- Description -->
        <TextArea
          v-model="form.description"
          label="Description"
          placeholder="Describe the project in detail…"
          :rows="4"
          required
          :error="validationErrors['description']"
        />

        <!-- Features -->
        <ArrayInput
          v-model="form.features"
          label="Features"
          placeholder="Add a feature…"
          add-button-text="Add Feature"
        />
        <p v-if="validationErrors['features']" class="field-error" role="alert">
          {{ validationErrors['features'] }}
        </p>

        <!-- Featured toggle -->
        <label class="featured-toggle">
          <input
            v-model="form.featured"
            type="checkbox"
            class="featured-checkbox"
            aria-label="Mark as featured project"
          />
          <span class="featured-label">Featured project</span>
          <span class="featured-hint">Featured projects are highlighted on the portfolio.</span>
        </label>

        <!-- Form actions -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="isSaving"
            @click="handleCancel"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="isSaveDisabled"
            :aria-busy="isSaving"
            @click="isCreating ? handleCreate() : handleUpdate()"
          >
            <span v-if="isSaving" class="spinner spinner--sm" aria-hidden="true" />
            {{ isSaving ? 'Saving…' : isCreating ? 'Create Project' : 'Save Changes' }}
          </button>
        </div>

        <!-- Dirty indicator -->
        <p v-if="isDirty && !isSaving" class="dirty-indicator" role="status" aria-live="polite">
          You have unsaved changes.
        </p>
      </section>
    </Transition>

    <!-- ── Projects list ──────────────────────────────────────────────────── -->
    <section v-if="localProjects.length > 0" class="projects-list" aria-label="Projects list">
      <ul class="project-rows" role="list">
        <li
          v-for="project in localProjects"
          :key="project.id"
          class="project-row"
          :class="{ 'project-row--featured': project.featured }"
          :aria-label="`${project.title} – ${project.category}`"
        >
          <!-- Thumbnail -->
          <div class="project-thumbnail" aria-hidden="true">
            <img
              v-if="project.image"
              :src="project.image"
              :alt="project.title"
              class="thumbnail-img"
            />
            <span v-else class="thumbnail-placeholder">🖼</span>
          </div>

          <!-- Info -->
          <div class="project-info">
            <div class="project-title-row">
              <span class="project-name">{{ project.title }}</span>
              <span v-if="project.featured" class="featured-badge" aria-label="Featured">★ Featured</span>
            </div>
            <span class="project-category">{{ project.category }}</span>
            <p class="project-description">{{ project.description }}</p>
          </div>

          <!-- Actions -->
          <div class="project-actions">
            <button
              type="button"
              class="btn btn-icon btn-edit"
              :disabled="isLoading"
              :aria-label="`Edit ${project.title}`"
              @click="openEditForm(project)"
            >
              ✏️
            </button>

            <button
              type="button"
              class="btn btn-icon btn-delete"
              :disabled="isLoading"
              :aria-label="`Delete ${project.title}`"
              @click="requestDelete(project)"
            >
              🗑️
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- ── Empty state ────────────────────────────────────────────────────── -->
    <div
      v-else-if="!isLoading && !isFormOpen"
      class="empty-state"
      role="status"
    >
      <p class="empty-state__message">
        No projects yet. Click <strong>Create New Project</strong> to add one.
      </p>
    </div>

    <!-- ── Delete confirmation dialog ────────────────────────────────────── -->
    <ConfirmDialog
      :is-open="isDeleteDialogOpen"
      title="Delete Project"
      :message="projectToDelete
        ? `Are you sure you want to delete &quot;${projectToDelete.title}&quot;? This will also remove the associated image. This action cannot be undone.`
        : ''"
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.projects-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 900px;
}

/* ── Page header ─────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.page-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border: none;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.1s ease;
  outline: none;
  white-space: nowrap;
}

.btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.4);
}

.btn:active:not(:disabled) {
  transform: scale(0.97);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary, #a855f7);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #9333ea;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.35);
}

.btn-secondary {
  background-color: var(--color-background-secondary, #2a2a3e);
  color: var(--color-text, #e2e8f0);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-border, rgba(255, 255, 255, 0.15));
}

.btn-icon {
  padding: 0.35rem 0.55rem;
  font-size: 1rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
}

.btn-edit:hover:not(:disabled) {
  background-color: rgba(168, 85, 247, 0.12);
  border-color: rgba(168, 85, 247, 0.3);
}

.btn-delete:hover:not(:disabled) {
  background-color: rgba(236, 72, 153, 0.12);
  border-color: rgba(236, 72, 153, 0.3);
}

/* ── Loading ─────────────────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.spinner {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(168, 85, 247, 0.25);
  border-top-color: var(--color-primary, #a855f7);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.spinner--sm {
  width: 0.9rem;
  height: 0.9rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Project form card ───────────────────────────────────────────────────── */
.project-form-card {
  background-color: var(--color-background-secondary, #1e1e2e);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.field-error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-accent, #ec4899);
}

/* ── Featured toggle ─────────────────────────────────────────────────────── */
.featured-toggle {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  flex-wrap: wrap;
}

.featured-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--color-primary, #a855f7);
  cursor: pointer;
  flex-shrink: 0;
}

.featured-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
}

.featured-hint {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  width: 100%;
  margin-left: 1.75rem;
}

/* ── Form actions ────────────────────────────────────────────────────────── */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ── Dirty indicator ─────────────────────────────────────────────────────── */
.dirty-indicator {
  text-align: right;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* ── Projects list ───────────────────────────────────────────────────────── */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.project-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-background-secondary, #1e1e2e);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.project-row--featured {
  border-color: rgba(168, 85, 247, 0.4);
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.15);
}

/* Thumbnail */
.project-thumbnail {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-background, #13131f);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  font-size: 1.75rem;
  opacity: 0.4;
}

/* Info */
.project-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.project-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.project-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.featured-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary, #a855f7);
  background-color: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  white-space: nowrap;
}

.project-category {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.project-description {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Actions */
.project-actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
  align-self: flex-start;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  border: 1px dashed var(--color-border, rgba(255, 255, 255, 0.12));
  border-radius: 12px;
}

.empty-state__message {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

/* ── Slide-down transition ───────────────────────────────────────────────── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    max-height 0.25s ease;
  overflow: hidden;
  max-height: 1200px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .project-row {
    flex-wrap: wrap;
  }

  .project-thumbnail {
    width: 56px;
    height: 56px;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
