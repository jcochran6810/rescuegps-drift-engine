Write-Host "Creating backend structure..." -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path "backend" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/drift-engine/core" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/drift-engine/physics" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/drift-engine/analysis" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/drift-engine/api" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/services" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/utils" | Out-Null

Write-Host "Backend structure created!" -ForegroundColor Green
Write-Host "Now downloading files from GitHub..." -ForegroundColor Cyan

$baseUrl = "https://raw.githubusercontent.com/jcochran6810/rescuegps-drift-engine/main/backend"

Write-Host "Complete! Push to GitHub with:" -ForegroundColor Green
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m 'Add backend structure'" -ForegroundColor White
Write-Host "git push" -ForegroundColor White