<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import TextInput from '@/components/admin/forms/TextInput.vue'
import TextArea from '@/components/admin/forms/TextArea.vue'
import ImageUpload from '@/components/admin/forms/ImageUpload.vue'
import AdminSectionPreview from '@/components/admin/AdminSectionPreview.vue'
import CertificatesSection from '@/components/CertificatesSection.vue'
import { useContentStore } from '@/stores/content'
import { useUiStore } from '@/stores/ui'
import { imageService } from '@/services/imageService'
import { certificateSchema, getValidationErrors } from '@/types/schemas'
import type { Certificate } from '@/types'

const contentStore = useContentStore()
const uiStore = useUiStore()

const isFormOpen = ref(false)
const isSaving = ref(false)
const editingCertificate = ref<Certificate | null>(null)
const pendingImageFile = ref<File | null>(null)
const pendingImagePreview = ref<string>('')
const validationErrors = reactive<Record<string, string>>({})

const form = reactive({
  title: '',
  issuer: '',
  issuedAt: '',
  description: '',
  image: '',
  credentialUrl: '',
})

const certificates = computed(() => contentStore.certificatesList)
const isEditing = computed(() => editingCertificate.value !== null)
const isSaveDisabled = computed(() => isSaving.value || Object.keys(validationErrors).length > 0)

