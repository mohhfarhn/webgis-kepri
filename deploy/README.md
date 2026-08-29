# ============================================================
# README — Deploy backend di Oracle Cloud Free Tier (atau VPS Linux)
# Frontend sudah di Vercel. Instruksi ini untuk backend Express.
# ============================================================

## Ringkasan arsitektur
- Frontend Next.js  -> Vercel (https://webgis-kepri.vercel.app)
- Backend Express   -> Oracle Cloud VM, port 5000 (via nginx di 80)
- Database Postgres -> Oracle PostgreSQL lokal di server
- Upload gambar     -> Supabase Storage (opsional tapi disarankan, permanen)

---

## Langkah A — Setup di Oracle Cloud (sekali)

### 1. Buat VM
- Oracle Cloud Console -> Compute -> Instances -> Create Instance
- Image: Ubuntu 22.04 (atau 24.04) / Ampere A1 (gratis 4 OCPU/24GB) atau AMD.
- SSH key: unduh private key (dipakai SSH).
- Security List / Ingress: buka port **80** & **443** (HTTP/HTTPS) dari 0.0.0.0/0,
  dan 22 (SSH) dari IP kamu.

### 2. SSH masuk
```bash
ssh -i oracle-key.pem ubuntu@<IP_PUBLIK>
sudo -i
```

### 3. Jalankan bootstrap
```bash
bash bootstrap-oracle.sh
```
Ini menginstal Node 22, nginx, PostgreSQL, user `webgis`, membuat DB `webgis`,
dan membuka firewall. Catat DATABASE_URL yang di-print.

---

## Langkah B — Salin kode & konfigurasi

Dari komputer lokal (root project):
```bash
scp -r backend ubuntu@<IP>:/tmp/webgis-backend
scp deploy/bootstrap-oracle.sh deploy/webgis-api.service deploy/nginx-webgis.conf deploy/deploy.sh ubuntu@<IP>:/tmp/
```

Di server (pindahkan ke folder app):
```bash
mkdir -p /var/www/webgis
mv /tmp/webgis-backend /var/www/webgis/backend
chown -R webgis:webgis /var/www/webgis/backend
```

Buat `.env` backend (isi sesuai; jangan di-commit):
```bash
cp /var/www/webgis/backend/.env.production.example /var/www/webgis/backend/.env
nano /var/www/webgis/backend/.env
```

---

## Langkah C — Isi .env (kunci)

```ini
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://webgis:GANTI-PASSWORD-DATABASE@localhost:5432/webgis?schema=public"
JWT_SECRET="<openssl rand -hex 32>"
# URL Vercel final — PENTING untuk CORS
ALLOWED_ORIGIN=https://webgis-kepri.vercel.app

# Supabase (opsional, untuk upload foto permanen)
STORAGE_DRIVER=supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_BUCKET=uploads
```

---

## Langkah D — Install, migrate, build, jalankan

```bash
cd /var/www/webgis/backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

# systemd
cp /var/www/webgis/deploy/webgis-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now webgis-api
systemctl status webgis-api
curl http://localhost:5000/api/health   # harus OK
```

---

## Langkah E — Nginx + domain

```bash
cp /var/www/webgis/deploy/nginx-webgis.conf /etc/nginx/sites-available/webgis-api
ln -s /etc/nginx/sites-available/webgis-api /etc/nginx/sites-enabled/
# edit server_name menjadi domain/IP kamu
nginx -t && systemctl reload nginx
```

Jika punya domain, arahkan DNS `api.webgis-kepri.my.id` -> IP server.
Untuk HTTPS gratis: `apt install certbot python3-certbot-nginx && certbot --nginx`.

---

## Langkah F — Update Vercel env

Pastikan di Vercel (Production):
```
NEXT_PUBLIC_API_BASE_URL=http://<IP_PUBLIK>/api      # atau https://api.domain/api bila ada sertifikat
NEXT_PUBLIC_MEDIA_BASE_URL=https://xxxxx.supabase.co
```
Lalu **redeploy** Vercel.

> Gunakan `https` bila sudah pasang certbot; tanpa certbot pakai `http://IP/api`
> (browser akan warning "not secure" untuk layout/API campuran).

---

## Update selanjutnya
```bash
sudo -i bash /var/www/webgis/deploy.sh main
```
(pull + rebuild + restart). Otomatis via GitHub Actions: tiap push ke `main`
(mengubah `backend/**`, `deploy/**`, atau workflow) akan menjalankan deploy.sh
lewat SSH. Lihat `.github/workflows/deploy.yml`.

### Sekali saja: set GitHub Secrets
Repo > Settings > Secrets and variables > Actions > New repository secret:
- `VPS_HOST` — IP publik / domain Oracle
- `VPS_USER` — user SSH (mis. `ubuntu`)
- `VPS_PORT` — port SSH (default `22`)
- `VPS_SSH_KEY` — isi private key PEM (multi-line, tempel baris utuh)

Workflow akan `ssh` lalu `sudo -i bash deploy.sh`. User `VPS_USER` perlu izin
`sudo` tanpa password (biasanya `ubuntu` di Oracle sudah NOPASSWD).
