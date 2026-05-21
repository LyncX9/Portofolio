import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/authStore'

// ─── Admin views (lazy-loaded for code splitting) ─────────────────────────────
const LoginView = () => import('../views/admin/LoginView.vue')
const AdminDashboard = () => import('../views/admin/AdminDashboard.vue')
const HeroEditor = () => import('../views/admin/HeroEditor.vue')
const AboutEditor = () => import('../views/admin/AboutEditor.vue')
const SkillsManager = () => import('../views/admin/SkillsManager.vue')
const ProjectsManager = () => import('../views/admin/ProjectsManager.vue')
const ExperienceManager = () => import('../views/admin/ExperienceManager.vue')
const ContactEditor = () => import('../views/admin/ContactEditor.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── Public routes ──────────────────────────────────────────────────────
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },

    // ── Admin routes ───────────────────────────────────────────────────────
    {
      path: '/admin/login',
      name: 'admin-login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'hero',
          name: 'admin-hero',
          component: HeroEditor,
          meta: { requiresAuth: true },
        },
        {
          path: 'about',
          name: 'admin-about',
          component: AboutEditor,
          meta: { requiresAuth: true },
        },
        {
          path: 'skills',
          name: 'admin-skills',
          component: SkillsManager,
          meta: { requiresAuth: true },
        },
        {
          path: 'projects',
          name: 'admin-projects',
          component: ProjectsManager,
          meta: { requiresAuth: true },
        },
        {
          path: 'experience',
          name: 'admin-experience',
          component: ExperienceManager,
          meta: { requiresAuth: true },
        },
        {
          path: 'contact',
          name: 'admin-contact',
          component: ContactEditor,
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
})

// ─── Navigation guard ─────────────────────────────────────────────────────────

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Validate session on every navigation
  await authStore.checkSession()

  const isAuthenticated = authStore.isAuthenticated

  // Redirect unauthenticated users away from protected routes
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'admin-login' }
  }

  // Redirect authenticated users away from the login page
  if (to.meta.requiresGuest && isAuthenticated) {
    return { name: 'admin' }
  }
})

export default router
