<script setup lang="ts">
defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  type?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="text-input-wrapper">
    <label v-if="label" class="text-input-label">
      {{ label }}
      <span v-if="required" class="required-indicator" aria-hidden="true">*</span>
    </label>

    <input
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :aria-required="required"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${label}-error` : undefined"
      class="text-input"
      :class="{ 'text-input--error': error, 'text-input--disabled': disabled }"
      @input="onInput"
    />

    <p v-if="error" :id="`${label}-error`" class="text-input-error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.text-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.text-input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-indicator {
  color: var(--color-accent);
  font-weight: 700;
  line-height: 1;
}

.text-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9375rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  outline: none;
}

.text-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.text-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
}

.text-input--error {
  border-color: var(--color-accent);
}

.text-input--error:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.2);
}

.text-input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-input-error {
  font-size: 0.8125rem;
  color: var(--color-accent);
  margin: 0;
}
</style>
