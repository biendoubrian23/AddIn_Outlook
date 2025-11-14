# 🤖 Outlook AI Assistant - Guide d'installation

Assistant IA pour générer des réponses automatiques aux emails avec RAG et Llama 3.2.

## 📋 Prérequis

### Logiciels nécessaires
- **Node.js** 18+ : [nodejs.org](https://nodejs.org/)
- **Ollama** : [ollama.ai](https://ollama.ai/)
- **ChromaDB** : Via Docker ou binaire
- **ngrok** : [ngrok.com](https://ngrok.com/) (pour exposer le backend)
- **Outlook Desktop** (Windows/Mac)

### Configuration système
- RAM : 8 GB minimum (16 GB recommandé pour Llama 3.2)
- Disque : 10 GB d'espace libre
- OS : Windows 10/11, macOS 10.15+

---

## 🚀 Installation étape par étape

### ÉTAPE 1 : Installer Ollama et le modèle Llama 3.2

#### Windows/Mac
1. Télécharger Ollama : https://ollama.ai/download
2. Installer et démarrer Ollama
3. Télécharger le modèle :
```bash
ollama pull llama3.1:8b
```

4. Vérifier :
```bash
ollama list
```

### ÉTAPE 2 : Installer ChromaDB (Vector Database)

#### Option 1 : Docker (Recommandé)
```bash
docker run -d -p 8000:8000 ChromaDB/ChromaDB
```

#### Option 2 : Binaire
1. Télécharger : https://github.com/ChromaDB/ChromaDB/releases
2. Lancer :
```bash
./ChromaDB
```

Vérifier : http://localhost:8000/dashboard

### ÉTAPE 3 : Configurer le Backend

1. **Aller dans le dossier backend** :
```bash
cd backend
```

2. **Installer les dépendances** :
```bash
npm install
```

3. **Créer le fichier .env** :
```bash
cp .env.example .env
```

4. **Éditer le .env** :
```env
PORT=3000
NODE_ENV=development

OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

LLM_TEMPERATURE=0.1
LLM_TOP_P=0.3
LLM_TOP_K=30
LLM_NUM_PREDICT=400
LLM_REPEAT_PENALTY=1.3

ChromaDB_URL=http://localhost:8000
ChromaDB_COLLECTION_NAME=email_knowledge_base

CHUNK_SIZE=1000
CHUNK_OVERLAP=300
TOP_K_RESULTS=6
RERANK_TOP_N=3

EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384

LOG_LEVEL=info
KNOWLEDGE_BASE_PATH=../docs
```

### ÉTAPE 4 : Indexer les documents RAG

1. **Vérifier que vos documents sont dans `/docs`**

2. **Lancer l'indexation** :
```bash
npm run index
```

Vous devriez voir :
```
🤖 OUTLOOK AI ASSISTANT - INDEXATION DES DOCUMENTS
[1/4] Initialisation du service RAG...
[2/4] Recherche des fichiers...
✓ 20 fichier(s) trouvé(s)
[3/4] Indexation des documents...
✓ INDEXATION TERMINÉE
```

### ÉTAPE 5 : Démarrer le backend

```bash
npm start
```

Vous devriez voir :
```
✅ Serveur démarré sur le port 3000
📍 URL: http://localhost:3000
🤖 Modèle LLM: llama3.1:8b
```

### ÉTAPE 6 : Exposer le backend avec ngrok

1. **Installer ngrok** : https://ngrok.com/download

2. **Créer un compte gratuit** sur ngrok.com

3. **Configurer le token** :
```bash
ngrok config add-authtoken VOTRE_TOKEN
```

4. **Exposer le port 3000** :
```bash
ngrok http 3000
```

5. **Noter l'URL** (exemple: `https://abc123.ngrok-free.app`)

### ÉTAPE 7 : Configurer l'Add-in Outlook

1. **Aller dans le dossier addin** :
```bash
cd ../addin
```

2. **Installer les dépendances** :
```bash
npm install
```

3. **Éditer `src/taskpane/taskpane.js`** :

Remplacer la ligne 9 :
```javascript
API_URL: 'https://YOUR-NGROK-URL.ngrok-free.app/api',
```

Par votre URL ngrok :
```javascript
API_URL: 'https://abc123.ngrok-free.app/api',
```

4. **Générer les certificats SSL** (pour localhost) :
```bash
npx office-addin-dev-certs install
```

### ÉTAPE 8 : Installer l'Add-in dans Outlook

#### Option A : Sideloading (Test)

**Windows - Outlook Desktop** :
1. Ouvrir Outlook Desktop
2. Aller dans **Fichier** → **Obtenir des compléments**
3. Cliquer sur **Mes compléments** (barre latérale gauche)
4. Descendre et cliquer sur **+ Ajouter un complément personnalisé** → **Ajouter à partir d'un fichier**
5. Naviguer vers `AddIn_Outlook/addin/manifest.xml`
6. Cliquer **Installer**
7. Accepter l'avertissement

**Mac - Outlook Desktop** :
1. Aller dans **Outils** → **Obtenir des compléments**
2. Suivre les mêmes étapes

**Outlook Web** :
1. Aller sur https://outlook.office.com
2. Cliquer sur ⚙️ Paramètres → **Afficher tous les paramètres**
3. **Courrier** → **Compléments personnalisés**
4. **+ Ajouter un complément personnalisé** → **Ajouter à partir d'un fichier**
5. Télécharger le `manifest.xml`

### ÉTAPE 9 : Tester l'Add-in

1. **Démarrer le serveur de développement** :
```bash
cd addin
npm run dev-server
```

2. **Ouvrir un email dans Outlook**

3. **Cliquer sur le bouton "🤖 Réponse IA"** dans le ruban

4. **Tester la génération de réponse** :
   - Cliquer sur "✨ Générer une réponse IA"
   - Attendre la génération (peut prendre 10-30 secondes)
   - Modifier si nécessaire
   - Cliquer sur "📤 Utiliser cette réponse"

---

## 🧪 Tests

### Tester le backend seul

```bash
cd backend
npm start
```

Puis dans un autre terminal :
```bash
curl http://localhost:3000/api/health
```

Devrait retourner :
```json
{
  "success": true,
  "services": {
    "api": true,
    "ChromaDB": true,
    "ollama": true
  }
}
```

### Tester la génération de réponse

```bash
curl -X POST http://localhost:3000/api/email/generate-response \
  -H "Content-Type: application/json" \
  -d '{
    "from": "client@example.com",
    "subject": "Demande de devis",
    "body": "Bonjour, je souhaite obtenir un devis pour l'impression d'un livre."
  }'
```

---

## 🔧 Résolution des problèmes

### Erreur : "Ollama n'est pas disponible"
```bash
# Vérifier qu'Ollama tourne
curl http://localhost:11434

# Redémarrer Ollama
# Windows: Chercher "Ollama" dans la barre des tâches
# Mac: Redémarrer l'application Ollama
```

### Erreur : "ChromaDB connection failed"
```bash
# Vérifier que ChromaDB tourne
curl http://localhost:8000/dashboard

# Si Docker:
docker ps | grep ChromaDB

# Redémarrer ChromaDB
docker restart <container_id>
```

### Erreur : "Le modèle llama3.1 n'existe pas"
```bash
# Télécharger le modèle
ollama pull llama3.1:8b

# Lister les modèles disponibles
ollama list
```

### Erreur CORS avec ngrok
Dans `backend/.env`, vérifier :
```env
ALLOWED_ORIGINS=https://*.ngrok-free.app,https://localhost:3000
```

### L'Add-in ne s'affiche pas dans Outlook
1. Vérifier que le serveur de dev tourne (`npm run dev-server`)
2. Vérifier les certificats SSL : `npx office-addin-dev-certs install`
3. Redémarrer Outlook complètement
4. Vérifier le manifest : `npm run validate`

---

## 📊 Architecture

```
┌─────────────────────────────────┐
│   Outlook Add-in (Frontend)     │
│   HTML/CSS/JS + Office.js       │
└────────────┬────────────────────┘
             │ HTTPS (ngrok)
             ↓
┌─────────────────────────────────┐
│   Backend API (Node.js/Express) │
│   Port 3000                     │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
┌─────────┐    ┌──────────────┐
│ Ollama  │    │   ChromaDB     │
│ Llama   │    │   (Vector    │
│ 3.2     │    │    DB)       │
└─────────┘    └──────────────┘
```

---

## 📚 Utilisation

### Générer une réponse
1. Sélectionner un email dans Outlook
2. Cliquer sur "🤖 Réponse IA"
3. Cliquer "✨ Générer une réponse IA"
4. Modifier la réponse si nécessaire
5. Cliquer "📤 Utiliser cette réponse"

### Ajouter des documents à la base de connaissances
1. Copier vos fichiers (.txt, .md, .pdf, .docx) dans `/docs`
2. Lancer :
```bash
cd backend
npm run index
```

### Vider la base de connaissances
```bash
cd backend
npm run clear-index
```

---

## 🎯 Configuration RAG

Dans `backend/.env` :

```env
# Taille des chunks de texte
CHUNK_SIZE=1000

# Chevauchement entre chunks
CHUNK_OVERLAP=300

# Nombre de résultats à récupérer
TOP_K_RESULTS=6

# Nombre de résultats après reranking
RERANK_TOP_N=3
```

## 🤖 Configuration LLM

```env
# Créativité (0-2, plus bas = plus déterministe)
LLM_TEMPERATURE=0.1

# Diversité du vocabulaire (0-1)
LLM_TOP_P=0.3

# Nombre de tokens à considérer
LLM_TOP_K=30

# Longueur maximale de la réponse
LLM_NUM_PREDICT=400

# Pénalité de répétition
LLM_REPEAT_PENALTY=1.3
```

---

## 📝 Licence

MIT © BiendouCorp

---

## 🆘 Support

Pour toute question :
1. Vérifier la section "Résolution des problèmes"
2. Consulter les logs : `backend/logs/app.log`
3. Tester l'endpoint `/api/health`

**Bon développement ! 🚀**