const previewCertificates = computed<Certificate[]>(() => {
  const current = [...certificates.value]
  if (!isFormOpen.value) return current

  const draft: Certificate = {
    id: editingCertificate.value?.id ?? 'draft-certificate',
    title: form.title || 'New Certificate',
    issuer: form.issuer || 'Issuer',
    issuedAt: form.issuedAt || 'Year',
    description: form.description || 'Certificate description will appear here.',
    image: pendingImagePreview.value || form.image,
    credentialUrl: form.credentialUrl || undefined,
    order: editingCertificate.value?.order ?? current.length,
  }

  if (editingCertificate.value) {
    const index = current.findIndex((certificate) => certificate.id === editingCertificate.value?.id)
    if (index >= 0) current[index] = draft
    return current
  }

  return [...current, draft]
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

onMounted(async () => {
  if (!contentStore.isContentLoaded) {
    await contentStore.loadContent()
  }
})

onBeforeUnmount(() => {
  if (pendingImagePreview.value) {
    URL.revokeObjectURL(pendingImagePreview.value)
  }
})

function resetForm(): void {
  editingCertificate.value = null
  pendingImageFile.value = null
  Object.assign(form, {
    title: '',
    issuer: '',
    issuedAt: '',
    description: '',
    image: '',
    credentialUrl: '',
  })
  Object.keys(validationErrors).forEach((key) => delete validationErrors[key])
}

function openCreateForm(): void {
  resetForm()
  isFormOpen.value = true
}

function openEditForm(certificate: Certificate): void {
  editingCertificate.value = { ...certificate }
  pendingImageFile.value = null
  Object.assign(form, {
    title: certificate.title,
    issuer: certificate.issuer,
    issuedAt: certificate.issuedAt,
    description: certificate.description,
    image: certificate.image,
    credentialUrl: certificate.credentialUrl ?? '',
  })
  Object.keys(validationErrors).forEach((key) => delete validationErrors[key])
  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  resetForm()
}

function buildValidationPayload(): Certificate {
  return {
    id: editingCertificate.value?.id ?? 'temp-id',
    title: form.title.trim(),
    issuer: form.issuer.trim(),
    issuedAt: form.issuedAt.trim(),
    description: form.description.trim(),
    image: pendingImageFile.value ? '/images/certificate.jpg' : form.image,
    credentialUrl: form.credentialUrl.trim() || '',
    order: editingCertificate.value?.order ?? 0,
  }
}

function validateForm(): boolean {
  Object.keys(validationErrors).forEach((key) => delete validationErrors[key])
  const result = certificateSchema.safeParse(buildValidationPayload())

  if (!result.success) {
    Object.assign(validationErrors, getValidationErrors(result.error))
    if (pendingImageFile.value) {
      delete validationErrors.image
    }
  }

  return Object.keys(validationErrors).length === 0
}

function handleImageUpload(file: File): void {
  pendingImageFile.value = file
  delete validationErrors.image
}

function handleImageRemove(): void {
  pendingImageFile.value = null
  form.image = ''
}

function extractFilename(url: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    return parsed.pathname.split('/').pop() ?? ''
  } catch {
    return url.split('/').pop() ?? ''
  }
}

async function uploadPendingImage(): Promise<string | null> {
  if (!pendingImageFile.value) return form.image

  const oldFilename = extractFilename(form.image)
  const uploadResponse = oldFilename
    ? await imageService.replaceImage(oldFilename, pendingImageFile.value, 'certificates')
    : await imageService.uploadImage(pendingImageFile.value, 'certificates')

  if (!uploadResponse.success || !uploadResponse.data) {
    uiStore.showNotification('error', uploadResponse.error ?? 'Certificate image upload failed.')
    return null
  }

  return uploadResponse.data.url
}

async function handleSave(): Promise<void> {
  if (!validateForm()) {
    uiStore.showNotification('error', 'Please fix the certificate form first.')
    return
  }

  isSaving.value = true

  try {
    const imageUrl = await uploadPendingImage()
    if (imageUrl === null) return

    const payload = {
      title: form.title.trim(),
      issuer: form.issuer.trim(),
      issuedAt: form.issuedAt.trim(),
      description: form.description.trim(),
      image: imageUrl,
      credentialUrl: form.credentialUrl.trim() || undefined,
    }

    if (editingCertificate.value) {
      const success = await contentStore.updateCertificate(editingCertificate.value.id, {
        ...editingCertificate.value,
        ...payload,
      })
      if (!success) {
        uiStore.showNotification('error', contentStore.error ?? 'Failed to update certificate.')
        return
      }
      uiStore.showNotification('success', 'Certificate updated.')
    } else {
      const created = await contentStore.createCertificate(payload)
      if (!created) {
        uiStore.showNotification('error', contentStore.error ?? 'Failed to create certificate.')
        return
      }
      uiStore.showNotification('success', 'Certificate created.')
    }

    closeForm()
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(certificate: Certificate): Promise<void> {
  const confirmed = window.confirm(`Delete "${certificate.title}"?`)
  if (!confirmed) return

  const success = await contentStore.deleteCertificate(certificate.id)
  if (success) {
    uiStore.showNotification('success', 'Certificate deleted.')
    return
  }
  uiStore.showNotification('error', contentStore.error ?? 'Failed to delete certificate.')
}
</script>

<template>
  <div class="certificates-manager">
    <div class="page-header">
      <div>
        <h1 class="page-title">Certificates</h1>
        <p class="page-subtitle">Add course certificates, awards, or credentials shown on the portfolio.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreateForm">
        Add Certificate
      </button>
    </div>

    <section v-if="isFormOpen" class="certificate-form">
      <h2 class="form-title">{{ isEditing ? 'Edit Certificate' : 'New Certificate' }}</h2>

      <ImageUpload
        :current-image="form.image"
        :max-size="5"
        @upload="handleImageUpload"
        @remove="handleImageRemove"
      />
      <p v-if="validationErrors.image" class="field-error">{{ validationErrors.image }}</p>

      <div class="form-grid">
        <TextInput
          v-model="form.title"
          label="Title"
          placeholder="Frontend Development Certificate"
          required
          :error="validationErrors.title"
        />
        <TextInput
          v-model="form.issuer"
          label="Issuer"
          placeholder="Dicoding, Coursera, Google, etc."
          required
          :error="validationErrors.issuer"
        />
        <TextInput
          v-model="form.issuedAt"
          label="Issue Date"
          placeholder="2025"
          required
          :error="validationErrors.issuedAt"
        />
        <TextInput
          v-model="form.credentialUrl"
          label="Credential Link"
          placeholder="https://example.com/credential"
          :error="validationErrors.credentialUrl"
        />
      </div>

      <TextArea
        v-model="form.description"
        label="Description"
        placeholder="Short explanation of what this certificate proves..."
        required
        :rows="4"
        :error="validationErrors.description"
      />

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" :disabled="isSaving" @click="closeForm">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" :disabled="isSaveDisabled" @click="handleSave">
          {{ isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Certificate' }}
        </button>
      </div>
    </section>

    <div class="manager-workspace">
      <div class="manager-fields">

    <section v-if="certificates.length > 0" class="certificates-list">
      <article v-for="certificate in certificates" :key="certificate.id" class="certificate-row">
        <img
          v-if="certificate.image"
          :src="certificate.image"
          :alt="certificate.title"
          class="certificate-thumb"
        />
        <div v-else class="certificate-thumb certificate-thumb--empty">CR</div>
        <div class="certificate-info">
          <h2>{{ certificate.title }}</h2>
          <p>{{ certificate.issuer }} • {{ certificate.issuedAt }}</p>
          <span>{{ certificate.description }}</span>
        </div>
        <div class="row-actions">
          <button type="button" class="btn btn-secondary" @click="openEditForm(certificate)">
            Edit
          </button>
          <button type="button" class="btn btn-danger" @click="handleDelete(certificate)">
            Delete
          </button>
        </div>
      </article>
    </section>

    <p v-else-if="!contentStore.isLoading" class="empty-state">
      No certificates yet. Add your first credential.
    </p>
      </div>

      <AdminSectionPreview
        title="Certificates section"
        subtitle="Certificate yang sedang kamu input akan terlihat di preview ini."
      >
        <CertificatesSection :certificates="previewCertificates" />
      </AdminSectionPreview>
    </div>
  </div>
</template>

<style scoped>
.certificates-manager {
  max-width: none;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  gap: 0.85rem;
}

.page-header,
.certificate-row,
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.5rem;
}

.page-subtitle {
  margin: 0.35rem 0 0;
  color: var(--color-text-secondary);
}

.certificate-form,
.certificate-row,
.empty-state {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-secondary);
  padding: 1.25rem;
}

.form-title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.1rem;
}

.certificate-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.field-error {
  color: var(--color-error);
  font-size: 0.82rem;
}

.certificates-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.certificate-row {
  align-items: flex-start;
}

.certificate-thumb {
  width: 92px;
  height: 68px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--color-background-tertiary);
  flex-shrink: 0;
}

.certificate-thumb--empty {
  display: grid;
  place-items: center;
  color: var(--color-primary-light);
  font-weight: 800;
}

.certificate-info {
  flex: 1;
  min-width: 0;
}

.certificate-info h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
}

.certificate-info p,
.certificate-info span {
  color: var(--color-text-secondary);
  font-size: 0.88rem;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-state {
  color: var(--color-text-secondary);
  text-align: center;
}

@media (max-width: 1100px) {
  .manager-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-header,
  .certificate-row,
  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .certificate-thumb {
    width: 100%;
    height: 160px;
  }
}
</style>
