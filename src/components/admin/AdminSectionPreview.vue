<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <aside class="admin-section-preview" aria-label="Live website preview">
    <div class="preview-header">
      <div>
        <p class="preview-kicker">Live Preview</p>
        <h2>{{ title ?? 'Website preview' }}</h2>
      </div>
      <span class="preview-dot" aria-hidden="true"></span>
    </div>
    <p v-if="subtitle" class="preview-subtitle">{{ subtitle }}</p>
    <div class="preview-shell">
      <div class="preview-toolbar" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="preview-body">
        <slot />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.admin-section-preview {
  position: sticky;
  top: var(--space-6);
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  min-width: 0;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.preview-kicker {
  margin: 0 0 0.25rem;
  color: #7dd3fc;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.preview-header h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  line-height: 1.25;
}

.preview-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
  flex-shrink: 0;
}

.preview-subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  line-height: 1.6;
}

.preview-shell {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  background: #0f172a;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26);
}

.preview-toolbar {
  display: flex;
  gap: 0.4rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.94);
}

.preview-toolbar span {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.55);
}

.preview-toolbar span:first-child {
  background: #fb7185;
}

.preview-toolbar span:nth-child(2) {
  background: #facc15;
}

.preview-toolbar span:nth-child(3) {
  background: #22c55e;
}

.preview-body {
  max-height: 640px;
  overflow: auto;
  background: var(--color-background);
}

.preview-body :deep(section) {
  min-height: auto;
  padding: 2rem 1rem;
}

.preview-body :deep(.hero-container),
.preview-body :deep(.about-content),
.preview-body :deep(.project-card) {
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

.preview-body :deep(.hero-title),
.preview-body :deep(.section-title),
.preview-body :deep(.section-heading .section-title) {
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  margin-bottom: 1.25rem;
}

.preview-body :deep(.greeting .gradient-text) {
  font-size: 1.35rem;
}

.preview-body :deep(.ava),
.preview-body :deep(.about-image) {
  justify-content: flex-start;
}

.preview-body :deep(.ava-img) {
  width: min(220px, 100%);
  height: auto;
}

.preview-body :deep(.project-image) {
  height: 190px;
}

.preview-body :deep(.project-content),
.preview-body :deep(.experience-card),
.preview-body :deep(.certificate-content) {
  padding: 1.25rem;
}

.preview-body :deep(.tech-grid),
.preview-body :deep(.certificates-grid),
.preview-body :deep(.experience-grid) {
  grid-template-columns: 1fr;
  gap: 1rem;
}

.preview-body :deep(.social-links) {
  gap: 0.8rem;
}

@media (max-width: 1100px) {
  .admin-section-preview {
    position: static;
  }
}
</style>
