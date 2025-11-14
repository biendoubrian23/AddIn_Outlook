# Script rapide pour indexer les documents

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📚 INDEXATION DES DOCUMENTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"

if (-not (Test-Path $backendPath)) {
    Write-Host "✗ Dossier backend introuvable" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

Write-Host "Lancement de l'indexation...`n" -ForegroundColor Yellow

npm run index

Write-Host "`n✅ Indexation terminée!" -ForegroundColor Green
