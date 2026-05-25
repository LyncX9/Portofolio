<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { useUiStore } from '@/stores/ui'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import TextInput from '@/components/admin/forms/TextInput.vue'
import ArrayInput from '@/components/admin/forms/ArrayInput.vue'
import AdminSectionPreview from '@/components/admin/AdminSectionPreview.vue'
import ExperienceSection from '@/components/ExperienceSection.vue'
import type { Experience } from '@/types'

// ─── Stores ───────────────────────────────────────────────────────────────────

const contentStore = useContentStore()
const uiStore = useUiStore()

// ─── State ────────────────────────────────────────────────────────────────────

/** Local sorted copy of experience entries for display and drag-and-drop */
const localExperience = ref<Experience[]>([])

/** Experience entry currently being edited (null = not editing) */
const editingExperience = ref<Experience | null>(null)

/** Whether the create form is open */
const isCreating = ref<boolean>(false)

/** Form data for create / edit */
const formData = ref<{
  title: string
  company: string
  duration: string
  descriptions: string[]
}>({
  title: '',
  company: '',
  duration: '',
  descriptions: [],
})

/** Inline validation errors for the form */
const validationErrors = ref<{
  title?: string
  company?: string
  duration?: string
}>({})

/** Experience entry pending deletion (shown in confirm dialog) */
const experienceToDelete = ref<Experience | null>(null)

/** Whether the delete confirm dialog is open */
const isDeleteDialogOpen = ref<boolean>(false)

/** Drag-and-drop state */
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// ─── Computed ─────────────────────────────────────────────────────────────────

const isFormOpen = computed(() => isCreating.value || editingExperience.value !== null)

const isLoading = computed(() => contentStore.isLoading)

/** True when there are any validation errors — used to disable the save button */
const hasValidationErrors = computed(() => Object.keys(validationErrors.value).length > 0)

/** Save button is disabled while loading or when there are validation errors */
const isSaveDisabled = computed(() => isLoading.value || hasValidationErrors.value)

const previewExperience = computed<Experience[]>(() => {
  const current = [...localExperience.value]
  if (!isFormOpen.value) return current

  const draft: Experience = {
    id: editingExperience.value?.id ?? 'draft-experience',
    title: formData.value.title || 'New Experience',
    company: formData.value.company || 'Company',
    duration: formData.value.duration || 'Duration',
    descriptions: formData.value.descriptions.length
      ? formData.value.descriptions
      : ['Experience detail will appear here.'],
    order: editingExperience.value?.order ?? current.length,
  }

  if (editingExperience.value) {
    const index = current.findIndex((entry) => entry.id === editingExperience.value?.id)
    if (index >= 0) current[index] = draft
    return current
  }

  return [...current, draft]
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadExperience()
})

// ─── Load ─────────────────────────────────────────────────────────────────────

async function loadExperience(): Promise<void> {
  if (!contentStore.isContentLoaded) {
    await contentStore.loadContent()
  }
  syncLocalExperience()
}

