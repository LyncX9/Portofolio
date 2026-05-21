<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  rows?: number
  required?: boolean
  error?: string
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: '',
  rows: 4,
  required: false,
  error: '',
  maxLength: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const charCount = computed(() => props.modelValue?.length ?? 0)

const showCharCount = computed(() => props.maxLength > 0)

const isOverLimit = computed(() => props.maxLength > 0 && charCount.value > props.maxLength)

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  autoResize()
}

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  // Reset height to allow shrinking
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

// Re-run auto-resize whenever the value changes externally
watch(
  () => props.modelValue,
  async () => {
    await nextTick()
    autoResize()
  },
)

onMounted(async () => {
  await nextTick()
  autoResize()
})
</script>

<template>
  <div class="textarea-field">
    <label v-if="label" class="textarea-label">
      {{ label }}
      <span v-if="required" class="required-indicator" aria-hidden="true">*</span>
    </label>

    <div class="textarea-wrapper" :class="{ 'has-error': error }">
      <textarea
        ref="textareaRef"
        class="textarea-input"
        :value="modelValue"
        :placeholder="placeholder"
        :rows="rows"
        :required="required"
        :maxlength="maxLength > 0 ? maxLength : undefined"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${label}-error` : undefined"
        @input="handleInput"
      />
    </div>

    <div class="textarea-footer">
      <span
        v-if="error"
        :id="`${label}-error`"
        class="error-message"
        role="alert"
      >
        {{ error }}
      </span>
      <span v-else class="footer-spacer" />

      <span
        v-if="showCharCount"
        class="char-count"
        :class="{ 'over-limit': isOverLimit }"
        aria-live="polite"
      >
        {{ charCount }}&nbsp;/&nbsp;{{ maxLength }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.textarea-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.textarea-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 4px;
}

.required-indicator {
  color: var(--color-accent);
  font-size: 0.875rem;
  line-height: 1;
}

.textarea-wrapper {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background-secondary);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.textarea-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
}

.textarea-wrapper.has-error {
  border-color: var(--color-accent);
}

.textarea-wrapper.has-error:focus-within {
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15);
}

.textarea-input {
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9375rem;
  line-height: 1.6;
  resize: none; /* auto-resize handles this */
  overflow: hidden;
  min-height: 80px;
  display: block;
  border-radius: 8px;
}

.textarea-input::placeholder {
  color: var(--color-text-secondary);
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 1.25rem;
}

.footer-spacer {
  flex: 1;
}

.error-message {
  font-size: 0.8125rem;
  color: var(--color-accent);
  flex: 1;
}

.char-count {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  margin-left: 8px;
  flex-shrink: 0;
}

.char-count.over-limit {
  color: var(--color-accent);
  font-weight: 600;
}
</style>
