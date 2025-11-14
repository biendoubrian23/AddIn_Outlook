# 📝 Commandes essentielles - Assistant IA Outlook

## 🚀 Démarrage rapide

### Script automatique (RECOMMANDÉ)
```powershell
.\start-assistant.ps1
```

### Indexation des documents
```powershell
.\index-docs.ps1
```

---

## 🔧 Commandes manuelles

### Backend

```powershell
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Indexer les documents de /docs
npm run index

# Vider la base de connaissances
npm run clear-index

# Démarrer le serveur (mode production)
npm start

# Démarrer en mode développement (avec nodemon)
npm run dev

# Lancer les tests
npm test
```

### Add-in Outlook

```powershell
# Aller dans le dossier addin
cd addin

# Installer les dépendances
npm install

# Installer les certificats SSL pour localhost
npx office-addin-dev-certs install

# Démarrer le serveur de développement
npm run dev-server

# Build production
npm run build

# Valider le manifest.xml
npm run validate

# Démarrer le debugging Outlook Desktop
npm start

# Arrêter le debugging
npm stop
```

---

## 🐳 Docker (ChromaDB)

```powershell
# Démarrer ChromaDB
docker run -d -p 8000:8000 --name ChromaDB-ai ChromaDB/ChromaDB

# Vérifier le statut
docker ps | grep ChromaDB

# Voir les logs
docker logs ChromaDB-ai

# Arrêter ChromaDB
docker stop ChromaDB-ai

# Redémarrer ChromaDB
docker start ChromaDB-ai

# Supprimer le container
docker rm -f ChromaDB-ai
```

---

## 🤖 Ollama

```powershell
# Lister les modèles installés
ollama list

# Télécharger le modèle Llama 3.2 (3B)
ollama pull llama3.1:8b

# Tester le modèle
ollama run llama3.1:8b "Bonjour, comment vas-tu?"

# Supprimer un modèle
ollama rm llama3.1:8b

# Vérifier qu'Ollama tourne
curl http://localhost:11434
```

---

## 🌐 ngrok

```powershell
# Configurer le token (une seule fois)
ngrok config add-authtoken VOTRE_TOKEN

# Exposer le port 3000
ngrok http 3000

# Exposer avec un sous-domaine custom (plan payant)
ngrok http 3000 --subdomain=mon-assistant-ia

# Voir le dashboard
# Ouvrir http://localhost:4040
```

---

## 🧪 Tests et Debug

### Tester le backend

```powershell
# Health check
curl http://localhost:3000/api/health

# Tester la génération de réponse
curl -X POST http://localhost:3000/api/email/generate-response `
  -H "Content-Type: application/json" `
  -d '{\"from\":\"test@example.com\",\"subject\":\"Test\",\"body\":\"Bonjour, je voudrais des informations.\"}'

# Rechercher dans la base de connaissances
curl -X POST http://localhost:3000/api/knowledge/search `
  -H "Content-Type: application/json" `
  -d '{\"query\":\"Comment obtenir un devis?\"}'

# Voir les stats de la base
curl http://localhost:3000/api/knowledge/stats
```

### Vérifier les services

```powershell
# ChromaDB
curl http://localhost:8000/dashboard

# Ollama
curl http://localhost:11434

# Backend
curl http://localhost:3000/api/info
```

---

## 📋 Logs

### Backend logs

```powershell
# Voir les logs en temps réel
Get-Content backend\logs\app.log -Wait -Tail 50

# Voir les erreurs uniquement
Get-Content backend\logs\error.log -Wait
```

### ChromaDB logs

```powershell
docker logs -f ChromaDB-ai
```

---

## 🔄 Mise à jour

### Mettre à jour les dépendances

```powershell
# Backend
cd backend
npm update

# Add-in
cd addin
npm update
```

### Mettre à jour Ollama

```powershell
# Télécharger la dernière version depuis ollama.ai
# Puis re-télécharger le modèle
ollama pull llama3.1:8b
```

---

## 🧹 Nettoyage

### Supprimer les données temporaires

```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules, logs

# Add-in
cd addin
Remove-Item -Recurse -Force node_modules, dist
```

### Réinitialiser complètement

```powershell
# 1. Supprimer ChromaDB
docker rm -f ChromaDB-ai

# 2. Vider les logs
Remove-Item backend\logs\*.log

# 3. Réinstaller les dépendances
cd backend
npm install

cd ..\addin
npm install
```

---

## 📦 Variables d'environnement importantes

### Backend (.env)

```env
# Serveur
PORT=3000
NODE_ENV=development

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# LLM Params
LLM_TEMPERATURE=0.1
LLM_TOP_P=0.3
LLM_TOP_K=30
LLM_NUM_PREDICT=400
LLM_REPEAT_PENALTY=1.3

# ChromaDB
ChromaDB_URL=http://localhost:8000
ChromaDB_COLLECTION_NAME=email_knowledge_base

# RAG
CHUNK_SIZE=1000
CHUNK_OVERLAP=300
TOP_K_RESULTS=6
RERANK_TOP_N=3
```

---

## ⚡ Raccourcis utiles

### Tout démarrer d'un coup

```powershell
# Terminal 1: Backend
cd backend; npm start

# Terminal 2: ngrok
ngrok http 3000

# Terminal 3: Add-in
cd addin; npm run dev-server
```

### Tout arrêter

```powershell
# Ctrl+C dans chaque terminal
# Ou fermer les fenêtres PowerShell
```

---

## 🆘 En cas de problème

### Redémarrer tous les services

```powershell
# 1. Tuer tous les processus Node
Get-Process node | Stop-Process -Force

# 2. Redémarrer ChromaDB
docker restart ChromaDB-ai

# 3. Vérifier Ollama
curl http://localhost:11434

# 4. Relancer tout
.\start-assistant.ps1
```

### Réinstaller l'Add-in dans Outlook

1. Ouvrir Outlook
2. Fichier → Gérer les compléments
3. Supprimer "Assistant IA Email"
4. Réinstaller depuis manifest.xml

---

**Pour plus d'aide : consultez [INSTALLATION.md](./INSTALLATION.md)**
