# Guide de démarrage rapide - 5 minutes ⚡

## Checklist d'installation

### ✅ Prérequis installés

- [ ] Node.js 18+ installé
- [ ] Ollama installé et le modèle `llama3.2:3b` téléchargé
- [ ] Docker installé (pour ChromaDB)
- [ ] Compte ngrok créé (gratuit)

### ✅ Configuration backend

```powershell
# 1. Installer les dépendances
cd backend
npm install

# 2. Créer le .env
cp .env.example .env

# 3. Démarrer ChromaDB
docker run -d -p 8000:8000 ChromaDB/ChromaDB

# 4. Indexer les documents
npm run index

# 5. Démarrer le backend
npm start
```

### ✅ Exposer avec ngrok

```powershell
# Dans un nouveau terminal
ngrok http 3000

# Copier l'URL (ex: https://abc123.ngrok-free.app)
```

### ✅ Configuration Add-in

```powershell
# 1. Installer les dépendances
cd addin
npm install

# 2. Modifier taskpane.js
# Remplacer ligne 9:
# API_URL: 'https://VOTRE-URL-NGROK.ngrok-free.app/api'

# 3. Installer les certificats
npx office-addin-dev-certs install

# 4. Démarrer le serveur
npm run dev-server
```

### ✅ Installer dans Outlook

1. Ouvrir Outlook Desktop
2. Fichier → Obtenir des compléments → Mes compléments
3. + Ajouter un complément personnalisé → Ajouter à partir d'un fichier
4. Sélectionner `addin/manifest.xml`

## 🚀 Script automatique (Recommandé)

```powershell
# Tout en une commande !
.\start-assistant.ps1
```

Ce script:
- ✅ Vérifie tous les services
- ✅ Démarre tout automatiquement
- ✅ Affiche l'URL ngrok
- ✅ Garde les services actifs

## 🧪 Test rapide

```powershell
# Tester le backend
curl http://localhost:3000/api/health

# Devrait retourner:
# {"success":true,"services":{"api":true,"ChromaDB":true,"ollama":true}}
```

## ❓ Problème ?

Consultez [INSTALLATION.md](./INSTALLATION.md) pour la résolution des problèmes.

---

**Temps total: ~5 minutes** ⚡
