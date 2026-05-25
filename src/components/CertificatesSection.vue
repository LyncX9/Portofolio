<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Certificate } from '@/types'

const props = defineProps<{
  certificates?: Certificate[] | null
}>()

const displayCertificates = computed(() => props.certificates ?? [])

const failedImages = ref<Set<string>>(new Set())
const selectedCertificate = ref<Certificate | null>(null)

function markImageFailed(id: string): void {
  failedImages.value = new Set([...failedImages.value, id])
}

function canPreviewCertificate(certificate: Certificate): boolean {
  return Boolean(certificate.image && !failedImages.value.has(certificate.id))
}

function openCertificatePreview(certificate: Certificate): void {
  if (!canPreviewCertificate(certificate)) return
  selectedCertificate.value = certificate
}

function closeCertificatePreview(): void {
  selectedCertificate.value = null
}
</script>

<template>
  <section id="certificates" class="certificates">
    <div class="certificates-container">
      <div class="section-heading">
        <span class="section-kicker">Credentials</span>
        <h2 class="section-title">Certificates</h2>
      </div>

      <div v-if="displayCertificates.length > 0" class="certificates-grid">
        <article
          v-for="certificate in displayCertificates"
          :key="certificate.id"
          class="certificate-card"
        >
          <button
            type="button"
            class="certificate-media"
            :class="{ 'certificate-media--clickable': canPreviewCertificate(certificate) }"
            :disabled="!canPreviewCertificate(certificate)"
            :aria-label="`View ${certificate.title} certificate fullscreen`"
            @click="openCertificatePreview(certificate)"
          >
            <img
              v-if="certificate.image && !failedImages.has(certificate.id)"
              :src="certificate.image"
              :alt="certificate.title"
              class="certificate-image"
              @error="markImageFailed(certificate.id)"
            />
            <div v-else class="certificate-placeholder" aria-hidden="true">
              <span>CR</span>
            </div>
            <span
              v-if="canPreviewCertificate(certificate)"
              class="certificate-media__action"
              aria-hidden="true"
            >
              View full
            </span>
          </button>

          <div class="certificate-content">
            <div>
              <p class="certificate-meta">{{ certificate.issuer }} • {{ certificate.issuedAt }}</p>
              <h3>{{ certificate.title }}</h3>
            </div>
            <p class="certificate-description">{{ certificate.description }}</p>
            <a
              v-if="certificate.credentialUrl"
              :href="certificate.credentialUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="certificate-link"
            >
              View credential
            </a>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <p class="empty-state__title">No certificates yet</p>
        <p class="empty-state__text">Certificates you add from the admin dashboard will appear here.</p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="selectedCertificate"
        class="certificate-viewer"
        role="dialog"
        aria-modal="true"
        :aria-label="`${selectedCertificate.title} certificate preview`"
        @click.self="closeCertificatePreview"
      >
        <div class="certificate-viewer__panel">
          <div class="certificate-viewer__header">
            <div>
              <p>{{ selectedCertificate.issuer }} â€¢ {{ selectedCertificate.issuedAt }}</p>
              <h3>{{ selectedCertificate.title }}</h3>
            </div>
            <button
              type="button"
              class="certificate-viewer__close"
              aria-label="Close certificate preview"
              @click="closeCertificatePreview"
            >
              X
            </button>
          </div>
          <div class="certificate-viewer__image-wrap">
            <img
              :src="selectedCertificate.image"
              :alt="selectedCertificate.title"
              class="certificate-viewer__image"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.certificates {
  padding: 6rem 2rem;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(20, 24, 43, 0.82)),
    var(--color-background);
}

.certificates-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-heading {
  margin-bottom: 2rem;
}

.section-kicker {
  display: inline-flex;
  margin-bottom: 0.5rem;
  color: #38bdf8;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.section-title {
  margin: 0;
  color: var(--color-text);
  font-size: 2.5rem;
  line-height: 1.15;
}

.certificates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 320px));
  gap: 1.25rem;
  justify-content: center;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 220px;
  padding: 2rem;
  text-align: center;
  border: 1px dashed rgba(148, 163, 184, 0.26);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.36);
}

.empty-state__title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.3rem;
  font-weight: 800;
}

.empty-state__text {
  margin: 0.6rem 0 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.certificate-card {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.74);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.certificate-card:hover {
  transform: translateY(-4px);
  border-color: rgba(56, 189, 248, 0.48);
  box-shadow: 0 30px 90px rgba(14, 165, 233, 0.16);
}

.certificate-media {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  padding: 0;
  border: 0;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(16, 185, 129, 0.1));
  overflow: hidden;
}

.certificate-media:disabled {
  cursor: default;
}

.certificate-media--clickable {
  cursor: zoom-in;
}

.certificate-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: rgba(2, 6, 23, 0.48);
  transition: transform 0.3s ease;
}

.certificate-media--clickable:hover .certificate-image {
  transform: scale(1.03);
}

.certificate-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.certificate-placeholder span {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 16px;
  color: #e0f2fe;
  font-size: 1.05rem;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.72);
}

.certificate-media__action {
  position: absolute;
  right: 0.8rem;
  bottom: 0.8rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(186, 230, 253, 0.42);
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.72);
  color: #e0f2fe;
  font-size: 0.78rem;
  font-weight: 800;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.certificate-media--clickable:hover .certificate-media__action {
  opacity: 1;
  transform: translateY(0);
}

.certificate-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.certificate-meta {
  margin: 0 0 0.35rem;
  color: #7dd3fc;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.certificate-content h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.15rem;
}

.certificate-description {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.65;
}

.certificate-link {
  align-self: flex-start;
  color: #bae6fd;
  font-weight: 700;
  transition: color 0.2s ease, transform 0.2s ease;
}

.certificate-link:hover {
  color: #ffffff;
  transform: translateX(4px);
}

.certificate-viewer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(2, 6, 23, 0.86);
  backdrop-filter: blur(14px);
}

.certificate-viewer__panel {
  width: min(1120px, 100%);
  max-height: min(860px, 92vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.96);
  box-shadow: 0 32px 100px rgba(0, 0, 0, 0.45);
}

.certificate-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.certificate-viewer__header p {
  margin: 0 0 0.25rem;
  color: #7dd3fc;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.certificate-viewer__header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
}

.certificate-viewer__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  color: var(--color-text);
  font-weight: 800;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.certificate-viewer__close:hover {
  border-color: rgba(56, 189, 248, 0.58);
  color: #7dd3fc;
  transform: rotate(90deg);
}

.certificate-viewer__image-wrap {
  min-height: 0;
  padding: 1rem;
  display: grid;
  place-items: center;
}

.certificate-viewer__image {
  max-width: 100%;
  max-height: calc(92vh - 6.5rem);
  object-fit: contain;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.55);
}

@media (max-width: 768px) {
  .certificates {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .certificates-grid {
    grid-template-columns: minmax(0, min(320px, 100%));
  }

  .certificate-viewer {
    padding: 0.75rem;
  }

  .certificate-viewer__header {
    align-items: flex-start;
  }
}
</style>
