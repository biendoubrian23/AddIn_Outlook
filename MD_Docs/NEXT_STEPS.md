# 🎯 PROCHAINES ÉTAPES - Configuration finale

## ✅ Ce qui a été créé

Votre projet est maintenant structuré avec :

```
AddIn_Outlook/
├── backend/                 ✅ API Node.js/Express complète
├── addin/                   ✅ Add-in Outlook (HTML/CSS/JS)
├── docs/                    ✅ Vos documents RAG (déjà présents)
├── start-assistant.ps1      ✅ Script de démarrage automatique
├── index-docs.ps1           ✅ Script d'indexation rapide
├── INSTALLATION.md          ✅ Guide complet d'installation
├── QUICKSTART.md            ✅ Guide rapide 5 minutes
├── COMMANDS.md              ✅ Toutes les commandes utiles
└── README.md                ✅ Documentation principale
```

---

## 🔧 Configuration OBLIGATOIRE avant de démarrer

### 1. Créer le fichier .env dans backend/

```powershell
cd backend
Copy-Item .env.example .env
```

**Le fichier .env est déjà configuré avec vos paramètres :**
- Chunk size: 1000
- Chunk overlap: 300
- Top K: 6
- Rerank: 3
- Temperature: 0.1
- Top P: 0.3
- etc.

### 2. Modifier l'URL de l'API dans l'Add-in

**Fichier à modifier :** `addin/src/taskpane/taskpane.js`

**Ligne 9 :**
```javascript
API_URL: 'https://YOUR-NGROK-URL.ngrok-free.app/api',
```

**À remplacer par votre URL ngrok APRÈS avoir lancé ngrok** (voir étape suivante)

---

## 🚀 Installation et premier lancement

### Option A : Script automatique (RECOMMANDÉ)

```powershell
# Depuis la racine du projet
.\start-assistant.ps1
```

Ce script va :
1. ✅ Vérifier qu'Ollama tourne avec llama3.1:8b
2. ✅ Démarrer ChromaDB (Docker)
3. ✅ Installer les dépendances backend
4. ✅ Démarrer le backend sur le port 3000
5. ✅ Démarrer ngrok et afficher l'URL
6. ✅ Installer les dépendances add-in
7. ✅ Démarrer le serveur de dev add-in

**⚠️ Copiez l'URL ngrok affichée et mettez-la dans `addin/src/taskpane/taskpane.js` ligne 9**

### Option B : Manuel (étape par étape)

#### Étape 1 : Vérifier les prérequis

```powershell
# Vérifier Node.js
node --version  # Doit être 18+

# Vérifier Ollama et le modèle
ollama list     # Doit voir llama3.1

# Si le modèle n'est pas là :
ollama pull llama3.1:8b

# Vérifier Docker
docker --version
```

#### Étape 2 : Démarrer ChromaDB

```powershell
docker run -d -p 8000:8000 --name ChromaDB-ai ChromaDB/ChromaDB
```

Vérifier : http://localhost:8000/dashboard

#### Étape 3 : Backend

```powershell
cd backend

# Installer
npm install

# Créer .env
Copy-Item .env.example .env

# Indexer vos documents
npm run index

# Démarrer
npm start
```

Vérifier : http://localhost:3000/api/health

#### Étape 4 : ngrok

```powershell
# Dans un nouveau terminal
ngrok http 3000

# Noter l'URL (ex: https://abc123.ngrok-free.app)
```

#### Étape 5 : Configurer l'Add-in

**Modifier `addin/src/taskpane/taskpane.js` ligne 9 :**
```javascript
API_URL: 'https://abc123.ngrok-free.app/api',  // Votre URL ngrok
```

#### Étape 6 : Add-in

```powershell
cd addin

# Installer
npm install

# Certificats SSL
npx office-addin-dev-certs install

# Démarrer
npm run dev-server
```

#### Étape 7 : Installer dans Outlook

**Outlook Desktop (Windows) :**
1. Ouvrir Outlook
2. **Fichier** → **Obtenir des compléments**
3. **Mes compléments** (menu gauche)
4. **+ Ajouter un complément personnalisé** → **Ajouter à partir d'un fichier**
5. Sélectionner : `X:\MesApplis\BiendouCorp\AddIn_Outlook\addin\manifest.xml`
6. **Installer**
7. Accepter l'avertissement de sécurité

**Outlook Web :**
1. https://outlook.office.com
2. ⚙️ **Paramètres** → **Afficher tous les paramètres**
3. **Courrier** → **Compléments personnalisés**
4. **+ Ajouter un complément personnalisé** → **Ajouter à partir d'un fichier**
5. Télécharger le manifest.xml

---

## 🧪 Test de fonctionnement

### 1. Tester le backend seul

```powershell
curl http://localhost:3000/api/health
```

**Résultat attendu :**
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

### 2. Tester la génération de réponse

```powershell
curl -X POST http://localhost:3000/api/email/generate-response `
  -H "Content-Type: application/json" `
  -d '{\"from\":\"test@example.com\",\"subject\":\"Demande info\",\"body\":\"Bonjour, je voudrais des informations sur vos services.\"}'
```

