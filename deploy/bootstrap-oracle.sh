# ============================================================
# bootstrap-oracle.sh
# Setup awal di Oracle Cloud Free Tier (Ubuntu 22.04/24.04) atau VPS Linux
# Jalankan SEBAGAI ROOT (sudo -i), SATU KALI saja.
#   sudo -i
#   bash bootstrap-oracle.sh
# ============================================================
set -euo pipefail

echo "==> [1/7] Update sistem"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo "==> [2/7] Install Node 22 + build tools + nginx + PostgreSQL"
# NodeSource Node 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs build-essential nginx postgresql postgresql-contrib ufw git

echo "==> [3/7] Buat user aplikasi 'webgis' (tanpa login interaktif)"
id webgis >/dev/null 2>&1 || useradd -m -s /bin/bash webgis

echo "==> [4/7] Setup PostgreSQL + database + user"
echo "Membuat DB 'webgis' dan user 'webgis'..."
sudo -u postgres psql <<'SQL'
CREATE USER webgis WITH PASSWORD 'GANTI-PASSWORD-DATABASE';
CREATE DATABASE webgis OWNER webgis;
GRANT ALL PRIVILEGES ON DATABASE webgis TO webgis;
ALTER ROLE webgis WITH CREATEDB LOGIN;
SQL
# Karena Prisma migrate butuh akses schema public
sudo -u postgres psql -d webgis -c 'GRANT ALL ON SCHEMA public TO webgis;'

echo "==> [5/7] Firewall (buka 80, 443, SSH)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable || true

echo "==> [6/7] Siapkan folder deploy"
mkdir -p /var/www/webgis
chown webgis:webgis /var/www/webgis

echo
echo "DATABASE_URL yang dipakai di .env:"
echo "  postgresql://webgis:GANTI-PASSWORD-DATABASE@localhost:5432/webgis?schema=public"
echo
echo "LANGKAH BERIKUTNYA (manual):"
echo "  1. Salin backend/ ke /var/www/webgis/backend  (scp -r backend webgis@SERVER:/var/www/webgis/)"
echo "  2. Isi /var/www/webgis/backend/.env  (lihat .env.production.example)"
echo "  3. Jalankan: cd /var/www/webgis/backend && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build"
echo "  4. Pasang systemd unit: cp deploy/webgis-api.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now webgis-api"
echo "  5. Setup nginx reverse proxy (deploy/nginx-webgis.conf)"
echo "  6. Supabase Storage: isi SUPABASE_* di .env (opsional, untuk upload permanen)"
