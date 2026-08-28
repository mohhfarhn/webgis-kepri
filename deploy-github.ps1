# ============================================================
# deploy-github.ps1 — Inisialisasi & push proyek WebGIS Kepri ke GitHub
# Penggunaan:
#   powershell -ExecutionPolicy Bypass -File .\deploy-github.ps1 -RepoUrl "https://github.com/USERNAME/webgis-kepri.git"
#   (opsional) -Branch "main"   -CommitMsg "Pesan commit"
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$RepoUrl,
    [string]$Branch = "main",
    [string]$CommitMsg = "Initial commit WebGIS Kepri"
)

$ErrorActionPreference = "Stop"

# Cari git (Gunakan Git for Windows bila ada)
$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) {
    $candidates = @(
        "C:\Program Files\Git\cmd\git.exe",
        "C:\Program Files (x86)\Git\cmd\git.exe"
    )
    $git = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $git) {
    Write-Error "Git tidak ditemukan. Install Git for Windows terlebih dahulu."
}
Write-Host "Menggunakan git: $git" -ForegroundColor Cyan

# Pastikan berada di root project (skrip ini ada di root)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ProjectRoot
Write-Host "Root project: $ProjectRoot" -ForegroundColor Cyan

# 1. Init repo bila belum ada
if (-not (Test-Path "$ProjectRoot\.git")) {
    Write-Host "[1/5] git init ..." -ForegroundColor Yellow
    & $git init
} else {
    Write-Host "[1/5] Repo sudah ter-inisialisasi, lanjut."
}

# 2. Pastikan cabang memakai nama yang diinginkan
Write-Host "[2/5] Set cabang ke '$Branch' ..." -ForegroundColor Yellow
& $git branch -M $Branch

# 3. Stage semua perubahan
Write-Host "[3/5] git add . ..." -ForegroundColor Yellow
& $git add .

# 4. Commit (hanya jika ada perubahan yang di-stage)
$status = & $git status --porcelain
if ($status) {
    Write-Host "[4/5] Commit: '$CommitMsg' ..." -ForegroundColor Yellow
    & $git commit -m $CommitMsg
} else {
    Write-Host "[4/5] Tidak ada perubahan untuk di-commit (skip)."
}

# 5. Set remote & push
Write-Host "[5/5] Set remote origin & push ..." -ForegroundColor Yellow
$remote = & $git remote get-url origin 2>$null
if (-not $remote) {
    & $git remote add origin $RepoUrl
} elseif ($remote -ne $RepoUrl) {
    & $git remote set-url origin $RepoUrl
}
& $git push -u origin $Branch

Write-Host ""
Write-Host "Selesai! Repo telah di-push ke: $RepoUrl" -ForegroundColor Green
