# ============================================================
# run-backend.ps1 — Build & jalankan backend Express (Windows lokal)
# PRASYARAT: repo di D:\webgis-kepri, sudah pernah npm ci,
#            backend\.env sudah diisi (lihat backend\.env.production.example)
# Jalankan: powershell -ExecutionPolicy Bypass -File deploy\run-backend.ps1
# ============================================================
$ErrorActionPreference = "Stop"
$Root    = Split-Path -Parent $MyInvocation.MyCommand.Path   # ...\deploy
$Backend = Join-Path $Root "backend"
$LogFile = Join-Path $Root "backend-server.log"

if (-not (Test-Path (Join-Path $Backend ".env"))) {
  Write-Host "[!] Belum ada backend\.env. Salin .env.production.example ke .env lalu isi DATABASE_URL & JWT_SECRET." -ForegroundColor Yellow
}

Set-Location $Backend

Write-Host "[1/4] prisma generate + build (tsc)..."
npm run build

Write-Host "[2/4] prisma migrate deploy (sinkronkan schema DB)..."
npx prisma migrate deploy

Write-Host "[3/4] Set NODE_ENV=production ..."
$env:NODE_ENV = "production"

Write-Host "[4/4] Start backend di port 5000 (Ctrl+C untuk berhenti)..."
Write-Host "    Health: http://localhost:5000/api/health"
node dist/server.js 2>&1 | Tee-Object -FilePath $LogFile
