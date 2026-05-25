<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  currentImage?: string
  maxSize?: number
  acceptedFormats?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  currentImage: '',
  maxSize: 5,
  acceptedFormats: () => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
})

const emit = defineEmits<{
  upload: [file: File]
  remove: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const previewUrl = ref<string>(props.currentImage || '')
const validationError = ref('')
const uploadProgress = ref(0)
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const imageLoadFailed = ref(false)

watch(
  () => props.currentImage,
  (newVal) => {
    imageLoadFailed.value = false

    if (newVal && !selectedFile.value) {
      previewUrl.value = newVal
      return
    }

    if (!newVal && !selectedFile.value) {
      previewUrl.value = ''
    }
  },
)

const hasImage = computed(() => !!previewUrl.value)

const acceptAttribute = computed(() => props.acceptedFormats.join(','))

const maxSizeBytes = computed(() => props.maxSize * 1024 * 1024)

const formattedAcceptedFormats = computed(() => {
  const labels: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
  }
  const unique = [
    ...new Set(
      props.acceptedFormats.map(
        (format) => labels[format] ?? (format.split('/')[1] ?? format).toUpperCase(),
      ),
    ),
  ]
  return unique.join(', ')
})

function validateFile(file: File): string | null {
  if (!props.acceptedFormats.includes(file.type)) {
    return `Invalid file type. Accepted formats: ${formattedAcceptedFormats.value}.`
  }

  if (file.size > maxSizeBytes.value) {
    return `File size exceeds ${props.maxSize}MB limit. Please choose a smaller image.`
  }

  return null
}

function processFile(file: File) {
  validationError.value = ''

  const error = validateFile(file)
  if (error) {
    validationError.value = error
    return
  }

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (event) => {
    imageLoadFailed.value = false
    previewUrl.value = event.target?.result as string
  }
  reader.readAsDataURL(file)

  simulateProgress(file)
}

function simulateProgress(file: File) {
  isUploading.value = true
  uploadProgress.value = 0

  const interval = window.setInterval(() => {
    uploadProgress.value += 20

    if (uploadProgress.value >= 100) {
      window.clearInterval(interval)
      uploadProgress.value = 100
      isUploading.value = false
      emit('upload', file)
    }
  }, 80)
}

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    processFile(file)
  }

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
  imageLoadFailed.value = false
  validationError.value = ''
  uploadProgress.value = 0
  isUploading.value = false
  emit('remove')
}

function onImageError() {
  imageLoadFailed.value = true
}
</script>

<template>
  <div class="image-upload">
    <div v-if="hasImage" class="image-preview-card">
      <div class="preview-media">
        <img
          v-if="!imageLoadFailed"
          :src="previewUrl"
          alt="Image preview"
          class="preview-img"
          @error="onImageError"
        />
        <div v-else class="preview-fallback" role="status">
          <span class="preview-fallback__mark" aria-hidden="true">IMG</span>
          <span class="preview-fallback__text">Image could not be loaded</span>
        </div>
      </div>

      <div class="preview-actions" aria-label="Image actions">
        <button
          type="button"
          class="btn-change"
          :disabled="isUploading"
          aria-label="Change image"
          @click="openFilePicker"
        >
          <span class="action-icon" aria-hidden="true">+</span>
          Change
        </button>
        <button
          type="button"
          class="btn-remove"
          :disabled="isUploading"
          aria-label="Remove image"
          @click="removeImage"
        >
          <span class="action-icon action-icon--remove" aria-hidden="true">x</span>
          Remove
        </button>
      </div>
    </div>

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
      <div class="drop-zone__icon" aria-hidden="true">IMG</div>
      <p class="drop-zone__primary">
        <span class="drop-zone__link">Click to upload</span> or drag and drop
      </p>
      <p class="drop-zone__hint">{{ formattedAcceptedFormats }} - Max {{ maxSize }}MB</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      :accept="acceptAttribute"
      class="file-input"
      aria-hidden="true"
      tabindex="-1"
      @change="onFileInputChange"
    />

    <div
      v-if="isUploading"
      class="progress-bar"
      role="progressbar"
      :aria-valuenow="uploadProgress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="progress-bar__fill" :style="{ width: `${uploadProgress}%` }"></div>
      <span class="progress-bar__label">Uploading... {{ uploadProgress }}%</span>
    </div>

    <p v-if="validationError" class="error-message" role="alert">
      {{ validationError }}
    </p>
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.drop-zone {
  display: flex;
  min-height: 176px;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px dashed rgba(102, 214, 255, 0.45);
  border-radius: 0.75rem;
  outline: none;
  background:
    linear-gradient(135deg, rgba(102, 214, 255, 0.1), rgba(168, 85, 247, 0.08)),
    rgba(12, 18, 34, 0.74);
  color: #e8e8f4;
  padding: 2rem 1.5rem;
  text-align: center;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}

