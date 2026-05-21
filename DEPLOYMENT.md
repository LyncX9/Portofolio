# Deployment Guide

Stack: **Supabase** (database) + **Render** (backend) + **Vercel** (frontend, opsional)

---

## Step 1 — Setup Supabase (Database)

### 1.1 Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Isi nama project, password database, pilih region **Southeast Asia (Singapore)**
3. Tunggu project selesai dibuat (~1 menit)

### 1.2 Buat Tabel

1. Di sidebar kiri → **SQL Editor** → **New Query**
2. Copy-paste isi file `supabase/schema.sql`
3. Klik **Run** (atau Ctrl+Enter)

Ini akan membuat tabel `portfolio_data` dengan data awal portfolio kamu.

### 1.3 Ambil Credentials

Di sidebar → **Project Settings** → **API**:

| Yang dibutuhkan | Lokasi |
|----------------|--------|
| `SUPABASE_URL` | "Project URL" |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role" (klik reveal) |

Simpan kedua nilai ini — akan dipakai di Render.

---

## Step 2 — Deploy Backend ke Render

### 2.1 Push ke GitHub (jika belum)

```bash
git add .
git commit -m "add supabase integration"
git push origin main
```

### 2.2 Buat Web Service di Render

1. Buka [render.com](https://render.com) → **New** → **Web Service**
2. Connect GitHub repo kamu
3. Isi settings:

| Setting | Value |
|---------|-------|
| **Name** | `portfolio-api` |
| **Region** | Singapore |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build-only` |
| **Start Command** | `NODE_ENV=production npx tsx server/index.ts` |
| **Plan** | Free |

### 2.3 Set Environment Variables di Render

Di tab **Environment**, tambahkan semua ini:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | *(password kuat, min 12 karakter)* |
| `SESSION_SECRET` | *(klik "Generate" untuk auto-generate)* |
| `CLIENT_URL` | `https://portfolio-api.onrender.com` *(atau URL Vercel jika pakai Vercel)* |
| `SUPABASE_URL` | *(dari Step 1.3)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(dari Step 1.3)* |

### 2.4 Deploy

Klik **Create Web Service**. Render akan build dan deploy otomatis (~3-5 menit).

Setelah selesai, test:
```
https://portfolio-api.onrender.com/api/health
```
Harus return: `{"status":"ok","timestamp":"..."}`

---

## Step 3 — Deploy Frontend ke Vercel (Opsional)

Lewati step ini jika kamu mau pakai Render saja (frontend sudah di-serve oleh Express).

### 3.1 Update .env.production

Edit file `.env.production`:
```dotenv
VITE_API_BASE_URL=https://portfolio-api.onrender.com/api
```

### 3.2 Update vercel.json

Edit `vercel.json`, ganti `YOUR-RENDER-APP` dengan URL Render kamu:
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

### 3.3 Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) → **New Project** → Import repo
2. Settings:

| Setting | Value |
|---------|-------|
| **Framework** | Vite |
| **Build Command** | `npm run build-only` |
| **Output Directory** | `dist` |

3. Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://portfolio-api.onrender.com/api` |

4. Klik **Deploy**

### 3.4 Update CLIENT_URL di Render

Setelah Vercel deploy selesai, kamu dapat URL seperti `https://portfolio.vercel.app`.
Update env var `CLIENT_URL` di Render ke URL Vercel tersebut, lalu **Manual Deploy** ulang.

---

## Akses Setelah Deploy

| URL | Keterangan |
|-----|-----------|
| `https://portfolio-api.onrender.com` | Portfolio (jika pakai Render saja) |
| `https://portfolio.vercel.app` | Portfolio (jika pakai Vercel) |
| `https://portfolio-api.onrender.com/admin/login` | Admin dashboard |

**Login credentials:**
- Username: `admin` (atau sesuai `ADMIN_USERNAME`)
- Password: sesuai `ADMIN_PASSWORD` yang kamu set di Render

---

## Checklist Sebelum Deploy

- [ ] Supabase project sudah dibuat
- [ ] SQL schema sudah dijalankan di Supabase SQL Editor
- [ ] `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah dicatat
- [ ] Semua env vars sudah diset di Render
- [ ] `ADMIN_PASSWORD` bukan default/lemah
- [ ] Test `/api/health` setelah deploy
- [ ] Test login ke admin dashboard
- [ ] Test edit salah satu section dan refresh — data harus tetap ada