**⏱️ Temps attendu : 10-30 secondes**

### 3. Tester dans Outlook

1. **Ouvrir un email** dans Outlook
2. **Cliquer** sur le bouton **"🤖 Réponse IA"** dans le ruban
3. Une fenêtre s'ouvre à droite
4. **Cliquer** sur **"✨ Générer une réponse IA"**
5. **Attendre** la génération (10-30s)
6. **Modifier** si nécessaire
7. **Cliquer** sur **"📤 Utiliser cette réponse"**

---

## 📊 Vérification des documents indexés

```powershell
cd backend
npm run index
```

**Vous devriez voir :**
```
🤖 OUTLOOK AI ASSISTANT - INDEXATION DES DOCUMENTS
[2/4] Recherche des fichiers...
✓ 20 fichier(s) trouvé(s)

[3/4] Indexation des documents...
[1/20] Traitement: coollibri_faq.txt
  ✓ Indexé avec succès (15 chunks)
...

✓ INDEXATION TERMINÉE
Fichiers traités:     20
Succès:               20
Chunks créés:         450
```

---

## 🎨 Icônes de l'Add-in (optionnel)

Pour avoir de belles icônes :

1. Créer les images dans `addin/assets/` :
   - icon-16.png (16x16)
   - icon-32.png (32x32)
   - icon-64.png (64x64)
   - icon-80.png (80x80)
   - icon-128.png (128x128)

2. Ou utiliser un service en ligne :
   - https://favicon.io/favicon-generator/
   - Créer un logo avec le texte "AI" ou emoji 🤖

**Sans icônes, l'add-in fonctionnera quand même !**

---

## ⚙️ Personnalisation

### Modifier les paramètres RAG

Éditer `backend/.env` :
```env
CHUNK_SIZE=1000          # Déjà configuré
CHUNK_OVERLAP=300        # Déjà configuré
TOP_K_RESULTS=6          # Déjà configuré
RERANK_TOP_N=3           # Déjà configuré
```

### Modifier les paramètres LLM

Éditer `backend/.env` :
```env
LLM_TEMPERATURE=0.1      # Déjà configuré (0 = déterministe, 2 = créatif)
LLM_TOP_P=0.3            # Déjà configuré (diversité vocabulaire)
LLM_TOP_K=30             # Déjà configuré
LLM_NUM_PREDICT=400      # Déjà configuré (longueur max)
LLM_REPEAT_PENALTY=1.3   # Déjà configuré
```

**Après modification, redémarrer le backend :**
```powershell
# Ctrl+C pour arrêter
npm start  # Redémarrer
```

---

## 🆘 Problèmes courants

### "Ollama n'est pas disponible"
```powershell
# Vérifier
curl http://localhost:11434

# Si rien, démarrer Ollama (icône dans la barre des tâches)
```

### "ChromaDB connection failed"
```powershell
# Vérifier
docker ps | grep ChromaDB

# Redémarrer
docker restart ChromaDB-ai
```

### "Le modèle n'existe pas"
```powershell
ollama pull llama3.1:8b
```

### "L'add-in ne s'affiche pas"
1. Vérifier que le serveur de dev tourne (`npm run dev-server`)
2. Redémarrer Outlook COMPLÈTEMENT
3. Vérifier les certificats : `npx office-addin-dev-certs install`

### "Erreur CORS"
Vérifier que l'URL ngrok est bien dans `taskpane.js` ligne 9

---

## 📚 Documentation

- **Installation complète :** [INSTALLATION.md](./INSTALLATION.md)
- **Guide rapide :** [QUICKSTART.md](./QUICKSTART.md)
- **Commandes :** [COMMANDS.md](./COMMANDS.md)
- **Readme :** [README.md](./README.md)

---

## ✅ Checklist finale

- [ ] Ollama installé et modèle llama3.1:8b téléchargé
- [ ] Docker installé et ChromaDB démarré
- [ ] Backend : `npm install` + `.env` créé
- [ ] Documents indexés : `npm run index`
- [ ] Backend démarré : `npm start` (port 3000)
- [ ] ngrok démarré et URL copiée
- [ ] Add-in : URL ngrok dans `taskpane.js` ligne 9
- [ ] Add-in : `npm install` + certificats installés
- [ ] Add-in : serveur de dev démarré
- [ ] Add-in installé dans Outlook
- [ ] Test réussi dans Outlook

---

## 🎉 C'est parti !

Une fois tout configuré, vous pouvez :

1. **Utiliser le script automatique** pour les prochains démarrages :
   ```powershell
   .\start-assistant.ps1
   ```

2. **Ajouter des documents** dans `/docs` et réindexer :
   ```powershell
   .\index-docs.ps1
   ```

3. **Utiliser l'add-in** dans Outlook pour générer des réponses IA !

---

**Bon développement ! 🚀**

Si vous avez des questions, consultez [INSTALLATION.md](./INSTALLATION.md) pour la résolution détaillée des problèmes.
