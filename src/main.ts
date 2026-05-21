import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize auth session on app startup so the router guard has
// up-to-date authentication state before the first navigation.
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()
authStore.initializeSession().finally(() => {
  app.mount('#app')
})
