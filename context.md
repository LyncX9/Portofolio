# Project Context

> Dokumen ini adalah referensi cepat untuk AI agent. Baca ini sebelum menyentuh file apapun.

---

## Ringkasan

Portfolio website pribadi milik **Bagas Firmansyah** dengan admin dashboard CRUD terintegrasi. Dibangun dengan Vue 3 (frontend) + Express (backend). Data disimpan di Supabase (production) atau JSON file (development).

- **GitHub:** https://github.com/LyncX9/Portofolio
- **Stack:** Vue 3 + TypeScript + Pinia + Vue Router (frontend) | Express 5 + TypeScript + Zod (backend)
- **Database:** Supabase PostgreSQL (production) / `data/portfolio-data.json` (development)
- **Deploy:** Render (backend + frontend) + Vercel (frontend opsional)
- **Tests:** 241 tests passing (Vitest)

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│  ├── Public Portfolio  (/, /about)                      │
│  └── Admin Dashboard  (/admin/*)  ← protected by auth  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP (dev: proxy via Vite)
┌────────────────────▼────────────────────────────────────┐
│  Express Server  (server/)                              │
│  ├── /api/auth/*     ← login, logout, session           │
│  ├── /api/content/*  ← CRUD semua section portfolio     │
│  ├── /api/images/*   ← upload & delete gambar           │
│  └── /uploads/*      ← static files gambar              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   Supabase DB              JSON File
   (production)             (development)
```

---

## Struktur File Penting

### Backend (`server/`)

| File | Fungsi |
|------|--------|
| `server/index.ts` | Entry point Express. Setup middleware, routes, static files. Serve `dist/` di production. |
| `server/routes/auth.ts` | POST /login, POST /logout, GET /session. Rate limiting 10 req/15min. |
| `server/routes/content.ts` | CRUD semua section: hero, about, skills, projects, experience, contact. Juga backup/restore. |
| `server/routes/images.ts` | POST /upload (multer, max 5MB, jpg/png/gif/webp), DELETE /:filename |
| `server/services/dataService.ts` | **Layer utama data.** Auto-detect Supabase vs file. Method: `loadData()`, `saveData()`, `updateSection()`. |
| `server/services/supabaseClient.ts` | Singleton Supabase client. Butuh `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. |
| `server/auth/credentials.ts` | bcrypt hash/verify password. Simpan di `data/admin-credentials.json`. |
| `server/auth/sessions.ts` | UUID session tokens. Simpan di `data/sessions.json`. Sliding window 24 jam. |
| `server/middleware/auth.ts` | `requireAuth` — cek cookie `admin_session`. |
| `server/middleware/csrf.ts` | `validateCsrfToken` — cek header `x-csrf-token` vs cookie `csrf_token`. |
| `server/middleware/sanitize.ts` | `sanitizeInput` — XSS sanitization semua req.body via `xss` library. |
| `server/utils/fileOperations.ts` | Atomic write (temp file + rename), file locking, backup management. |
| `server/utils/imageOperations.ts` | `replaceImage()` — upload baru → update ref → hapus lama, dengan rollback. |

### Frontend (`src/`)

| File/Folder | Fungsi |
|-------------|--------|
| `src/main.ts` | Init Pinia, router. Panggil `authStore.initializeSession()` sebelum mount. |
| `src/App.vue` | Root component. Render public sections + `<NotificationContainer />`. |
| `src/router/index.ts` | Routes: `/` (HomeView), `/about` (AboutView), `/admin/login`, `/admin/*` (protected). Navigation guard cek auth. |
| `src/stores/authStore.ts` | Pinia store auth. State: `isAuthenticated`, `session`, `user`. Actions: `login()`, `logout()`, `checkSession()`, `initializeSession()`. |
| `src/stores/content.ts` | Pinia store semua konten portfolio. Optimistic updates + rollback. Actions: `loadContent()`, `updateHero()`, `createSkill()`, dll. |
| `src/stores/ui.ts` | Pinia store UI. `showNotification(type, message)`, `setLoading()`, `openModal()`. |
| `src/services/authService.ts` | HTTP calls ke `/api/auth/*`. |
| `src/services/contentService.ts` | HTTP calls ke `/api/content/*`. Client-side Zod validation sebelum request. |
| `src/services/imageService.ts` | XHR upload (untuk progress tracking), delete, replace image. |
| `src/utils/api.ts` | `apiGet/Post/Put/Delete()`. Auto-attach CSRF token dari cookie ke header. Base URL dari `VITE_API_BASE_URL` env var. |
| `src/types/index.ts` | TypeScript interfaces: `HeroContent`, `AboutContent`, `Skill`, `Project`, `Experience`, `ContactContent`, `PortfolioData`, dll. |
| `src/types/schemas.ts` | Zod schemas untuk semua tipe. `heroSchema`, `projectSchema`, dll. |
| `src/composables/useValidation.ts` | Generic validation composable. `validateField(field, data)`, `validateAll(data)`, `errors`, `isValid`. |
| `src/composables/useErrorHandler.ts` | `handleError()`, `handleNetworkError()`, `handleValidationError()`. Auto-show notification. |
| `src/composables/useLoadingState.ts` | Named loading keys, upload progress tracking, `withLoading(key, fn)`. |

### Public Portfolio Components (`src/components/`)

Semua menerima props dari content store (dengan fallback hardcoded):

| Component | Props |
|-----------|-------|
| `HeroSection.vue` | `hero?: HeroContent \| null` |
| `AboutSection.vue` | `about?: AboutContent \| null` |
| `SkillsSection.vue` | `skills?: Skill[] \| null` |
| `ProjectsSection.vue` | `projects?: Project[] \| null` |
| `ExperienceSection.vue` | `experience?: Experience[] \| null` |
| `ContactSection.vue` | `contact?: ContactContent \| null` |

### Admin Components (`src/components/admin/`)

| Component | Fungsi |
|-----------|--------|
| `AdminSidebar.vue` | Navigasi sidebar. Collapsible. Auto-collapse di tablet. Overlay di mobile. |
| `AdminHeader.vue` | Section title + username + logout button. Hamburger di mobile. |
| `ConfirmDialog.vue` | Modal konfirmasi. Enter=confirm, Esc=cancel, click-outside=cancel. |
| `NotificationToast.vue` | Toast notification. Auto-dismiss. Type: success/error/warning. |
| `NotificationContainer.vue` | Render semua notif dari `uiStore.notifications`. Teleport ke body. |
| `forms/TextInput.vue` | v-model input. Props: label, placeholder, required, error. |
| `forms/TextArea.vue` | v-model textarea. Auto-resize. Character count. |
| `forms/ImageUpload.vue` | Drag-drop upload. Preview. Progress bar. Client-side validation. |
| `forms/ArrayInput.vue` | v-model string[]. Add/remove/drag-reorder items. |

### Admin Views (`src/views/admin/`)

| View | Fungsi |
|------|--------|
| `LoginView.vue` | Form login. Redirect ke `/admin` setelah sukses. |
| `AdminDashboard.vue` | Layout utama admin. Sidebar + header + `<router-view>`. Provide `setUnsavedChanges`. |
| `HeroEditor.vue` | Edit hero section. Image upload. Dirty state tracking. |
| `AboutEditor.vue` | Edit paragraf, skills list, about image. |
| `SkillsManager.vue` | CRUD skills. Drag-drop reorder. |
| `ProjectsManager.vue` | CRUD projects. Image upload. Featured toggle. |
| `ExperienceManager.vue` | CRUD experience. Drag-drop reorder. |
| `ContactEditor.vue` | Edit email, subtitle, social links. |

---

## Data Model

Semua data portfolio disimpan sebagai **satu objek JSON** (`PortfolioData`):

```typescript
{
  hero: { greeting, name, title, description, bio, profileImage, universityLink }
  about: { paragraphs: string[], skills: string[], aboutImage }
  skills: [{ id, name, icon, category, order }]
  projects: [{ id, title, category, description, features, image, link, githubLink?, featured, order }]
  experience: [{ id, title, company, duration, descriptions: string[], order }]
  contact: { email, subtitle, socialLinks: [{ id, icon, label, href }] }
  metadata: { lastUpdated, version }
}
```

Di Supabase: tabel `portfolio_data`, satu row dengan `id=1`, kolom `data JSONB`.

---

## Environment Variables

| Variable | Wajib | Keterangan |
|----------|-------|-----------|
| `NODE_ENV` | Ya | `development` / `production` / `test` |
| `PORT` | Tidak | Default 3000 |
| `ADMIN_USERNAME` | Tidak | Default `admin` |
| `ADMIN_PASSWORD` | Ya | Min 12 karakter. Dipakai saat init credentials. |
| `SESSION_SECRET` | Ya | Random hex string untuk signing |
| `CLIENT_URL` | Ya | URL frontend untuk CORS |
| `SUPABASE_URL` | Production | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Service role key (server-side only) |
| `VITE_API_BASE_URL` | Vercel | URL backend, default `/api` |

---

## API Endpoints

Semua endpoint ada di `docs/API.md`. Ringkasan:

```
GET    /api/health                    — health check (public)
POST   /api/auth/login                — login (rate limited: 10/15min)
POST   /api/auth/logout               — logout (CSRF required)
GET    /api/auth/session              — cek session

GET    /api/content                   — ambil semua data (public)
PUT    /api/content/hero              — update hero (auth + CSRF)
PUT    /api/content/about             — update about (auth + CSRF)
PUT    /api/content/contact           — update contact (auth + CSRF)
POST   /api/content/skills            — create skill (auth + CSRF)
PUT    /api/content/skills/:id        — update skill (auth + CSRF)
DELETE /api/content/skills/:id        — delete skill (auth + CSRF)
PUT    /api/content/skills/reorder    — reorder skills (auth + CSRF)
POST   /api/content/projects          — create project (auth + CSRF)
PUT    /api/content/projects/:id      — update project (auth + CSRF)
DELETE /api/content/projects/:id      — delete project (auth + CSRF)
POST   /api/content/experience        — create experience (auth + CSRF)
PUT    /api/content/experience/:id    — update experience (auth + CSRF)
DELETE /api/content/experience/:id    — delete experience (auth + CSRF)
PUT    /api/content/experience/reorder — reorder experience (auth + CSRF)
GET    /api/content/backup            — download backup JSON (auth)
GET    /api/content/backups           — list backup files (auth)
POST   /api/content/restore           — restore dari backup (auth + CSRF)

POST   /api/images/upload             — upload gambar (auth + CSRF, max 5MB)
DELETE /api/images/:filename          — hapus gambar (auth + CSRF)
```

---

## Security

- **Auth:** bcrypt (cost 12) + UUID session tokens + HTTP-only cookies
- **CSRF:** Double-submit cookie pattern. Server set `csrf_token` cookie, client kirim di header `x-csrf-token`
- **Rate limiting:** Login endpoint 10 req/15min per IP (`express-rate-limit`)
- **XSS:** Semua `req.body` di-sanitize via `xss` library sebelum diproses
- **Cookie flags:** `HttpOnly`, `Secure` (production), `SameSite=Strict`

---

## Cara Kerja Storage

```
isSupabaseConfigured()
  ├── true  → Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY ada)
  │           Upsert ke tabel portfolio_data, id=1
  │           Jika row belum ada → seed dari local JSON
  └── false → Local JSON file (data/portfolio-data.json)
              Atomic write: temp file → rename
              Auto-backup ke data/backups/
```

---

## Scripts

```bash
npm run dev          # Vite dev server (port 5173, proxy /api ke 3000)
npm run build-only   # Build Vue ke dist/
npm run test         # Vitest (241 tests)
npx tsx --env-file=.env server/index.ts  # Jalankan backend
```

---

## Deployment

Lihat `DEPLOYMENT.md` untuk panduan lengkap. Ringkasan:

1. **Supabase** — jalankan `supabase/schema.sql` di SQL Editor
2. **Render** — connect GitHub, set env vars (termasuk Supabase keys), build+start command
3. **Vercel** (opsional) — set `VITE_API_BASE_URL` ke URL Render

---

## Hal yang Perlu Diperhatikan

- `data/admin-credentials.json` dan `data/sessions.json` di-gitignore — dibuat otomatis saat server pertama kali jalan
- `data/portfolio-data.json` ter-commit sebagai seed data awal
- Di development, tidak perlu Supabase — cukup jalankan server dan data tersimpan di JSON
- Semua admin routes lazy-loaded untuk code splitting
- `AdminDashboard.vue` provide `setUnsavedChanges` via inject ke semua editor child
- `src/main.ts` memanggil `authStore.initializeSession()` sebelum `app.mount()` agar router guard punya state auth yang benar
