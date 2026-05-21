<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string[]
  label?: string
  placeholder?: string
  addButtonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: 'Add item…',
  addButtonText: 'Add',
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

// ── Local state ──────────────────────────────────────────────────────────────

const newItemText = ref('')

// Drag-and-drop state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// ── Computed ─────────────────────────────────────────────────────────────────

const items = computed(() => props.modelValue ?? [])

const canAdd = computed(() => newItemText.value.trim().length > 0)

// ── Item manipulation ─────────────────────────────────────────────────────────

function addItem() {
  const text = newItemText.value.trim()
  if (!text) return
  emit('update:modelValue', [...items.value, text])
  newItemText.value = ''
}

function removeItem(index: number) {
  const updated = items.value.filter((_, i) => i !== index)
  emit('update:modelValue', updated)
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    addItem()
  }
}

// ── Drag-and-drop reordering ──────────────────────────────────────────────────

function onDragStart(event: DragEvent, index: number) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    // Store index as plain text so the browser has something to transfer
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault()
  const from = draggedIndex.value
  if (from === null || from === targetIndex) {
    resetDrag()
    return
  }

  const updated = [...items.value]
  const removed = updated.splice(from, 1)
  if (removed.length === 0) {
    resetDrag()
    return
  }
  updated.splice(targetIndex, 0, removed[0] as string)
  emit('update:modelValue', updated)
  resetDrag()
}

function onDragEnd() {
  resetDrag()
}

function resetDrag() {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="array-input">
    <!-- Label -->
    <label v-if="label" class="array-input__label">{{ label }}</label>

    <!-- Item list -->
    <ul v-if="items.length > 0" class="array-input__list" role="list" aria-label="Items list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="array-input__item"
        :class="{
          'array-input__item--dragging': draggedIndex === index,
          'array-input__item--drag-over': dragOverIndex === index && draggedIndex !== index,
        }"
        draggable="true"
        :aria-label="`Item ${index + 1}: ${item}`"
        @dragstart="onDragStart($event, index)"
        @dragover="onDragOver($event, index)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, index)"
        @dragend="onDragEnd"
      >
        <!-- Drag handle -->
        <span
          class="array-input__drag-handle"
          aria-hidden="true"
          title="Drag to reorder"
        >
          ⠿
        </span>

        <!-- Item text -->
        <span class="array-input__item-text">{{ item }}</span>

        <!-- Remove button -->
        <button
          type="button"
          class="array-input__remove-btn"
          :aria-label="`Remove item: ${item}`"
          @click="removeItem(index)"
        >
          ✕
        </button>
      </li>
    </ul>

    <!-- Empty state -->
    <p v-else class="array-input__empty">No items yet. Add one below.</p>

    <!-- Add new item row -->
    <div class="array-input__add-row">
      <input
        v-model="newItemText"
        type="text"
        class="array-input__text-input"
        :placeholder="placeholder"
        aria-label="New item text"
        @keydown="onInputKeydown"
      />
      <button
        type="button"
        class="array-input__add-btn"
        :disabled="!canAdd"
        :aria-disabled="!canAdd"
        @click="addItem"
      >
        {{ addButtonText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.array-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ── Label ───────────────────────────────────────────────────────────────── */
.array-input__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

/* ── List ────────────────────────────────────────────────────────────────── */
.array-input__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

/* ── Item ────────────────────────────────────────────────────────────────── */
.array-input__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: grab;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    opacity 0.15s ease;
  user-select: none;
}

.array-input__item:active {
  cursor: grabbing;
}

.array-input__item--dragging {
  opacity: 0.4;
  border-color: var(--color-primary);
}

.array-input__item--drag-over {
  border-color: var(--color-primary);
  background-color: rgba(168, 85, 247, 0.08);
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.25);
}

/* ── Drag handle ─────────────────────────────────────────────────────────── */
.array-input__drag-handle {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  line-height: 1;
  flex-shrink: 0;
  cursor: grab;
}

/* ── Item text ───────────────────────────────────────────────────────────── */
.array-input__item-text {
  flex: 1;
  font-size: 0.9375rem;
  color: var(--color-text);
  word-break: break-word;
}

/* ── Remove button ───────────────────────────────────────────────────────── */
.array-input__remove-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.array-input__remove-btn:hover {
  color: var(--color-accent);
  background-color: rgba(236, 72, 153, 0.1);
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.array-input__empty {
  margin: 0;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
}

/* ── Add row ─────────────────────────────────────────────────────────────── */
.array-input__add-row {
  display: flex;
  gap: 0.5rem;
}

.array-input__text-input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9375rem;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.array-input__text-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.array-input__text-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
}

.array-input__add-btn {
  padding: 0.625rem 1.125rem;
  background-color: var(--color-primary);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}

.array-input__add-btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #7c3aed);
}

.array-input__add-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
