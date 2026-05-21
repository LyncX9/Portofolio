# Deployment Guide

Ada dua opsi deployment:

- **Opsi A (Recommended):** Full-stack di **Render** — satu service, paling simpel
- **Opsi B:** Frontend di **Vercel** + Backend di **Render** — lebih cepat untuk frontend

---

## Opsi A: Full-Stack di Render (Recommended)

### Langkah 1 — Push ke GitHub

```bash
git init                          # jika belum ada git repo
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### Langkah 2 — Buat Web Service di Render

1. Buka [render.com](https://render.com) → **New** → **Web Service**
2. Connect GitHub repo kamu
3. Isi settings:

| Setting | Value |
|---------|-------|
| **Name** | `portfolio` |
| **Region** | Singapore (terdekat dari Indonesia) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build-only` |
| **Start Command** | `NODE_ENV=production npx tsx server/index.ts` |
| **Plan** | Free |

### Langkah 3 — Set Environment Variables di Render

Di tab **Environment**, tambahkan:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | *(password kuat, min 12 karakter)* |
| `SESSION_SECRET` | *(klik "Generate" untuk auto-generate)* |
| `CLIENT_URL` | *(URL Render kamu, contoh: `https://portfolio.onrender.com`)* |

### Langkah 4 — Deploy

Klik **Create Web Service**. Render akan otomatis build dan deploy.

Setelah selesai, akses:
- Portfolio: `https://portfolio.onrender.com`
- Admin: `https://portfolio.onrender.com/admin/login`

---

## Opsi B: Vercel (Frontend) + Render (Backend)

Gunakan ini jika ingin frontend lebih cepat dengan CDN global Vercel.

### Step 1 — Deploy Backend ke Render

Ikuti **Opsi A** di atas, tapi catat URL Render kamu (contoh: `https://portfolio-api.onrender.com`).

Tambahkan env var tambahan di Render:
| Key | Value |
|-----|-------|
| `CLIENT_URL` | `https://portfolio.vercel.app` *(URL Vercel kamu)* |

### Step 2 — Update .env.production

Edit file `.env.production` di root project:

```dotenv
VITE_API_BASE_URL=https://portfolio-api.onrender.com/api
```

Ganti `portfolio-api.onrender.com` dengan URL Render kamu yang sebenarnya.

### Step 3 — Update vercel.json

Edit `vercel.json`, ganti `YOUR-RENDER-APP` dengan nama service Render kamu:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://portfolio-api.onrender.com/api/$1"
    },
    ...
  ]
}
```

### Step 4 — Deploy Frontend ke Vercel

1. Buka [vercel.com](https://vercel.com) → **New Project**
2. Import GitHub repo yang sama
3. Isi settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build-only` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

4. Di **Environment Variables**, tambahkan:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://portfolio-api.onrender.com/api` |

5. Klik **Deploy**

---

## Catatan Penting

### Data Persistence di Render Free Plan

Render Free Plan menggunakan **ephemeral filesystem** — data di `data/` akan hilang saat service restart/redeploy.

**Solusi:** Gunakan Render **Persistent Disk** (berbayar $0.25/GB/bulan) atau upgrade ke paid plan.

Untuk menambahkan persistent disk:
1. Di Render dashboard → service kamu → **Disks**
2. Add disk: Mount Path = `/data`, Size = 1 GB
3. Update `server/services/dataService.ts` — ubah `DATA_DIR` ke `/data`

### CORS

Pastikan `CLIENT_URL` di Render diset ke URL frontend kamu yang sebenarnya, bukan `localhost`.

### Admin Password

Gunakan password yang kuat. Setelah deploy pertama, credentials disimpan di `data/admin-credentials.json`. Jika ingin ganti password, hapus file tersebut dan restart service.

---

## Checklist Sebelum Deploy

- [ ] Push semua perubahan ke GitHub
- [ ] `.env` tidak ter-commit (ada di `.gitignore`)
- [ ] `ADMIN_PASSWORD` sudah diset di Render (bukan default)
- [ ] `SESSION_SECRET` sudah diset (random string panjang)
- [ ] `CLIENT_URL` sudah diset ke URL production
- [ ] Test login setelah deploy
