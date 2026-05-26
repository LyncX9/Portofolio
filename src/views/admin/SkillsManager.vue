<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useContentStore } from '@/stores/content'
import { useUiStore } from '@/stores/ui'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import TextInput from '@/components/admin/forms/TextInput.vue'
import ImageUpload from '@/components/admin/forms/ImageUpload.vue'
import AdminSectionPreview from '@/components/admin/AdminSectionPreview.vue'
import SkillsSection from '@/components/SkillsSection.vue'
import { isImageUrl, resolveMediaUrl } from '@/utils/api'
import type { Skill } from '@/types'

// ─── Stores ───────────────────────────────────────────────────────────────────

const contentStore = useContentStore()
const uiStore = useUiStore()

// ─── State ────────────────────────────────────────────────────────────────────

/** Local sorted copy of skills for display and drag-and-drop */
const localSkills = ref<Skill[]>([])

/** Skill currently being edited (null = not editing) */
const editingSkill = ref<Skill | null>(null)

/** Whether the create form is open */
const isCreating = ref<boolean>(false)

/** Form data for create / edit */
const formData = ref<{ name: string; icon: string; category: string }>({
  name: '',
  icon: '',
  category: '',
})

const pendingIconFile = ref<File | null>(null)
const pendingIconPreview = ref<string>('')

/** Inline validation errors for the form */
const validationErrors = ref<{ name?: string; icon?: string; category?: string }>({})

/** Skill pending deletion (shown in confirm dialog) */
const skillToDelete = ref<Skill | null>(null)

/** Whether the delete confirm dialog is open */
const isDeleteDialogOpen = ref<boolean>(false)

/** Drag-and-drop state */
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const failedSkillIconIds = ref<Set<string>>(new Set())

// ─── Computed ─────────────────────────────────────────────────────────────────

const isFormOpen = computed(() => isCreating.value || editingSkill.value !== null)

const isLoading = computed(() => contentStore.isLoading)

/** True when there are any validation errors — used to disable the save button */
const hasValidationErrors = computed(() => Object.keys(validationErrors.value).length > 0)

/** Save button is disabled while loading or when there are validation errors */
const isSaveDisabled = computed(() => isLoading.value || hasValidationErrors.value)

const previewSkills = computed<Skill[]>(() => {
  const current = [...localSkills.value]
  if (!isFormOpen.value) return current

  const draft: Skill = {
    id: editingSkill.value?.id ?? 'draft-skill',
    name: formData.value.name || 'New Skill',
    icon: pendingIconPreview.value || formData.value.icon || 'SK',
    category: formData.value.category || 'Category',
    order: editingSkill.value?.order ?? current.length,
  }

  if (editingSkill.value) {
    const index = current.findIndex((skill) => skill.id === editingSkill.value?.id)
    if (index >= 0) current[index] = draft
    return current
  }

  return [...current, draft]
})

const currentIconImage = computed(() =>
  isImageIcon(formData.value.icon) ? resolveMediaUrl(formData.value.icon) : ''
)

const isUsingImageIcon = computed(() => Boolean(pendingIconFile.value || currentIconImage.value))

watch(pendingIconFile, (file) => {
  if (pendingIconPreview.value) {
    URL.revokeObjectURL(pendingIconPreview.value)
    pendingIconPreview.value = ''
  }
  if (file) {
    pendingIconPreview.value = URL.createObjectURL(file)
  }
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadSkills()
})

onBeforeUnmount(() => {
  if (pendingIconPreview.value) {
    URL.revokeObjectURL(pendingIconPreview.value)
  }
})

// ─── Load ─────────────────────────────────────────────────────────────────────

async function loadSkills(): Promise<void> {
  if (!contentStore.isContentLoaded) {
    await contentStore.loadContent()
  }
  syncLocalSkills()
}

