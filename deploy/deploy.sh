# ============================================================
# deploy.sh — pull kode terbaru, build, restart backend di Oracle/VPS
# Jalankan sebagai root:  sudo -i bash /var/www/webgis/deploy.sh main
# (GitHub Actions menjalankan ini otomatis via workflow deploy.yml)
# ============================================================
set -euo pipefail

APP_DIR="/var/www/webgis"
BACKEND_DIR="$APP_DIR/backend"
SERVICE_NAME="webgis-api"
BRANCH="${1:-main}"

# Pastikan backend dimiliki user 'webgis' agar service systemd bisa membaca
APP_USER="${DEPLOY_USER:-webgis}"

echo "==> [1/5] git pull (branch $BRANCH)"
git -C "$BACKEND_DIR" fetch origin
git -C "$BACKEND_DIR" checkout "$BRANCH"
git -C "$BACKEND_DIR" pull origin "$BRANCH"

echo "==> [2/5] install dependencies + regenerate prisma"
cd "$BACKEND_DIR"
npm ci
npx prisma generate

echo "==> [3/5] jalankan migrasi database"
npx prisma migrate deploy

echo "==> [4/5] build (tsc)"
npm run build

# Pastikan kepemilikan benar untuk service systemd (User=webgis)
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "==> [5/5] restart service systemd"
systemctl daemon-reload
systemctl restart "$SERVICE_NAME"
systemctl --no-pager --lines=20 status "$SERVICE_NAME"
echo "Deploy selesai. Health: curl http://localhost:5000/api/health"
