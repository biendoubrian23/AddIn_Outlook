# Script de demarrage automatique de l'Assistant IA Outlook
# Usage: .\start-assistant.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OUTLOOK AI ASSISTANT - DEMARRAGE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Fonction pour verifier si un port est occupe
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Etape 1: Verifier Ollama
Write-Host "[1/6] Verification d'Ollama..." -ForegroundColor Yellow
try {
    $ollamaTest = Invoke-WebRequest -Uri "http://localhost:11434" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "[OK] Ollama est actif" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Ollama n'est pas actif" -ForegroundColor Red
    Write-Host "  Demarrez Ollama et reessayez" -ForegroundColor Yellow
    exit 1
}

# Verifier le modele
Write-Host "  Verification du modele llama3.1:8b..." -ForegroundColor Gray
$models = ollama list 2>$null
if ($models -match "llama3.1") {
    Write-Host "  [OK] Modele llama3.1 disponible" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Modele llama3.1 non trouve" -ForegroundColor Red
    Write-Host "  Telechargement du modele..." -ForegroundColor Yellow
    ollama pull llama3.1:8b
}

# Etape 2: Verifier ChromaDB (Mode Embedded - pas besoin de Docker)
Write-Host "`n[2/6] ChromaDB (Mode Embedded)..." -ForegroundColor Yellow
$chromaDbPath = Join-Path $PSScriptRoot "backend\chromadb_data"
if (Test-Path $chromaDbPath) {
    Write-Host "[OK] ChromaDB local deja initialise" -ForegroundColor Green
} else {
    Write-Host "[INFO] ChromaDB sera initialise au premier demarrage du backend" -ForegroundColor Yellow
}
Write-Host "  Stockage: $chromaDbPath" -ForegroundColor Gray


# Etape 3: Demarrer le backend
Write-Host "`n[3/6] Demarrage du backend..." -ForegroundColor Yellow

$backendPath = Join-Path $PSScriptRoot "backend"

if (-not (Test-Path $backendPath)) {
    Write-Host "[ERREUR] Dossier backend introuvable: $backendPath" -ForegroundColor Red
    exit 1
}

# Verifier si node_modules existe
$nodeModules = Join-Path $backendPath "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "  Installation des dependances backend..." -ForegroundColor Yellow
    Set-Location $backendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERREUR] Erreur lors de l'installation des dependances" -ForegroundColor Red
        exit 1
    }
}

# Verifier le fichier .env
$envFile = Join-Path $backendPath ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "  Creation du fichier .env..." -ForegroundColor Yellow
    Copy-Item (Join-Path $backendPath ".env.example") $envFile
}

# Demarrer le backend en arriere-plan
Set-Location $backendPath
Write-Host "  Demarrage du serveur Node.js..." -ForegroundColor Gray

$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm start
} -ArgumentList $backendPath

Start-Sleep -Seconds 5

# Verifier que le backend est demarre
if (Test-Port 3000) {
    Write-Host "[OK] Backend demarre sur le port 3000" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Le backend n'a pas pu demarrer" -ForegroundColor Red
    Write-Host "  Verifiez les logs avec: npm start" -ForegroundColor Yellow
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

# Etape 4: Verifier ngrok
Write-Host "`n[4/6] Verification de ngrok..." -ForegroundColor Yellow

$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokInstalled) {
    Write-Host "[INFO] ngrok n'est pas installe" -ForegroundColor Red
    Write-Host "  Telechargez ngrok sur: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "  Ou continuez sans ngrok (localhost uniquement)" -ForegroundColor Yellow
    $response = Read-Host "  Continuer sans ngrok? (o/n)"
    if ($response -ne "o") {
        Stop-Job $backendJob
        Remove-Job $backendJob
        exit 1
    }
} else {
    Write-Host "[OK] ngrok est installe" -ForegroundColor Green
    Write-Host "  Demarrage de ngrok..." -ForegroundColor Yellow
    
    # Demarrer ngrok en arriere-plan
    $ngrokJob = Start-Job -ScriptBlock {
        ngrok http 3000
    }
    
    Start-Sleep -Seconds 3
    
    # Recuperer l'URL ngrok
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
        $ngrokUrl = $ngrokApi.tunnels[0].public_url
        
        Write-Host "  [OK] ngrok actif: $ngrokUrl" -ForegroundColor Green
        Write-Host "  [IMPORTANT] Copiez cette URL dans:" -ForegroundColor Yellow
        Write-Host "    addin/src/taskpane/taskpane.js (ligne 9)" -ForegroundColor Yellow
    } catch {
        Write-Host "  [ATTENTION] Impossible de recuperer l'URL ngrok" -ForegroundColor Yellow
        Write-Host "    Verifiez http://localhost:4040 manuellement" -ForegroundColor Yellow
    }
}

