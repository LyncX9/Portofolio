<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const username = ref('')
const password = ref('')

// Validation errors
const usernameError = ref<string | null>(null)
const passwordError = ref<string | null>(null)

// Computed: disable submit when loading or fields are empty
const isSubmitDisabled = computed(
  () => authStore.isLoading || !username.value.trim() || !password.value.trim()
)

/**
 * Validate form fields. Returns true if valid.
 */
function validate(): boolean {
  let valid = true

  if (!username.value.trim()) {
    usernameError.value = 'Username is required'
    valid = false
  } else {
    usernameError.value = null
  }

  if (!password.value.trim()) {
    passwordError.value = 'Password is required'
    valid = false
  } else {
    passwordError.value = null
  }

  return valid
}

/**
 * Clear auth store error when user starts typing.
 */
function onInput() {
  if (authStore.error) {
    authStore.clearError()
  }
}

/**
 * Handle login form submission.
 */
async function handleLogin() {
  if (!validate()) return

  const success = await authStore.login(username.value.trim(), password.value.trim())

  if (success) {
    await router.push('/admin')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Header -->
      <div class="login-header">
        <div class="login-logo" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            width="32"
            height="32"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 class="login-title">Admin Login</h1>
        <p class="login-subtitle">Sign in to manage your portfolio</p>
      </div>

      <!-- Form -->
      <form class="login-form" novalidate @submit.prevent="handleLogin">
        <!-- Auth error banner -->
        <div v-if="authStore.error" class="error-banner" role="alert" aria-live="assertive">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ authStore.error }}</span>
        </div>

        <!-- Username field -->
        <div class="form-field">
          <label for="username" class="form-label">
            Username
            <span class="required-indicator" aria-hidden="true">*</span>
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="form-input"
            :class="{ 'form-input--error': usernameError }"
            placeholder="Enter your username"
            autocomplete="username"
            :aria-required="true"
            :aria-invalid="!!usernameError"
            aria-describedby="username-error"
            :disabled="authStore.isLoading"
            @input="onInput"
          />
          <p v-if="usernameError" id="username-error" class="field-error" role="alert">
            {{ usernameError }}
          </p>
        </div>

        <!-- Password field -->
        <div class="form-field">
          <label for="password" class="form-label">
            Password
            <span class="required-indicator" aria-hidden="true">*</span>
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            :class="{ 'form-input--error': passwordError }"
            placeholder="Enter your password"
            autocomplete="current-password"
            :aria-required="true"
            :aria-invalid="!!passwordError"
            aria-describedby="password-error"
            :disabled="authStore.isLoading"
            @input="onInput"
          />
          <p v-if="passwordError" id="password-error" class="field-error" role="alert">
            {{ passwordError }}
          </p>
        </div>

        <!-- Submit button -->
        <button
          type="submit"
          class="submit-btn"
          :class="{ 'submit-btn--loading': authStore.isLoading }"
          :disabled="isSubmitDisabled"
          :aria-busy="authStore.isLoading"
        >
          <span v-if="authStore.isLoading" class="spinner" aria-hidden="true" />
          <span>{{ authStore.isLoading ? 'Signing in…' : 'Sign In' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  padding: 1.5rem;
}

/* Subtle radial glow behind the card */
.login-page::before {
  content: '';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* ── Header ── */
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 16px;
  color: #fff;
  margin-bottom: 1.25rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.375rem;
}

.login-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

/* ── Error banner ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: rgba(236, 72, 153, 0.12);
  border: 1px solid rgba(236, 72, 153, 0.35);
  border-radius: 8px;
  color: var(--color-accent);
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

/* ── Form ── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
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

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background-color: var(--color-background);
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

.form-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
}

.form-input--error {
  border-color: var(--color-accent);
}

.form-input--error:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.2);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-error {
  font-size: 0.8125rem;
  color: var(--color-accent);
  margin: 0;
}

/* ── Submit button ── */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.1s ease;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ── Spinner ── */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.25rem;
  }
}
</style>