/** Sync local list from the store (sorted by order) */
function syncLocalExperience(): void {
  localExperience.value = [...contentStore.experienceList]
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function openCreateForm(): void {
  editingExperience.value = null
  formData.value = { title: '', company: '', duration: '', descriptions: [] }
  validationErrors.value = {}
  isCreating.value = true
}

function openEditForm(entry: Experience): void {
  isCreating.value = false
  formData.value = {
    title: entry.title,
    company: entry.company,
    duration: entry.duration,
    descriptions: [...entry.descriptions],
  }
  validationErrors.value = {}
  editingExperience.value = { ...entry }
}

function closeForm(): void {
  isCreating.value = false
  editingExperience.value = null
  formData.value = { title: '', company: '', duration: '', descriptions: [] }
  validationErrors.value = {}
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(): boolean {
  const errors: { title?: string; company?: string; duration?: string } = {}

  if (!formData.value.title.trim()) {
    errors.title = 'Title is required'
  }
  if (!formData.value.company.trim()) {
    errors.company = 'Company is required'
  }
  if (!formData.value.duration.trim()) {
    errors.duration = 'Duration is required'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

/** Validate a single field on blur — Requirements: 11.4 */
function validateSingleField(field: 'title' | 'company' | 'duration'): void {
  const value = formData.value[field]
  if (!value.trim()) {
    validationErrors.value = {
      ...validationErrors.value,
      [field]: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
    }
  } else {
    const updated = { ...validationErrors.value }
    delete updated[field]
    validationErrors.value = updated
  }
}

// ─── CRUD handlers ────────────────────────────────────────────────────────────

/** Task 18.2 – createExperience handler */
async function handleCreate(): Promise<void> {
  if (!validateForm()) return

  const created = await contentStore.createExperience({
    title: formData.value.title.trim(),
    company: formData.value.company.trim(),
    duration: formData.value.duration.trim(),
    descriptions: formData.value.descriptions,
  })

  if (created) {
    uiStore.showNotification('success', `Experience "${created.title}" created successfully.`)
    closeForm()
    syncLocalExperience()
  } else {
    uiStore.showNotification('error', contentStore.error ?? 'Failed to create experience entry.')
  }
}

/** Task 18.2 – updateExperience handler */
async function handleUpdate(): Promise<void> {
  if (!editingExperience.value) return
  if (!validateForm()) return

  const updated: Experience = {
    ...editingExperience.value,
    title: formData.value.title.trim(),
    company: formData.value.company.trim(),
    duration: formData.value.duration.trim(),
    descriptions: formData.value.descriptions,
  }

  const success = await contentStore.updateExperience(editingExperience.value.id, updated)

  if (success) {
    uiStore.showNotification('success', `Experience "${updated.title}" updated successfully.`)
    closeForm()
    syncLocalExperience()
  } else {
    uiStore.showNotification('error', contentStore.error ?? 'Failed to update experience entry.')
  }
}

/** Task 18.2 – deleteExperience handler – opens confirm dialog */
function requestDelete(entry: Experience): void {
  experienceToDelete.value = entry
  isDeleteDialogOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!experienceToDelete.value) return

  const title = experienceToDelete.value.title
  const success = await contentStore.deleteExperience(experienceToDelete.value.id)

  isDeleteDialogOpen.value = false
  experienceToDelete.value = null

  if (success) {
    uiStore.showNotification('success', `Experience "${title}" deleted.`)
    syncLocalExperience()
  } else {
    uiStore.showNotification('error', contentStore.error ?? 'Failed to delete experience entry.')
  }
}

function cancelDelete(): void {
  isDeleteDialogOpen.value = false
  experienceToDelete.value = null
}

// ─── Drag-and-drop reordering ─────────────────────────────────────────────────

function handleDragStart(index: number): void {
  draggedIndex.value = index
}

function handleDragOver(event: DragEvent, index: number): void {
  event.preventDefault()
  dragOverIndex.value = index
}

function handleDragLeave(): void {
  dragOverIndex.value = null
}

/** Task 18.2 – reorderExperience handler */
async function handleDrop(targetIndex: number): Promise<void> {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    draggedIndex.value = null
    dragOverIndex.value = null
    return
  }

  // Reorder local array
  const reordered = [...localExperience.value]
  const [moved] = reordered.splice(draggedIndex.value, 1)
  reordered.splice(targetIndex, 0, moved!)

  // Assign new order values
  const withOrder: Experience[] = reordered.map((entry, idx) => ({ ...entry, order: idx }))

  // Optimistically update local list
  localExperience.value = withOrder

  draggedIndex.value = null
  dragOverIndex.value = null

  const success = await contentStore.reorderExperience(withOrder)

  if (success) {
    uiStore.showNotification('success', 'Experience entries reordered successfully.')
    syncLocalExperience()
  } else {
    uiStore.showNotification('error', contentStore.error ?? 'Failed to reorder experience entries.')
    syncLocalExperience() // rollback to store state
  }
}

function handleDragEnd(): void {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// ─── Navigation guard ─────────────────────────────────────────────────────────

onBeforeRouteLeave(() => {
  if (isFormOpen.value) {
    return window.confirm('You have unsaved changes. Are you sure you want to leave?')
  }
})
</script>

<template>
  <div class="experience-manager">
    <!-- ── Page header ─────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="page-header__text">
        <h1 class="page-title">Experience Manager</h1>
        <p class="page-subtitle">Add, edit, reorder, or remove your work experience entries.</p>
      </div>

      <button
        class="btn btn-primary"
        :disabled="isLoading || isFormOpen"
        @click="openCreateForm"
      >
        <span aria-hidden="true">＋</span> Create New Experience
      </button>
    </div>

    <!-- ── Loading state ──────────────────────────────────────────────────── -->
    <div v-if="isLoading && localExperience.length === 0" class="loading-state" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <span>Loading experience entries…</span>
    </div>

    <div class="manager-workspace">
      <div class="manager-fields">
    <!-- ── Create / Edit form ─────────────────────────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="isFormOpen" class="experience-form-card" aria-label="Experience form">
        <h2 class="form-title">{{ isCreating ? 'Create New Experience' : 'Edit Experience' }}</h2>

        <div class="form-grid">
          <TextInput
            v-model="formData.title"
            label="Title"
            placeholder="e.g. Senior Frontend Developer"
            required
            :error="validationErrors.title"
            @blur="validateSingleField('title')"
          />

          <TextInput
            v-model="formData.company"
            label="Company"
            placeholder="e.g. Acme Corp"
            required
            :error="validationErrors.company"
            @blur="validateSingleField('company')"
          />

          <TextInput
            v-model="formData.duration"
            label="Duration"
            placeholder="e.g. Jan 2022 – Present"
            required
            :error="validationErrors.duration"
            @blur="validateSingleField('duration')"
          />
        </div>

        <ArrayInput
          v-model="formData.descriptions"
          label="Descriptions"
          placeholder="Add a description bullet point…"
          add-button-text="Add"
        />

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="isLoading"
            @click="closeForm"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="isSaveDisabled"
            @click="isCreating ? handleCreate() : handleUpdate()"
          >
            <span v-if="isLoading" class="spinner spinner--sm" aria-hidden="true" />
            {{ isCreating ? 'Create Experience' : 'Save Changes' }}
          </button>
        </div>
      </section>
    </Transition>

    <!-- ── Experience list ────────────────────────────────────────────────── -->
    <section
      v-if="localExperience.length > 0"
      class="experience-list"
      aria-label="Experience list"
    >
      <p class="drag-hint" aria-hidden="true">
        Drag rows to reorder experience entries chronologically.
      </p>

      <ul class="experience-rows" role="list">
        <li
          v-for="(entry, index) in localExperience"
          :key="entry.id"
          class="experience-row"
          :class="{
            'experience-row--dragging': draggedIndex === index,
            'experience-row--drag-over': dragOverIndex === index && draggedIndex !== index,
          }"
          draggable="true"
          :aria-label="`${entry.title} at ${entry.company} – ${entry.duration}`"
          @dragstart="handleDragStart(index)"
          @dragover="handleDragOver($event, index)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(index)"
          @dragend="handleDragEnd"
        >
          <!-- Drag handle -->
          <span class="drag-handle" aria-hidden="true" title="Drag to reorder">⠿</span>

          <!-- Info -->
          <div class="experience-info">
            <span class="experience-title">{{ entry.title }}</span>
            <span class="experience-company">{{ entry.company }}</span>
            <span class="experience-duration">{{ entry.duration }}</span>
            <span
              v-if="entry.descriptions.length > 0"
              class="experience-desc-count"
            >
              {{ entry.descriptions.length }} description{{ entry.descriptions.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Actions -->
          <div class="experience-actions">
            <button
              type="button"
              class="btn btn-icon btn-edit"
              :disabled="isLoading"
              :aria-label="`Edit ${entry.title}`"
              @click="openEditForm(entry)"
            >
              ✏️
            </button>

            <button
              type="button"
              class="btn btn-icon btn-delete"
              :disabled="isLoading"
              :aria-label="`Delete ${entry.title}`"
              @click="requestDelete(entry)"
            >
              🗑️
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- ── Empty state ────────────────────────────────────────────────────── -->
    <div
      v-else-if="!isLoading"
      class="empty-state"
      role="status"
    >
      <p class="empty-state__message">
        No experience entries yet. Click <strong>Create New Experience</strong> to add one.
      </p>
    </div>
      </div>

      <AdminSectionPreview
        title="Experience section"
        subtitle="Preview timeline kerja ikut berubah saat kamu mengetik."
      >
        <ExperienceSection :experience="previewExperience" />
      </AdminSectionPreview>
    </div>

    <!-- ── Delete confirmation dialog ────────────────────────────────────── -->
    <ConfirmDialog
      :is-open="isDeleteDialogOpen"
      title="Delete Experience"
      :message="
        experienceToDelete
          ? `Are you sure you want to delete &quot;${experienceToDelete.title}&quot; at ${experienceToDelete.company}? This action cannot be undone.`
          : ''
      "
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.experience-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: none;
}

.manager-workspace {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(min(560px, 100%), 1.1fr);
  gap: 1.5rem;
  align-items: start;
}

.manager-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

/* ── Experience form card ─────────────────────────────────────────────────── */
.experience-form-card {
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ── Experience list ─────────────────────────────────────────────────────── */
.experience-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.drag-hint {
  margin: 0 0 0.25rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.experience-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.experience-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background-color: var(--color-background-secondary, #1e1e2e);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  cursor: grab;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
  user-select: none;
}

.experience-row:active {
  cursor: grabbing;
}

.experience-row--dragging {
  opacity: 0.45;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.experience-row--drag-over {
  border-color: var(--color-primary, #a855f7);
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.3);
}

/* Drag handle */
.drag-handle {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  opacity: 0.5;
  flex-shrink: 0;
  cursor: grab;
}

/* Info */
.experience-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}

.experience-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.experience-company {
  font-size: 0.875rem;
  color: var(--color-primary, #a855f7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.experience-duration {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.experience-desc-count {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  opacity: 0.7;
}

/* Actions */
.experience-actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
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
    max-height 0.3s ease;
  overflow: hidden;
  max-height: 800px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .manager-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
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

  .experience-row {
    flex-wrap: wrap;
  }
}
</style>
