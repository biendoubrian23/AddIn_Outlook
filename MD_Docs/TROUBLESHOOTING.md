# 🔧 Résolution des problèmes (Troubleshooting)

## 🚨 Problèmes courants et solutions

### 1. "Ollama n'est pas disponible" ❌

**Symptômes :**
```
Error: Ollama connection failed
OllamaError: Erreur génération
```

**Solutions :**

```powershell
# A. Vérifier qu'Ollama tourne
curl http://localhost:11434

# B. Si aucune réponse, démarrer Ollama
# Windows: Chercher "Ollama" dans la barre des tâches et cliquer
# Mac: Lancer l'application Ollama

# C. Vérifier le modèle
ollama list

# D. Si le modèle n'est pas là
ollama pull llama3.2:3b

# E. Tester le modèle
ollama run llama3.2:3b "Bonjour"
```

**Logs à vérifier :**
```powershell
# Backend logs
Get-Content backend\logs\app.log -Tail 20
```

---

### 2. "ChromaDB connection failed" ❌

**Symptômes :**
```
ChromaDBError: Erreur ChromaDB init
Error connecting to ChromaDB at http://localhost:8000
```

**Solutions :**

```powershell
# A. Vérifier que ChromaDB tourne
docker ps | grep ChromaDB

# B. Si rien, démarrer ChromaDB
docker run -d -p 8000:8000 --name ChromaDB-ai ChromaDB/ChromaDB

# C. Vérifier le port
Test-NetConnection -ComputerName localhost -Port 8000

# D. Tester l'API ChromaDB
curl http://localhost:8000/dashboard

# E. Voir les logs ChromaDB
docker logs ChromaDB-ai

# F. Redémarrer ChromaDB
docker restart ChromaDB-ai
```

**Erreur "port already in use" :**
```powershell
# Trouver le processus qui utilise le port 8000
Get-NetTCPConnection -LocalPort 8000

# Arrêter le container existant
docker ps -a | grep ChromaDB
docker rm -f <container_id>

# Redémarrer proprement
docker run -d -p 8000:8000 --name ChromaDB-ai ChromaDB/ChromaDB
```

---

### 3. "Le backend ne démarre pas" ❌

**Symptômes :**
```
Error: Cannot find module...
Port 3000 is already in use
```

**Solutions :**

```powershell
# A. Vérifier Node.js
node --version  # Doit être 18+

# B. Réinstaller les dépendances
cd backend
Remove-Item -Recurse -Force node_modules
npm install

# C. Vérifier le fichier .env
Test-Path backend\.env  # Doit retourner True

# D. Si False, créer .env
Copy-Item backend\.env.example backend\.env

# E. Port 3000 occupé
Get-NetTCPConnection -LocalPort 3000
# Tuer le processus Node
Get-Process node | Stop-Process -Force

# F. Relancer
npm start
```

**Erreur "Cannot find module '@xenova/transformers'" :**
```powershell
# Réinstaller les dépendances
npm install @xenova/transformers --save
```

---

### 4. "L'Add-in ne s'affiche pas dans Outlook" ❌

**Symptômes :**
- Pas de bouton "🤖 Réponse IA" dans le ruban
- L'add-in n'apparaît pas dans la liste

**Solutions :**

```powershell
# A. Vérifier que le serveur de dev tourne
# Dans le dossier addin
npm run dev-server

# B. Vérifier les certificats SSL
npx office-addin-dev-certs install

# C. Valider le manifest
npm run validate

# D. Redémarrer Outlook COMPLÈTEMENT
# Fermer toutes les fenêtres Outlook
# Tuer le processus si nécessaire
Get-Process outlook | Stop-Process -Force

# E. Réinstaller l'add-in
# 1. Ouvrir Outlook
# 2. Fichier → Gérer les compléments
# 3. Supprimer "Assistant IA Email" s'il existe
# 4. + Ajouter → Ajouter à partir d'un fichier
# 5. Sélectionner manifest.xml
```

