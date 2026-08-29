# ============================================================
# run-tunnel.ps1 — Cloudflare Tunnel "quick" (gratis, tanpa akun)
# Buka backend lokal (:5000) ke internet lewat trycloudflare.com
# PRASYARAT:
#   1. Install cloudflared:
#      winget install cloudflared   (atau https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
#   2. backend sudah jalan (run-backend.ps1)
# Jalankan: powershell -ExecutionPolicy Bypass -File deploy\run-tunnel.ps1
# ============================================================
$ErrorActionPreference = "Stop"

$cloudflared = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $cloudflared) {
  Write-Host "[!] cloudflared tidak ditemukan. Install dulu:" -ForegroundColor Yellow
  Write-Host "    winget install cloudflared"
  exit 1
}

Write-Host "Menjalankan quick tunnel ke http://localhost:5000 ..."
Write-Host "Salin URL https://xxx.trycloudflare.com dari output — itulah base API kamu." -ForegroundColor Cyan
Write-Host "(URL berubah tiap kali restart)" -ForegroundColor DarkYellow
& $cloudflared tunnel --url http://localhost:5000
