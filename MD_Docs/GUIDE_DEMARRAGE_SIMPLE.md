# 🚀 GUIDE DE DÉMARRAGE SIMPLE

## ⚠️ IMPORTANT : Ce qu'il faut comprendre

### L'add-in Outlook est composé de 2 parties :

```
┌──────────────────────────────────────────────┐
│  PARTIE 1: BACKEND (serveur)                 │
│  - API Node.js (port 3000)                   │
│  - ChromaDB (base de données vectorielle)      │
│  - Ollama (intelligence artificielle)        │
│  - ngrok (exposition HTTPS)                  │
│                                              │
│  👉 DOIT TOURNER EN PERMANENCE               │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  PARTIE 2: ADD-IN OUTLOOK (interface)        │
│  - Bouton dans Outlook                       │
│  - Interface utilisateur                     │
│                                              │
│  👉 SE CONNECTE AU BACKEND                   │
└──────────────────────────────────────────────┘
```

---

## ✅ ÉTAPES À SUIVRE (dans l'ordre)

### 📥 ÉTAPE 1: Installer les prérequis

#### A. Node.js (obligatoire)
```powershell
# Vérifier si installé
node --version

# Si pas installé, télécharger:
# https://nodejs.org/en/download/
```

#### B. Ollama (obligatoire)
```powershell
# Télécharger et installer:
# https://ollama.ai/download

# Après installation, vérifier:
curl http://localhost:11434

# Télécharger le modèle Llama 3.2:
ollama pull llama3.1:8b
```

#### C. Docker (obligatoire pour ChromaDB)
```powershell
# Télécharger et installer Docker Desktop:
# https://www.docker.com/products/docker-desktop/

# Après installation, vérifier:
docker --version
```

#### D. ngrok (recommandé)
```powershell
# Créer un compte gratuit:
# https://ngrok.com/

# Télécharger ngrok:
# https://ngrok.com/download

# Ajouter au PATH ou déplacer ngrok.exe dans le dossier du projet
```

---

### 🔧 ÉTAPE 2: Préparer le backend

```powershell
# 1. Aller dans le dossier backend
cd X:\MesApplis\BiendouCorp\AddIn_Outlook\backend

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env (copie de .env.example)
Copy-Item .env.example .env

# 4. Vérifier le fichier .env
notepad .env
```

---

### 🗄️ ÉTAPE 3: Démarrer ChromaDB (base de données)

```powershell
# Démarrer ChromaDB avec Docker
docker run -d -p 8000:8000 --name ChromaDB-ai ChromaDB/ChromaDB

# Vérifier que ça tourne
curl http://localhost:8000/dashboard
```

**✅ Vous devriez voir une page web**

---

### 📚 ÉTAPE 4: Indexer vos documents

```powershell
# Toujours dans le dossier backend
cd X:\MesApplis\BiendouCorp\AddIn_Outlook\backend

# Lancer l'indexation des documents du dossier /docs
npm run index
```

**⚠️ CETTE ÉTAPE EST CRUCIALE !**
- Elle lit tous les fichiers dans le dossier `/docs`
- Elle les découpe en morceaux (chunks)
- Elle les stocke dans ChromaDB

**Vous devriez voir :**
```
Indexation en cours...
✓ document1.txt (5 chunks)
✓ document2.pdf (12 chunks)
...
Total: 50 chunks indexés
```

---

### 🚀 ÉTAPE 5: Démarrer le backend API

**Option A: Terminal normal (recommandé pour débuter)**
```powershell
cd X:\MesApplis\BiendouCorp\AddIn_Outlook\backend
npm start
```

**Vous devriez voir :**
```
Server running on http://localhost:3000
Ollama connected ✓
ChromaDB connected ✓
```

**⚠️ NE FERMEZ PAS CETTE FENÊTRE !**
Le serveur doit rester actif.

---

### 🌐 ÉTAPE 6: Démarrer ngrok (exposition HTTPS)

**Ouvrir un NOUVEAU terminal PowerShell**

```powershell
# Aller à la racine du projet
cd X:\MesApplis\BiendouCorp\AddIn_Outlook

# Démarrer ngrok
ngrok http 3000
```

**Vous devriez voir :**
```
Session Status    online
Forwarding        https://abc123.ngrok-free.app -> http://localhost:3000
```