/** Sync local list from the store (sorted by order) */
function syncLocalSkills(): void {
  localSkills.value = [...contentStore.skillsList]
  failedSkillIconIds.value = new Set()
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function openCreateForm(): void {
  editingSkill.value = null
  pendingIconFile.value = null
  formData.value = { name: '', icon: '', category: '' }
  validationErrors.value = {}
  isCreating.value = true
}

function openEditForm(skill: Skill): void {
  isCreating.value = false
  pendingIconFile.value = null
  formData.value = { name: skill.name, icon: skill.icon, category: skill.category }
  validationErrors.value = {}
  editingSkill.value = { ...skill }
}

function closeForm(): void {
  isCreating.value = false
  editingSkill.value = null
  pendingIconFile.value = null
  formData.value = { name: '', icon: '', category: '' }
  validationErrors.value = {}
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(): boolean {
  const errors: { name?: string; icon?: string; category?: string } = {}

  if (!formData.value.name.trim()) {
    errors.name = 'Name is required'
  }
  if (!formData.value.icon.trim() && !pendingIconFile.value) {
    errors.icon = 'Icon is required'
  }
  if (!formData.value.category.trim()) {
    errors.category = 'Category is required'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

/** Validate a single field on blur — Requirements: 11.4 */
function validateSingleField(field: 'name' | 'icon' | 'category'): void {
  const value = formData.value[field]
  if (!value.trim() && !(field === 'icon' && pendingIconFile.value)) {
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

function handleIconUpload(file: File): void {
  pendingIconFile.value = file
  const updated = { ...validationErrors.value }
  delete updated.icon
  validationErrors.value = updated
}

function handleIconRemove(): void {
  pendingIconFile.value = null
  formData.value.icon = ''
}

function isImageIcon(icon: string): boolean {
  return isImageUrl(icon)
}

function iconLabel(skill: Skill): string {
  if (!skill.icon || isImageIcon(skill.icon)) {
    return skill.name.slice(0, 2).toUpperCase()
  }
  return skill.icon
}

function markSkillIconFailed(id: string): void {
  failedSkillIconIds.value = new Set([...failedSkillIconIds.value, id])
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read icon file.'))
    reader.readAsDataURL(file)
  })
}

async function uploadPendingIcon(): Promise<string | null> {
  if (!pendingIconFile.value) return formData.value.icon

  try {
    const dataUrl = await readFileAsDataUrl(pendingIconFile.value)
    pendingIconFile.value = null
    return dataUrl
  } catch (error) {
    uiStore.showNotification(
      'error',
      error instanceof Error ? error.message : 'Skill icon upload failed.'
    )
    return null
  }
}

// ─── CRUD handlers ────────────────────────────────────────────────────────────

/** Task 16.2 – createSkill handler */
async function handleCreate(): Promise<void> {
  if (!validateForm()) return

  const icon = await uploadPendingIcon()
  if (icon === null) return

  const created = await contentStore.createSkill({
    name: formData.value.name.trim(),
    icon: icon.trim(),
    category: formData.value.category.trim(),
  })

  if (created) {
    uiStore.showNotification('success', `Skill "${created.name}" created successfully.`)
    closeForm()
    syncLocalSkills()
  } else {
    uiStore.showNotification('error', contentStore.error ?? 'Failed to create skill.')
  }
}

/** Task 16.2 – updateSkill handler */
async function handleUpdate(): Promise<void> {
  if (!editingSkill.value) return
  if (!validateForm()) return

  const icon = await uploadPendingIcon()
  if (icon === null) return

  const updated: Skill = {
    ...editingSkill.value,
    name: formData.value.name.trim(),
    icon: icon.trim(),
    category: formData.value.category.trim(),
  }

  const success = await contentStore.updateSkill(editingSkill.value.id, updated)

  if (success) {
    uiStore.showNotification('success', `Skill "${updated.name}" updated successfully.`)
    closeForm()
    syncLocalSkills()
  } else {
    uiStore.showNotification('error', contentStore.error ?? 'Failed to update skill.')
  }
}

/** Task 16.2 – deleteSkill handler – opens confirm dialog */
function requestDelete(skill: Skill): void {
  skillToDelete.value = skill
  isDeleteDialogOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!skillToDelete.value) return

  const name = skillToDelete.value.name
  const success = await contentStore.deleteSkill(skillToDelete.value.id)

  isDeleteDialogOpen.value = false
  skillToDelete.value = null

  if (success) {
    uiStore.showNotification('success', `Skill "${name}" deleted.`)
    syncLocalSkills()
  } else {
    uiStore.showNotification('error', contentStore.error ?? 'Failed to delete skill.')
  }
}

function cancelDelete(): void {
  isDeleteDialogOpen.value = false
  skillToDelete.value = null
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

/** Task 16.2 – reorderSkills handler */
async function handleDrop(targetIndex: number): Promise<void> {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    draggedIndex.value = null
    dragOverIndex.value = null
    return
  }

  // Reorder local array
  const reordered = [...localSkills.value]
  const [moved] = reordered.splice(draggedIndex.value, 1)
  reordered.splice(targetIndex, 0, moved!)

  // Assign new order values
  const withOrder: Skill[] = reordered.map((skill, idx) => ({ ...skill, order: idx }))

  // Optimistically update local list
  localSkills.value = withOrder

  draggedIndex.value = null
  dragOverIndex.value = null

  const success = await contentStore.reorderSkills(withOrder)

  if (success) {
    uiStore.showNotification('success', 'Skills reordered successfully.')
    syncLocalSkills()
  } else {
    uiStore.showNotification('error', contentStore.error ?? 'Failed to reorder skills.')
    syncLocalSkills() // rollback to store state
  }
}

function handleDragEnd(): void {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="skills-manager">
    <!-- ── Page header ─────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="page-header__text">
        <h1 class="page-title">Skills Manager</h1>
        <p class="page-subtitle">Add, edit, reorder, or remove your tech-stack skills.</p>
      </div>

      <button
        class="btn btn-primary"
        :disabled="isLoading || isFormOpen"
        @click="openCreateForm"
      >
        <span aria-hidden="true">＋</span> Create New Skill
      </button>
    </div>

    <!-- ── Loading state ──────────────────────────────────────────────────── -->
    <div v-if="isLoading && localSkills.length === 0" class="loading-state" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <span>Loading skills…</span>
    </div>

    <div class="manager-workspace">
      <div class="manager-fields">
    <!-- ── Create / Edit form ─────────────────────────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="isFormOpen" class="skill-form-card" aria-label="Skill form">
        <h2 class="form-title">{{ isCreating ? 'Create New Skill' : 'Edit Skill' }}</h2>

        <section class="icon-upload-section" aria-label="Skill icon image">
          <div class="icon-upload-copy">
            <h3>Icon Image</h3>
            <p>Upload gambar icon skill, atau isi field icon dengan teks singkat kalau tidak pakai gambar.</p>
          </div>
          <ImageUpload
            :current-image="currentIconImage"
            :max-size="2"
            @upload="handleIconUpload"
            @remove="handleIconRemove"
          />
          <p v-if="validationErrors.icon" class="field-error">{{ validationErrors.icon }}</p>
        </section>

        <div class="form-grid">
          <TextInput
            v-model="formData.name"
            label="Name"
            placeholder="e.g. TypeScript"
            required
            :error="validationErrors.name"
            @blur="validateSingleField('name')"
          />

          <TextInput
            v-if="!isUsingImageIcon"
            v-model="formData.icon"
            label="Text Icon / Icon URL"
            placeholder="e.g. JS, Vue, or /uploads/skills/icon.png"
            :required="!pendingIconFile"
            :error="validationErrors.icon"
            @blur="validateSingleField('icon')"
          />

          <TextInput
            v-model="formData.category"
            label="Category"
            placeholder="e.g. Frontend, Backend, DevOps"
            required
            :error="validationErrors.category"
            @blur="validateSingleField('category')"
          />
        </div>

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
            {{ isCreating ? 'Create Skill' : 'Save Changes' }}
          </button>
        </div>
      </section>
    </Transition>

    <!-- ── Skills list ────────────────────────────────────────────────────── -->
    <section v-if="localSkills.length > 0" class="skills-list" aria-label="Skills list">
      <p class="drag-hint" aria-hidden="true">
        Drag rows to reorder skills.
      </p>

      <ul class="skill-rows" role="list">
        <li
          v-for="(skill, index) in localSkills"
          :key="skill.id"
          class="skill-row"
          :class="{
            'skill-row--dragging': draggedIndex === index,
            'skill-row--drag-over': dragOverIndex === index && draggedIndex !== index,
          }"
          draggable="true"
          :aria-label="`${skill.name} – ${skill.category}`"
          @dragstart="handleDragStart(index)"
          @dragover="handleDragOver($event, index)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(index)"
          @dragend="handleDragEnd"
        >
          <!-- Drag handle -->
          <span class="drag-handle" aria-hidden="true" title="Drag to reorder">⠿</span>

          <!-- Icon preview -->
          <span class="skill-icon" :title="skill.icon">
            <img
              v-if="isImageIcon(skill.icon) && !failedSkillIconIds.has(skill.id)"
              :src="resolveMediaUrl(skill.icon)"
              :alt="`${skill.name} icon`"
              class="skill-icon-img"
              @error="markSkillIconFailed(skill.id)"
            />
            <span v-else>{{ iconLabel(skill) }}</span>
          </span>

          <!-- Info -->
          <div class="skill-info">
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-category">{{ skill.category }}</span>
          </div>

          <!-- Actions -->
          <div class="skill-actions">
            <button
              type="button"
              class="btn btn-icon btn-edit"
              :disabled="isLoading"
              :aria-label="`Edit ${skill.name}`"
              @click="openEditForm(skill)"
            >
              ✏️
            </button>

            <button
              type="button"
              class="btn btn-icon btn-delete"
              :disabled="isLoading"
              :aria-label="`Delete ${skill.name}`"
              @click="requestDelete(skill)"
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
      <p class="empty-state__message">No skills yet. Click <strong>Create New Skill</strong> to add one.</p>
    </div>
      </div>

      <AdminSectionPreview
        title="Skills section"
        subtitle="Preview ikut berubah saat nama, icon, atau kategori skill diketik."
      >
        <SkillsSection :skills="previewSkills" />
      </AdminSectionPreview>
    </div>

    <!-- ── Delete confirmation dialog ────────────────────────────────────── -->
    <ConfirmDialog
      :is-open="isDeleteDialogOpen"
      title="Delete Skill"
      :message="skillToDelete ? `Are you sure you want to delete &quot;${skillToDelete.name}&quot;? This action cannot be undone.` : ''"
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.skills-manager {
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

/* ── Skill form card ─────────────────────────────────────────────────────── */
.skill-form-card {
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

.icon-upload-section {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.18);
}

.icon-upload-copy h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
}

.icon-upload-copy p {
  margin: 0.3rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.55;
}

.field-error {
  margin: 0;
  color: var(--color-accent, #ec4899);
  font-size: 0.82rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ── Skills list ─────────────────────────────────────────────────────────── */
.skills-list {
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

.skill-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skill-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1rem;
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

.skill-row:active {
  cursor: grabbing;
}

.skill-row--dragging {
  opacity: 0.45;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.skill-row--drag-over {
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

/* Icon */
.skill-icon {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
  min-width: 2.2rem;
  text-align: center;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(125, 211, 252, 0.18);
}

.skill-icon-img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

/* Info */
.skill-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}

.skill-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill-category {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Actions */
.skill-actions {
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
    max-height 0.25s ease;
  overflow: hidden;
  max-height: 600px;
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

  .skill-row {
    flex-wrap: wrap;
  }
}
</style>
