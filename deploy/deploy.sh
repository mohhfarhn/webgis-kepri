# ============================================================
# deploy.sh — pull kode terbaru, build, restart backend di Oracle/VPS
# Jalankan: bash deploy.sh   (di server, dari folder /var/www/webgis)
# Bisa di-trigger dari git push via webhook (opsional).
# ============================================================
set -euo pipefail

APP_DIR="/var/www/webgis"
BACKEND_DIR="$APP_DIR/backend"
SERVICE_NAME="webgis-api"
BRANCH="${1:-main}"

cd "$BACKEND_DIR"

echo "==> [1/4] git pull (branch $BRANCH)"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> [2/4] install deps + regenerate prisma"
npm ci --omit=dev
# prisma generate butuh prisma CLI (dev dep) — install dev utk build
npm ci
npx prisma generate
npx prisma migrate deploy

echo "==> [3/4] build"
npm run build

echo "==> [4/4] restart service"
systemctl restart "$SERVICE_NAME"
systemctl --no-pager --lines=20 status "$SERVICE_NAME"
echo "Deploy selesai. Health: curl http://localhost:5000/api/health"
