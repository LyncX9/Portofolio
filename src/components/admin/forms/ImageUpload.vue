<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props
interface Props {
  currentImage?: string
  maxSize?: number // in MB, default 5
  acceptedFormats?: string[] // MIME types, default common image types
}

const props = withDefaults(defineProps<Props>(), {
  currentImage: '',
  maxSize: 5,
  acceptedFormats: () => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
})

// Emits
const emit = defineEmits<{
  upload: [file: File]
  remove: []
}>()

// State
const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const previewUrl = ref<string>(props.currentImage || '')
const validationError = ref<string>('')
const uploadProgress = ref<number>(0)
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)

// Sync preview with currentImage prop changes
watch(
  () => props.currentImage,
  (newVal) => {
    if (newVal && !selectedFile.value) {
      previewUrl.value = newVal
    }
  }
)

// Computed
const hasImage = computed(() => !!previewUrl.value)

const acceptAttribute = computed(() =>
  props.acceptedFormats.join(',')
)

const maxSizeBytes = computed(() => props.maxSize * 1024 * 1024)

const formattedAcceptedFormats = computed(() => {
  const labels: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP'
  }
  const unique = [...new Set(props.acceptedFormats.map((f) => labels[f] ?? (f.split('/')[1] ?? f).toUpperCase()))]
  return unique.join(', ')
})

// Validation
function validateFile(file: File): string | null {
  if (!props.acceptedFormats.includes(file.type)) {
    return `Invalid file type. Accepted formats: ${formattedAcceptedFormats.value}.`
  }
  if (file.size > maxSizeBytes.value) {
    return `File size exceeds ${props.maxSize}MB limit. Please choose a smaller image.`
  }
  return null
}

// File processing
function processFile(file: File) {
  validationError.value = ''

  const error = validateFile(file)
  if (error) {
    validationError.value = error
    return
  }

  selectedFile.value = file

  // Generate preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Simulate upload progress then emit
  simulateProgress(file)
}

function simulateProgress(file: File) {
  isUploading.value = true
  uploadProgress.value = 0

  const interval = setInterval(() => {
    uploadProgress.value += 20
    if (uploadProgress.value >= 100) {
      clearInterval(interval)
      uploadProgress.value = 100
      isUploading.value = false
      emit('upload', file)
    }
  }, 80)
}

// Event handlers
function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    processFile(file)
  }
  // Reset input so the same file can be re-selected
  input.value = ''
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  const file = event.dataTransfer?.files?.[0]
  if (file) {
    processFile(file)
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

function removeImage() {
  previewUrl.value = ''
  selectedFile.value = null
  validationError.value = ''
  uploadProgress.value = 0
  isUploading.value = false
  emit('remove')
}
</script>

<template>
  <div class="image-upload">
    <!-- Current image preview -->
    <div v-if="hasImage" class="image-preview">
      <img :src="previewUrl" alt="Image preview" class="preview-img" />
      <div class="preview-overlay">
        <button
          type="button"
          class="btn-change"
          :disabled="isUploading"
          @click="openFilePicker"
          aria-label="Change image"
        >
          <span class="icon">✎</span>
          Change
        </button>
        <button
          type="button"
          class="btn-remove"
          :disabled="isUploading"
          @click="removeImage"
          aria-label="Remove image"
        >
          <span class="icon">✕</span>
          Remove
        </button>
      </div>
    </div>

    <!-- Drop zone (shown when no image) -->
    <div
      v-else
      class="drop-zone"
      :class="{ 'drop-zone--active': isDragOver }"
      role="button"
      tabindex="0"
      aria-label="Upload image. Click or drag and drop a file here."
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
      @keydown.space.prevent="openFilePicker"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="drop-zone__icon" aria-hidden="true">🖼</div>
      <p class="drop-zone__primary">
        <span class="drop-zone__link">Click to upload</span> or drag and drop
      </p>
      <p class="drop-zone__hint">
        {{ formattedAcceptedFormats }} &bull; Max {{ maxSize }}MB
      </p>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      :accept="acceptAttribute"
      class="file-input"
      aria-hidden="true"
      tabindex="-1"
      @change="onFileInputChange"
    />

    <!-- Upload progress bar -->
    <div v-if="isUploading" class="progress-bar" role="progressbar" :aria-valuenow="uploadProgress" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-bar__fill" :style="{ width: `${uploadProgress}%` }"></div>
      <span class="progress-bar__label">Uploading… {{ uploadProgress }}%</span>
    </div>

    <!-- Validation error -->
    <p v-if="validationError" class="error-message" role="alert">
      {{ validationError }}
    </p>
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ── Drop zone ─────────────────────────────────────────── */
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1.5rem;
  border: 2px dashed #cbd5e1;
  border-radius: 0.5rem;
  background-color: #f8fafc;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
  text-align: center;
  outline: none;
}

.drop-zone:hover,
.drop-zone:focus-visible {
  border-color: #6366f1;
  background-color: #eef2ff;
}

.drop-zone--active {
  border-color: #6366f1;
  background-color: #eef2ff;
}

.drop-zone__icon {
  font-size: 2.5rem;
  line-height: 1;
}

.drop-zone__primary {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
}

.drop-zone__link {
  color: #6366f1;
  font-weight: 600;
  text-decoration: underline;
}

.drop-zone__hint {
  margin: 0;
  font-size: 0.78rem;
  color: #94a3b8;
}

/* ── Preview ───────────────────────────────────────────── */
.image-preview {
  position: relative;
  display: inline-block;
  border-radius: 0.5rem;
  overflow: hidden;
  max-width: 100%;
}

.preview-img {
  display: block;
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 0.5rem;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background-color: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 0.5rem;
}

.image-preview:hover .preview-overlay,
.image-preview:focus-within .preview-overlay {
  opacity: 1;
}

.btn-change,
.btn-remove {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-change:disabled,
.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-change {
  background-color: #ffffff;
  color: #1e293b;
}

.btn-change:hover:not(:disabled) {
  background-color: #f1f5f9;
}

.btn-remove {
  background-color: #ef4444;
  color: #ffffff;
}

.btn-remove:hover:not(:disabled) {
  background-color: #dc2626;
}

.icon {
  font-style: normal;
}

/* ── Hidden file input ─────────────────────────────────── */
.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ── Progress bar ──────────────────────────────────────── */
.progress-bar {
  position: relative;
  height: 0.5rem;
  background-color: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background-color: #6366f1;
  border-radius: 9999px;
  transition: width 0.1s linear;
}

.progress-bar__label {
  position: absolute;
  top: 0.6rem;
  left: 0;
  font-size: 0.75rem;
  color: #64748b;
}

/* ── Error message ─────────────────────────────────────── */
.error-message {
  margin: 0;
  font-size: 0.8rem;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.error-message::before {
  content: '⚠';
}
</style>