**📋 COPIEZ L'URL HTTPS** (exemple: `https://abc123.ngrok-free.app`)

**⚠️ NE FERMEZ PAS CETTE FENÊTRE !**

---

### ✏️ ÉTAPE 7: Configurer l'URL dans l'add-in

```powershell
# Ouvrir le fichier JavaScript
notepad X:\MesApplis\BiendouCorp\AddIn_Outlook\addin\src\taskpane\taskpane.js
```

**Ligne 9, remplacer :**
```javascript
const API_URL = 'YOUR-NGROK-URL';
```

**Par (avec VOTRE URL ngrok) :**
```javascript
const API_URL = 'https://abc123.ngrok-free.app/api';
```

**💾 SAUVEGARDER le fichier**

---

### 🎨 ÉTAPE 8: Démarrer le serveur de développement de l'add-in

**Ouvrir un 3ème terminal PowerShell**

```powershell
# Aller dans le dossier addin
cd X:\MesApplis\BiendouCorp\AddIn_Outlook\addin

# Installer les dépendances (première fois seulement)
npm install

# Démarrer le serveur de dev
npm run dev-server
```

**Vous devriez voir :**
```
Webpack dev server listening on port 3000
```

**⚠️ NE FERMEZ PAS CETTE FENÊTRE !**

---

### 📧 ÉTAPE 9: Installer l'add-in dans Outlook

1. **Ouvrir Outlook Desktop** (pas Outlook Web)

2. **Aller dans :**
   - Fichier → Gérer les compléments
   - OU Fichier → Obtenir des compléments

3. **Cliquer sur :**
   - "Mes compléments" (menu de gauche)
   - "+ Ajouter un complément personnalisé"
   - "Ajouter à partir d'un fichier..."

4. **Sélectionner le fichier :**
   ```
   X:\MesApplis\BiendouCorp\AddIn_Outlook\addin\manifest.xml
   ```

5. **Accepter l'avertissement** de sécurité

6. **Redémarrer Outlook**

---

### 🎯 ÉTAPE 10: Tester l'add-in

1. **Ouvrir un email** dans Outlook

2. **Chercher le bouton** "🤖 Réponse IA" dans le ruban

3. **Cliquer dessus**

4. **Cliquer sur "Générer une réponse"**

5. **Attendre 10-30 secondes**

---

## 🔍 Vérifications rapides

### Est-ce que tout tourne ?

```powershell
# Vérifier Ollama
curl http://localhost:11434

# Vérifier ChromaDB
curl http://localhost:8000

# Vérifier Backend
curl http://localhost:3000/api/health

# Vérifier combien de documents indexés
curl http://localhost:3000/api/knowledge/stats
```

---

## ❓ FAQ

### Q: Pourquoi 3 terminaux ?
**R:** Parce que vous avez 3 services qui doivent tourner en même temps :
1. Backend API (Node.js)
2. ngrok (tunnel HTTPS)
3. Add-in dev server (Webpack)

### Q: Est-ce que je dois faire ça à chaque fois ?
**R:** Oui, à chaque démarrage de PC. Mais vous pouvez créer un script batch pour automatiser.

### Q: Pourquoi VSCode ?
**R:** VSCode n'est PAS obligatoire. Il est juste utile pour :
- Éditer le code
- Voir les fichiers
- Utiliser les terminaux intégrés

Vous pouvez tout faire avec PowerShell et Notepad si vous voulez.

### Q: Les documents sont-ils indexés ?
**R:** Pour vérifier :
```powershell
curl http://localhost:3000/api/knowledge/stats
```

Vous devriez voir le nombre de chunks indexés.

### Q: Le modèle Llama 3.2 est-il téléchargé ?
**R:** Pour vérifier :
```powershell
ollama list
```

Vous devriez voir `llama3.1:8b` dans la liste.

---

## 🆘 En cas de problème

Consultez : [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📝 Résumé ultra-rapide

```powershell
# Terminal 1: Backend
cd backend
npm install
npm run index          # Indexer les docs (1ère fois)
npm start

# Terminal 2: ngrok
ngrok http 3000        # Copier l'URL

# Terminal 3: Add-in
cd addin
npm install
# Mettre à jour l'URL ngrok dans taskpane.js ligne 9
npm run dev-server

# Outlook
# Installer manifest.xml via Fichier → Gérer compléments
```

**C'est tout ! 🎉**
