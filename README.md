# 🤖 Assistant IA Email Outlook

Assistant intelligent pour générer des réponses automatiques aux emails avec RAG (Retrieval-Augmented Generation) et Llama 3.2.

## ✨ Fonctionnalités

- 🤖 **Génération automatique de réponses** avec IA (Llama 3.2)
- 📚 **RAG (Retrieval-Augmented Generation)** : Recherche dans votre base de connaissances
- 🎯 **Détection d'intention** : Question, réclamation, demande de devis, etc.
- 📊 **Score de confiance** : Évaluation de la pertinence de la réponse
- 🔄 **Modification en temps réel** : Éditer la réponse avant de l'envoyer
- 📋 **Copier/Coller** : Copier facilement la réponse
- 📤 **Insertion directe** : Insérer la réponse dans l'éditeur Outlook

## 🏗️ Architecture

### Stack technique
- **Frontend** : HTML5, CSS3, Vanilla JavaScript, Office.js
- **Backend** : Node.js, Express
- **LLM** : Ollama + Llama 3.2 (3B paramètres)
- **Vector DB** : ChromaDB
- **Embeddings** : Xenova/all-MiniLM-L6-v2
- **Exposition** : ngrok (pour le développement local)

### Configuration RAG optimisée
- **Chunk Size** : 1000 caractères (+15% de complétude)
- **Chunk Overlap** : 300 caractères
- **Top-K Results** : 6 documents
- **Rerank Top-N** : 3 documents

### Paramètres LLM
- **Temperature** : 0.1 (réponses déterministes)
- **Top-P** : 0.3 (vocabulaire focalisé)
- **Top-K** : 30
- **Num Predict** : 400 tokens
- **Repeat Penalty** : 1.3

## 📁 Structure du projet

```
AddIn_Outlook/
├── backend/                    # API Node.js/Express
│   ├── src/
│   │   ├── config/            # Configuration
│   │   ├── services/          # Services (RAG, LLM, Embedding, ChromaDB)
│   │   ├── routes/            # Routes API
│   │   ├── middleware/        # Middleware (CORS, errors)
│   │   ├── utils/             # Utilitaires (logger, errors)
│   │   ├── scripts/           # Scripts d'indexation
│   │   └── server.js          # Point d'entrée
│   ├── package.json
│   └── .env.example
│
├── addin/                      # Add-in Outlook
│   ├── src/
│   │   ├── taskpane/          # Interface utilisateur
│   │   │   ├── taskpane.html
│   │   │   ├── taskpane.css
│   │   │   └── taskpane.js
│   │   └── commands/          # Commandes
│   ├── manifest.xml           # Manifest Outlook
│   ├── package.json
│   └── webpack.config.js
│
├── docs/                       # Base de connaissances (vos documents)
│   ├── document1.txt
│   ├── document2.pdf
│   └── ...
│
├── INSTALLATION.md             # Guide d'installation
└── README.md                   # Ce fichier
```

## 🚀 Démarrage rapide

### 1. Prérequis
```bash
# Installer Node.js 18+
# Installer Ollama : https://ollama.ai
# Installer Docker (pour ChromaDB)
# Créer un compte ngrok gratuit
```

### 2. Installation

```bash
# Cloner le projet
git clone <votre-repo>
cd AddIn_Outlook

# Installer Ollama et le modèle
ollama pull llama3.1:8b

# Démarrer ChromaDB
docker run -d -p 8000:8000 ChromaDB/ChromaDB

# Installer le backend
cd backend
npm install
cp .env.example .env
# Éditer .env si nécessaire

# Indexer vos documents
npm run index

# Démarrer le backend
npm start
```

### 3. Exposer avec ngrok

```bash
# Dans un autre terminal
ngrok http 3000

# Noter l'URL : https://abc123.ngrok-free.app
```

### 4. Installer l'Add-in

```bash
cd ../addin
npm install

# Éditer src/taskpane/taskpane.js
# Remplacer YOUR-NGROK-URL par votre URL ngrok

# Générer les certificats SSL
npx office-addin-dev-certs install

# Démarrer le serveur de dev
npm run dev-server
```

### 5. Ajouter à Outlook

**Outlook Desktop** :
1. Fichier → Obtenir des compléments → Mes compléments
2. + Ajouter un complément personnalisé → Ajouter à partir d'un fichier
3. Sélectionner `addin/manifest.xml`

**Outlook Web** :
1. ⚙️ Paramètres → Compléments personnalisés
2. + Ajouter un complément personnalisé
3. Télécharger `manifest.xml`

## 📖 Documentation complète

Consultez [INSTALLATION.md](./INSTALLATION.md) pour :
- Installation détaillée pas à pas
- Configuration avancée
- Résolution des problèmes
- Tests

## 🎯 Utilisation

### Dans Outlook

1. **Ouvrir un email**
2. **Cliquer sur "🤖 Réponse IA"** dans le ruban
3. **Cliquer "✨ Générer une réponse IA"**
4. **Attendre** (10-30 secondes selon la complexité)
5. **Modifier** la réponse si nécessaire
6. **Cliquer "📤 Utiliser cette réponse"**

## 📝 Licence

MIT © BiendouCorp

---

**Développé avec ❤️ par BiendouCorp**

Propulsé par 🦙 Llama 3.2