**Erreur de certificat SSL :**
```powershell
# Désinstaller les certificats
npx office-addin-dev-certs uninstall

# Réinstaller
npx office-addin-dev-certs install --machine

# Redémarrer Outlook
```

---

### 5. "Erreur CORS" / "Failed to fetch" ❌

**Symptômes :**
```
Access to fetch blocked by CORS policy
Failed to fetch
```

**Solutions :**

```powershell
# A. Vérifier l'URL dans taskpane.js
# Fichier: addin/src/taskpane/taskpane.js
# Ligne 9: API_URL doit correspondre à votre URL ngrok

# B. Vérifier que ngrok tourne
curl http://localhost:4040/api/tunnels

# C. Vérifier le .env backend
# ALLOWED_ORIGINS doit contenir: https://*.ngrok-free.app

# D. Redémarrer le backend après modification
cd backend
npm start
```

**URL ngrok changée :**
```powershell
# 1. Récupérer la nouvelle URL ngrok
curl http://localhost:4040/api/tunnels

# 2. Mettre à jour taskpane.js ligne 9

# 3. Redémarrer le serveur add-in
cd addin
# Ctrl+C pour arrêter
npm run dev-server
```

---

### 6. "Génération très lente" (>60s) 🐌

**Symptômes :**
- Génération prend plus de 60 secondes
- Timeout errors

**Solutions :**

```powershell
# A. Vérifier les ressources système
# RAM disponible
Get-Counter '\Memory\Available MBytes'

# CPU usage
Get-Counter '\Processor(_Total)\% Processor Time'

# B. Réduire NUM_PREDICT dans .env
# backend/.env
LLM_NUM_PREDICT=300  # Au lieu de 400

# C. Utiliser un modèle plus petit
ollama pull llama3.2:1b

# Modifier .env
OLLAMA_MODEL=llama3.2:1b

# D. Augmenter la température (plus rapide mais moins précis)
LLM_TEMPERATURE=0.3  # Au lieu de 0.1

# E. Réduire le nombre de documents
TOP_K_RESULTS=4      # Au lieu de 6
RERANK_TOP_N=2       # Au lieu de 3
```

---

### 7. "Aucun document trouvé" / "Confidence très basse" 📉

**Symptômes :**
```json
{
  "confidence": 15,
  "sources": []
}
```

**Solutions :**

```powershell
# A. Vérifier que les documents sont indexés
cd backend
npm run index

# B. Vérifier le nombre de chunks
curl http://localhost:3000/api/knowledge/stats

# C. Réindexer complètement
npm run clear-index
npm run index

# D. Vérifier les fichiers dans /docs
Get-ChildItem ../docs

# E. Tester la recherche manuellement
curl -X POST http://localhost:3000/api/knowledge/search `
  -H "Content-Type: application/json" `
  -d '{\"query\":\"devis\"}'
```

**Aucun document dans /docs :**
```powershell
# Copier vos documents
Copy-Item "C:\MesDocuments\*.pdf" docs\
Copy-Item "C:\MesDocuments\*.txt" docs\

# Réindexer
npm run index
```

---

### 8. "ngrok expired" / "Session expired" ⏰

**Symptômes :**
```
ERR_CONNECTION_REFUSED
ngrok tunnel expired
```

**Solutions :**

```powershell
# A. Redémarrer ngrok
ngrok http 3000

# B. Récupérer la nouvelle URL
curl http://localhost:4040/api/tunnels

# C. Mettre à jour taskpane.js avec la nouvelle URL

# D. Pour éviter ce problème, utiliser ngrok avec un domaine fixe
# (Plan payant : https://ngrok.com/pricing)
ngrok http 3000 --domain=mon-assistant-ia.ngrok.io
```

---

### 9. "Erreur lors de l'indexation" 📚

**Symptômes :**
```
Erreur lors de l'extraction du PDF
Cannot read properties of undefined
```

