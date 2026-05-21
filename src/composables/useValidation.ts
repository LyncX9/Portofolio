import { ref, computed, reactive } from 'vue'
import type { ZodSchema, ZodError } from 'zod'
import { getValidationErrors } from '@/types/schemas'

/**
 * useValidation composable
 *
 * Integrates Zod schemas with form components to provide:
 * - Real-time per-field validation on blur
 * - Full-form validation on submit
 * - Reactive error state for inline display
 * - A computed `isValid` flag to disable save buttons
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4
 *
 * @param schema - Zod schema to validate against
 *
 * @example
 * ```ts
 * const { errors, isValid, validateField, validateAll, clearErrors } = useValidation(heroSchema)
 *
 * // On blur:
 * @blur="validateField('name', form)"
 *
 * // On submit:
 * if (!validateAll(form)) return
 *
 * // Disable save button:
 * :disabled="!isValid"
 * ```
 */
export function useValidation<T extends Record<string, unknown>>(schema: ZodSchema<T>) {
  /**
   * Reactive map of field paths to their current error messages.
   * Empty string means no error for that field.
   */
  const errors = reactive<Record<string, string>>({})

  /**
   * Whether the form has been submitted at least once.
   * Used to decide whether to show errors before the first submit attempt.
   */
  const hasSubmitted = ref(false)

  // ─── Computed ─────────────────────────────────────────────────────────────

  /**
   * True when there are no validation errors.
   * Requirements: 11.5, 11.6
   */
  const isValid = computed<boolean>(() => Object.keys(errors).length === 0)

  /**
   * True when there are one or more validation errors.
   */
  const hasErrors = computed<boolean>(() => !isValid.value)

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Apply a set of Zod errors to the reactive errors map.
   */
  function applyErrors(zodErrors: ZodError): void {
    const parsed = getValidationErrors(zodErrors)
    // Clear existing errors first
    Object.keys(errors).forEach((k) => delete errors[k])
    Object.assign(errors, parsed)
  }

  /**
   * Clear all validation errors.
   */
  function clearErrors(): void {
    Object.keys(errors).forEach((k) => delete errors[k])
  }

  /**
   * Clear the error for a single field.
   */
  function clearFieldError(field: string): void {
    delete errors[field]
  }

  // ─── Validation methods ────────────────────────────────────────────────────

  /**
   * Validate a single field against the full schema.
   * Only the error for the given field is surfaced; other fields are unaffected.
   *
   * Designed for use in `@blur` handlers.
   *
   * Requirements: 11.4
   *
   * @param field - The field name (top-level key in the schema)
   * @param data  - The current form data object
   */
  function validateField(field: string, data: unknown): void {
    const result = schema.safeParse(data)

    if (result.success) {
      // Field is now valid — clear its error
      delete errors[field]
    } else {
      const parsed = getValidationErrors(result.error)
      if (parsed[field]) {
        errors[field] = parsed[field]
      } else {
        // No error for this field in the latest parse — clear it
        delete errors[field]
      }
    }
  }

  /**
   * Validate all fields against the schema.
   * Populates `errors` with all failing fields.
   * Sets `hasSubmitted` to true.
   *
   * Designed for use in submit handlers.
   *
   * Requirements: 11.1, 11.2, 11.3, 11.5
   *
   * @param data - The current form data object
   * @returns `true` if validation passes, `false` otherwise
   */
  function validateAll(data: unknown): boolean {
    hasSubmitted.value = true
    const result = schema.safeParse(data)

    if (result.success) {
      clearErrors()
      return true
    }

    applyErrors(result.error)
    return false
  }

  /**
   * Reset the composable state: clear all errors and reset hasSubmitted.
   * Call this when the form is cancelled or reset.
   */
  function reset(): void {
    clearErrors()
    hasSubmitted.value = false
  }

  return {
    /** Reactive map of field paths to error messages */
    errors,

    /** True when there are no validation errors */
    isValid,

    /** True when there are one or more validation errors */
    hasErrors,

    /** Whether the form has been submitted at least once */
    hasSubmitted,

    /** Validate a single field on blur */
    validateField,

    /** Validate all fields on submit — returns true if valid */
    validateAll,

    /** Clear all errors */
    clearErrors,

    /** Clear the error for a single field */
    clearFieldError,

    /** Reset all state (errors + hasSubmitted) */
    reset,
  }
}
