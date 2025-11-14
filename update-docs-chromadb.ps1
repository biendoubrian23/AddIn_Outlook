# Script PowerShell pour remplacer Qdrant par ChromaDB dans la documentation

$files = @(
    "GUIDE_DEMARRAGE_SIMPLE.md",
    "QUICKSTART.md",
    "TROUBLESHOOTING.md",
    "INSTALLATION.md",
    "README.md",
    "ARCHITECTURE.md",
    "COMMANDS.md",
    "NEXT_STEPS.md"
)

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        Write-Host "Mise a jour: $file" -ForegroundColor Yellow
        
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Remplacements
        $content = $content -replace 'Qdrant', 'ChromaDB'
        $content = $content -replace 'qdrant', 'chromadb'
        $content = $content -replace '6333', '8000'
        $content = $content -replace 'qdrant/qdrant', 'chromadb/chroma'
        $content = $content -replace 'qdrant-ai', 'chromadb-ai'
        $content = $content -replace 'QdrantError', 'ChromaDBError'
        $content = $content -replace 'QDRANT', 'CHROMADB'
        
        Set-Content $filePath $content -Encoding UTF8 -NoNewline
        Write-Host "  [OK] $file mis a jour" -ForegroundColor Green
    }
}

Write-Host "`nTermine!" -ForegroundColor Cyan