**Solutions :**

```powershell
# A. Vérifier les dépendances
npm install pdf-parse mammoth --save

# B. Vérifier les permissions des fichiers
Get-Acl docs\document.pdf

# C. Tester avec un fichier simple
# Créer un fichier test.txt
"Ceci est un test" | Out-File docs\test.txt

# Réindexer
npm run index

# D. Ignorer les fichiers corrompus
# Les fichiers qui échouent sont automatiquement ignorés
# Vérifier les logs pour voir les erreurs
```

---

### 10. "L'add-in se fige" / "Pas de réponse" ⏸️

**Symptômes :**
- Le bouton "Générer" ne fait rien
- L'interface est bloquée

**Solutions :**

```powershell
# A. Ouvrir la console développeur
# Dans Outlook: Ctrl+Shift+I (Windows) ou Cmd+Option+I (Mac)

# B. Vérifier les erreurs JavaScript
# Console → Rechercher les erreurs en rouge

# C. Vérifier que l'API répond
curl http://localhost:3000/api/health

# D. Vider le cache Outlook
# Fermer Outlook
Remove-Item "$env:LOCALAPPDATA\Microsoft\Outlook\*.tmp" -Force

# E. Redémarrer tous les services
.\start-assistant.ps1
```

---

## 📋 Checklist de diagnostic

Utilisez cette checklist pour diagnostiquer les problèmes :

```powershell
# 1. Vérifier Ollama
curl http://localhost:11434
ollama list

# 2. Vérifier ChromaDB
curl http://localhost:8000/dashboard
docker ps | grep ChromaDB

# 3. Vérifier Backend
curl http://localhost:3000/api/health

# 4. Vérifier ngrok
curl http://localhost:4040/api/tunnels

# 5. Vérifier les documents indexés
curl http://localhost:3000/api/knowledge/stats

# 6. Tester la génération
curl -X POST http://localhost:3000/api/email/generate-response `
  -H "Content-Type: application/json" `
  -d '{\"from\":\"test@test.com\",\"subject\":\"Test\",\"body\":\"Test message\"}'
```

---

## 🔍 Logs importants

### Backend logs
```powershell
# Logs complets
Get-Content backend\logs\app.log -Wait

# Erreurs uniquement
Get-Content backend\logs\error.log -Wait

# Dernières 50 lignes
Get-Content backend\logs\app.log -Tail 50
```

### ChromaDB logs
```powershell
docker logs -f ChromaDB-ai
```

### Console navigateur (Add-in)
```
F12 dans Outlook → Console
Rechercher les erreurs en rouge
```

---

## 🆘 Réinitialisation complète

Si rien ne fonctionne, réinitialisez tout :

```powershell
# 1. Arrêter tous les processus
Get-Process node | Stop-Process -Force
docker stop ChromaDB-ai

# 2. Supprimer les données
docker rm -f ChromaDB-ai
Remove-Item backend\logs\*.log -Force
Remove-Item backend\node_modules -Recurse -Force
Remove-Item addin\node_modules -Recurse -Force

# 3. Réinstaller
cd backend
npm install

cd ..\addin
npm install

# 4. Recréer ChromaDB
docker run -d -p 8000:8000 --name ChromaDB-ai ChromaDB/ChromaDB

# 5. Réindexer
cd ..\backend
npm run index

# 6. Redémarrer tout
..\start-assistant.ps1
```

---

## 📞 Support

Si le problème persiste :

1. **Vérifier les logs** : `backend/logs/app.log`
2. **Consulter la documentation** : [INSTALLATION.md](./INSTALLATION.md)
3. **Chercher l'erreur** sur GitHub Issues
4. **Ouvrir une issue** avec :
   - Message d'erreur complet
   - Logs backend
   - Configuration (.env anonymisé)
   - Versions (Node, Ollama, etc.)

---

**Bonne chance ! 🍀**
