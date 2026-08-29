# ============================================================
# README — Deploy backend di MESIN LOKAL (Windows) + Cloudflare Tunnel
# Pendekatan: backend jalan di PC ini, dibuka ke internet lewat
# Cloudflare Tunnel "quick" (gratis, tanpa akun).
#
# BATASAN PENTING:
# - PC harus SELALU MENYALA agar backend online.
# - Quick tunnel memberi URL acak (xxx.trycloudflare.com) yang BERUBAH tiap
#   restart cloudflared -> tiap kali URL berubah, frontend Vercel harus
#   di-update NEXT_PUBLIC_API_BASE_URL + redeploy.
#   (Untuk URL permanen butuh akun Cloudflare + domain -> named tunnel.)
# ============================================================

## Persyaratan
- Windows 11, Node 20+/24 (sudah ada: v24).
- Backend selesai dibangun (npm ci selesai).
- `backend\.env` diisi (DATABASE_URL, JWT_SECRET, ALLOWED_ORIGIN=vercel, Supabase).

## Langkah 1 — Install cloudflared (sekali)
```powershell
winget install cloudflared
```

## Langkah 2 — Isi backend\.env
Dari `backend\`:
```
cp .env.production.example .env   (atau salin manual)
```
Isi minimal:
- `DATABASE_URL` — Postgres (bisa pakai DB lokal/portable, atau Supabase free)
- `JWT_SECRET` — acak
- `ALLOWED_ORIGIN=https://webgis-kepri.vercel.app`

## Langkah 3 — Jalankan backend (jendela 1)
```powershell
powershell -ExecutionPolicy Bypass -File deploy\run-backend.ps1
```
Cek: `curl http://localhost:5000/api/health`

## Langkah 4 — Jalankan tunnel (jendela 2)
```powershell
powershell -ExecutionPolicy Bypass -File deploy\run-tunnel.ps1
```
Salin URL `https://xxxx.trycloudflare.com` dari output.

## Langkah 5 — Update Vercel env + redeploy
Di Vercel (Settings > Environment Variables, Production):
```
NEXT_PUBLIC_API_BASE_URL = https://xxxx.trycloudflare.com/api
NEXT_PUBLIC_MEDIA_BASE_URL = https://xxxx.supabase.co   (jika pakai Supabase)
```
Lalu menu Deployments > Redeploy Production.

---

## Auto-start (opsional, agar nyala otomatis saat PC boot)
Pakai Task Scheduler untuk 2 task (guna `schtasks`):
```powershell
# Task backend (minimized)
schtasks /Create /TN "WebGIS Backend" /TR "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File D:\webgis-kepri\deploy\run-backend.ps1" /SC ONSTART /RU SYSTEM /F

# Task tunnel (perlu URL tetap -> sebaiknya pakai named tunnel; quick tunnel
# berubah, jadi task tunnel hanya berguna kalau URL per sesi tidak masalah)
schtasks /Create /TN "WebGIS Tunnel" /TR "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File D:\webgis-kepri\deploy\run-tunnel.ps1" /SC ONSTART /RU SYSTEM /F
```
Hapus: `schtasks /Delete /TN "WebGIS Backend" /F`

> Catatan: karena quick tunnel URL berubah, auto-start lebih berguna bila kamu
> pakai named tunnel (akun Cloudflare + domain). Untuk demo berkala, jalankan
> manual tiap sesi cukup.