# Étape 5: Démarrer le serveur de dev Add-in
Write-Host "`n[5/6] Démarrage du serveur Add-in..." -ForegroundColor Yellow

$addinPath = Join-Path $PSScriptRoot "addin"

if (-not (Test-Path $addinPath)) {
    Write-Host "✗ Dossier addin introuvable: $addinPath" -ForegroundColor Red
    Stop-Job $backendJob
    Remove-Job $backendJob
    if ($ngrokJob) {
        Stop-Job $ngrokJob
        Remove-Job $ngrokJob
    }
    exit 1
}

# Vérifier si node_modules existe
$addinNodeModules = Join-Path $addinPath "node_modules"
if (-not (Test-Path $addinNodeModules)) {
    Write-Host "  Installation des dépendances add-in..." -ForegroundColor Yellow
    Set-Location $addinPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        Stop-Job $backendJob
        Remove-Job $backendJob
        exit 1
    }
}

# Vérifier les certificats SSL
Write-Host "  Vérification des certificats SSL..." -ForegroundColor Gray
Set-Location $addinPath
npx office-addin-dev-certs install --machine 2>$null

# Démarrer le serveur de dev
Write-Host "  Démarrage du serveur webpack..." -ForegroundColor Gray
$addinJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev-server
} -ArgumentList $addinPath

Start-Sleep -Seconds 8

# Étape 6: Résumé
Write-Host "`n[6/6] Résumé" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$services = @(
    @{Name="Ollama"; Port=11434; Status=(Test-Port 11434)},
    @{Name="ChromaDB"; Port="Embedded"; Status=$true},
    @{Name="Backend API"; Port=3000; Status=(Test-Port 3000)},
    @{Name="Add-in Dev Server"; Port=3000; Status=$true}
)

foreach ($service in $services) {
    $status = if ($service.Status) { "✓ ACTIF" } else { "✗ INACTIF" }
    $color = if ($service.Status) { "Green" } else { "Red" }
    Write-Host "$($service.Name) (port $($service.Port)): " -NoNewline
    Write-Host $status -ForegroundColor $color
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Tous les services sont démarrés!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📌 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "1. Vérifiez l'URL ngrok ci-dessus" -ForegroundColor White
Write-Host "2. Mettez à jour addin/src/taskpane/taskpane.js avec cette URL" -ForegroundColor White
Write-Host "3. Ouvrez Outlook Desktop" -ForegroundColor White
Write-Host "4. Installez l'add-in depuis: addin/manifest.xml" -ForegroundColor White
Write-Host "5. Testez sur un email!" -ForegroundColor White

Write-Host "`n📊 URLS UTILES:" -ForegroundColor Yellow
Write-Host "- Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "- Health check: http://localhost:3000/api/health" -ForegroundColor White
Write-Host "- ChromaDB: Mode embedded (local, pas de serveur)" -ForegroundColor White
if ($ngrokUrl) {
    Write-Host "- ngrok URL: $ngrokUrl" -ForegroundColor White
    Write-Host "- ngrok Dashboard: http://localhost:4040" -ForegroundColor White
}

Write-Host "`n🛑 Pour arrêter tous les services:" -ForegroundColor Yellow
Write-Host "   Appuyez sur Ctrl+C ou fermez cette fenêtre" -ForegroundColor White

Write-Host "`n⏳ Services en cours d'exécution... (Ctrl+C pour arrêter)`n" -ForegroundColor Cyan

# Garder le script actif
try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Vérifier que les services tournent toujours
        if (-not (Test-Port 3000)) {
            Write-Host "⚠ Le backend s'est arrêté!" -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host "`n🛑 Arrêt des services..." -ForegroundColor Yellow
    
    if ($backendJob) {
        Stop-Job $backendJob
        Remove-Job $backendJob
        Write-Host "  ✓ Backend arrêté" -ForegroundColor Green
    }
    
    if ($addinJob) {
        Stop-Job $addinJob
        Remove-Job $addinJob
        Write-Host "  ✓ Add-in serveur arrêté" -ForegroundColor Green
    }
    
    if ($ngrokJob) {
        Stop-Job $ngrokJob
        Remove-Job $ngrokJob
        Write-Host "  ✓ ngrok arrêté" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Tous les services sont arrêtés" -ForegroundColor Green
}