.drop-zone:hover,
.drop-zone:focus-visible {
  border-color: rgba(102, 214, 255, 0.8);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.22),
    0 0 0 3px rgba(102, 214, 255, 0.12);
  transform: translateY(-1px);
}

.drop-zone--active {
  border-color: rgba(168, 85, 247, 0.9);
  background:
    linear-gradient(135deg, rgba(102, 214, 255, 0.18), rgba(168, 85, 247, 0.16)),
    rgba(12, 18, 34, 0.86);
}

.drop-zone__icon {
  display: grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
  border: 1px solid rgba(102, 214, 255, 0.36);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.06);
  color: #66d6ff;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1;
}

.drop-zone__primary {
  margin: 0;
  color: #f5f3ff;
  font-size: 0.95rem;
}

.drop-zone__link {
  color: #66d6ff;
  font-weight: 800;
  text-decoration: none;
}

.drop-zone__hint {
  margin: 0;
  color: rgba(232, 232, 244, 0.62);
  font-size: 0.78rem;
}

.image-preview-card {
  display: grid;
  overflow: hidden;
  width: 100%;
  max-width: 680px;
  min-height: 154px;
  grid-template-columns: minmax(128px, 0.9fr) minmax(0, 1fr);
  align-items: stretch;
  border: 1px solid rgba(102, 214, 255, 0.22);
  border-radius: 0.85rem;
  background:
    linear-gradient(135deg, rgba(102, 214, 255, 0.08), rgba(168, 85, 247, 0.08)),
    rgba(12, 18, 34, 0.78);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
}

.preview-media {
  position: relative;
  display: grid;
  min-height: 154px;
  overflow: hidden;
  place-items: center;
  background: rgba(5, 9, 20, 0.58);
}

.preview-img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 154px;
  object-fit: cover;
}

.preview-fallback {
  display: flex;
  min-height: 154px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1rem;
  color: rgba(232, 232, 244, 0.72);
  text-align: center;
}

.preview-fallback__mark {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  border: 1px solid rgba(102, 214, 255, 0.34);
  border-radius: 1rem;
  color: #66d6ff;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0;
}

.preview-fallback__text {
  max-width: 12rem;
  font-size: 0.82rem;
  line-height: 1.35;
}

.preview-actions {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  padding: 1rem;
}

.btn-change,
.btn-remove {
  display: inline-flex;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-height: 2.85rem;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid transparent;
  border-radius: 0.7rem;
  padding: 0.72rem 0.85rem;
  font-size: 0.9rem;
  font-weight: 800;
  transition:
    background-color 0.16s,
    border-color 0.16s,
    color 0.16s,
    transform 0.16s,
    box-shadow 0.16s;
}

.btn-change:disabled,
.btn-remove:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-change {
  border-color: rgba(102, 214, 255, 0.38);
  background: rgba(102, 214, 255, 0.12);
  color: #f5f3ff;
}

.btn-change:hover:not(:disabled) {
  border-color: rgba(102, 214, 255, 0.68);
  background: rgba(102, 214, 255, 0.2);
  box-shadow: 0 10px 24px rgba(102, 214, 255, 0.12);
  transform: translateY(-1px);
}

.btn-remove {
  border-color: rgba(255, 84, 112, 0.38);
  background: rgba(255, 84, 112, 0.14);
  color: #ffd7df;
}

.btn-remove:hover:not(:disabled) {
  border-color: rgba(255, 84, 112, 0.72);
  background: rgba(255, 84, 112, 0.22);
  box-shadow: 0 10px 24px rgba(255, 84, 112, 0.13);
  transform: translateY(-1px);
}

.action-icon {
  display: grid;
  width: 1.4rem;
  height: 1.4rem;
  place-items: center;
  border-radius: 999px;
  background: rgba(102, 214, 255, 0.18);
  color: #66d6ff;
  font-size: 1rem;
  line-height: 1;
}

.action-icon--remove {
  background: rgba(255, 84, 112, 0.18);
  color: #ff8fa2;
}

.file-input {
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  margin: -1px;
  border: 0;
  padding: 0;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.progress-bar {
  position: relative;
  overflow: hidden;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: rgba(232, 232, 244, 0.14);
}

.progress-bar__fill {
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, #66d6ff, #a855f7);
  transition: width 0.1s linear;
}

.progress-bar__label {
  position: absolute;
  top: 0.6rem;
  left: 0;
  color: rgba(232, 232, 244, 0.62);
  font-size: 0.75rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  color: #ef4444;
  font-size: 0.8rem;
}

.error-message::before {
  display: inline-grid;
  width: 1rem;
  height: 1rem;
  place-items: center;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.15);
  content: '!';
  font-size: 0.7rem;
  font-weight: 800;
}

@media (max-width: 620px) {
  .image-preview-card {
    grid-template-columns: 1fr;
  }

  .preview-actions {
    padding: 0.85rem;
  }

  .btn-change,
  .btn-remove {
    flex: 1 1 100%;
  }
}
</style>
