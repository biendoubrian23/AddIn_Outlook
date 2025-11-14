# 🏗️ Architecture du projet - Assistant IA Outlook

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         OUTLOOK CLIENT                          │
│                    (Desktop ou Web)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Office.js API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    ADD-IN OUTLOOK                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  taskpane.html (Interface utilisateur)                  │   │
│  │  - Formulaire email                                     │   │
│  │  - Bouton "Générer réponse IA"                         │   │
│  │  - Zone de texte pour modification                     │   │
│  │  - Score de confiance                                   │   │
│  │  - Sources utilisées                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  taskpane.js (Logique frontend)                                │
│  - Récupération email (from, subject, body)                    │
│  - Appels API vers backend                                     │
│  - Gestion des états (loading, success, error)                 │
│  - Insertion de la réponse dans Outlook                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS (via ngrok en dev)
                         │ POST /api/email/generate-response
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    BACKEND API (Node.js/Express)                │
│                         Port 3000                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes (Express)                                        │  │
│  │  - POST /api/email/generate-response                    │  │
│  │  - POST /api/knowledge/add-document                     │  │
│  │  - GET  /api/health                                     │  │
│  │  - GET  /api/knowledge/stats                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controllers & Services                                  │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  RAG Service (rag.service.js)                      │ │  │
│  │  │  - Orchestration complète du pipeline RAG          │ │  │
│  │  │  - Recherche de contexte                           │ │  │
│  │  │  - Reranking des résultats                         │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Chunking Service (chunking.service.js)            │ │  │
│  │  │  - Découpage en chunks (1000 chars)                │ │  │
│  │  │  - Overlap de 300 chars                            │ │  │
│  │  │  - Nettoyage du texte                              │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────┬───────────────────────┘
                          │               │
                          │               │
            ┌─────────────▼──┐      ┌─────▼──────────────┐
            │                │      │                    │
┌───────────▼──────────────┐ │      │ ┌────────────────┐ │
│  EMBEDDING SERVICE       │ │      │ │  LLM SERVICE   │ │
│  (embedding.service.js)  │ │      │ │  (llm.service) │ │
│                          │ │      │ └────────┬───────┘ │
│  Xenova/Transformers     │ │      │          │         │
│  all-MiniLM-L6-v2        │ │      │          ▼         │
│  - Génère vecteurs 384D │ │      │  ┌────────────────┐ │
│  - Pour requête & docs   │ │      │  │  OLLAMA        │ │
└──────────┬───────────────┘ │      │  │  (Local LLM)   │ │
           │                 │      │  │                │ │
           │                 │      │  │  llama3.1:8b   │ │
           ▼                 │      │  │  Port: 11434   │ │
┌──────────────────────────┐ │      │  │                │ │
│  ChromaDB (Vector DB)      │ │      │  │  Params:       │ │
│  Port: 8000              │ │      │  │  - temp: 0.1   │ │
│                          │ │      │  │  - top_p: 0.3  │ │
│  Collection:             │ │      │  │  - top_k: 30   │ │
│  email_knowledge_base    │ │      │  │  - predict: 400│ │
│                          │ │      │  └────────────────┘ │
│  - Stockage vecteurs     │ │      │                     │
│  - Recherche similarité  │ │      │  Génère:            │
│  - Top-K: 6 résultats    │ │      │  - Réponses email   │
│  - Rerank: 3 meilleurs   │ │      │  - Détection intent │
└──────────────────────────┘ │      └─────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  DOCUMENTS     │
                    │  /docs/*.txt   │
                    │  /docs/*.pdf   │
                    │  /docs/*.docx  │
                    │  /docs/*.md    │
                    └────────────────┘
```

---

## 🔄 Flux de traitement d'une requête

### 1️⃣ Utilisateur dans Outlook

```
Utilisateur ouvre un email
    ↓
Clique "🤖 Réponse IA"
    ↓
Add-in s'ouvre dans panneau latéral
    ↓
Clique "✨ Générer une réponse"
```

### 2️⃣ Add-in Frontend (taskpane.js)

```javascript
// Étape 1: Extraction des données email
const emailData = {
  from: "client@example.com",
  subject: "Demande de devis",
  body: "Bonjour, je souhaite obtenir un devis..."
};

// Étape 2: Appel API
POST https://abc123.ngrok-free.app/api/email/generate-response
Body: emailData
```

### 3️⃣ Backend API (email.routes.js)

```javascript
// Réception requête
app.post('/api/email/generate-response', async (req, res) => {
  // Validation des données
  const { from, subject, body } = req.body;
  
  // Appel au service RAG
  const result = await ragService.generateEmailResponse({
    from, subject, body
  });
  
  // Retour réponse
  res.json(result);
});
```

### 4️⃣ Service RAG (rag.service.js)

```javascript
async generateEmailResponse(emailData) {
  // Étape 1: Construire la requête de recherche
  const query = `${subject}\n${body}`;
  
  // Étape 2: Détecter l'intention
  const intention = await llmService.detectIntention(subject, body);
  
  // Étape 3: Rechercher dans la base de connaissances
  const documents = await this.searchSimilarDocuments(query);
  // → Appelle embeddingService.generateEmbedding(query)
  // → Appelle ChromaDBService.search(vector, topK=6)
  
  // Étape 4: Reranker les résultats (top 3)
  const topDocs = this.rerankDocuments(documents, topN=3);
  
  // Étape 5: Générer la réponse avec LLM
  const response = await llmService.generateEmailResponse(
    emailData, 
    topDocs
  );
  
  return {
    response: "Bonjour, Merci pour votre demande...",
    confidence: 85,
    intention: "demande_devis",
    sources: [...],
    processingTime: 12.5
  };
}
```

### 5️⃣ Service Embedding (embedding.service.js)

```javascript
// Conversion texte → vecteur
async generateEmbedding(text) {
  // Utilise Xenova/transformers (all-MiniLM-L6-v2)
  const embedding = await this.pipe(text, {
    pooling: 'mean',
    normalize: true
  });
  
  return Array.from(embedding.data); // [0.123, -0.456, ...]
  // Dimension: 384
}
```

### 6️⃣ Service ChromaDB (ChromaDB.service.js)

```javascript
// Recherche par similarité cosinus
async search(queryVector, limit=6) {
  const results = await this.client.search(
    'email_knowledge_base',
    {
      vector: queryVector,
      limit: 6,
      with_payload: true
    }
  );
  
  return results; // Top 6 documents les plus similaires
}
```

### 7️⃣ Service LLM (llm.service.js)

```javascript
// Génération avec Ollama (Llama 3.2)
async generateEmailResponse(emailData, contextChunks) {
  const prompt = `
    EMAIL REÇU:
    De: ${from}
    Sujet: ${subject}
    Corps: ${body}
    
    CONTEXTE:
    ${contextChunks.map(c => c.text).join('\n\n')}
    
    TÂCHE: Génère une réponse professionnelle
  `;
  
  const response = await ollama.chat({
    model: 'llama3.1:8b',
    messages: [{ role: 'user', content: prompt }],
    options: {
      temperature: 0.1,
      top_p: 0.3,
      top_k: 30,
      num_predict: 400,
      repeat_penalty: 1.3
    }
  });
  
  return response.message.content;
}
```

### 8️⃣ Retour au Frontend

```javascript
// Add-in reçoit la réponse
{
  "success": true,
  "response": "Bonjour,\n\nMerci pour votre demande...",
  "confidence": 85,
  "intention": "demande_devis",
  "sources": [
    {
      "title": "guide_devis.pdf",
      "excerpt": "Pour obtenir un devis...",
      "score": 92
    }
  ],
  "processingTime": 12.5
}

// Affichage dans l'interface
document.getElementById('responseText').value = response;
document.getElementById('confidenceText').textContent = '85%';
// etc.
```

---

## 📊 Temps de traitement typique

| Étape | Temps | Composant |
|-------|-------|-----------|
| Extraction email | <100ms | Office.js |
| Appel API | ~50ms | HTTP/ngrok |
| Génération embedding | ~200ms | Xenova |
| Recherche ChromaDB | ~100ms | ChromaDB |
| Génération LLM | 8-15s | Ollama/Llama 3.2 |
| **TOTAL** | **10-20s** | - |

---

## 💾 Stockage des données

### ChromaDB (Vector Database)

```
Collection: email_knowledge_base

Point structure:
{
  id: "1699876543210abc",
  vector: [0.123, -0.456, ..., 0.789], // 384 dimensions
  payload: {
    text: "Pour obtenir un devis, veuillez...",
    metadata: {
      title: "guide_devis.pdf",
      source: "X:/docs/guide_devis.pdf",
      chunkIndex: 0,
      totalChunks: 15,
      addedAt: "2025-11-13T10:30:00Z"
    }
  }
}
```

### Configuration RAG

```env
CHUNK_SIZE=1000         # Taille des chunks
CHUNK_OVERLAP=300       # Chevauchement
TOP_K_RESULTS=6         # Résultats initiaux
RERANK_TOP_N=3          # Résultats finaux pour LLM
```

---

## 🔐 Sécurité

### Développement (ngrok)
- ✅ HTTPS automatique
- ✅ CORS configuré
- ✅ Rate limiting (100 req/min)
- ⚠️ URL publique temporaire

### Production (recommandations)
- 🔒 Serveur dédié avec HTTPS
- 🔒 Authentification JWT/OAuth
- 🔒 Validation stricte des entrées
- 🔒 Logs d'audit
- 🔒 Monitoring

---

## 📈 Optimisations possibles

### Performance
1. **Cache des embeddings** : Réutiliser pour requêtes similaires
2. **Modèle plus petit** : llama3.1:1b au lieu de 3b
3. **GPU pour Ollama** : Accélération matérielle
4. **Réduction NUM_PREDICT** : De 400 à 300 tokens

### Qualité
1. **Fine-tuning du modèle** : Sur vos données spécifiques
2. **Meilleurs embeddings** : all-mpnet-base-v2 (768D)
3. **Reranking avancé** : Modèle de reranking dédié
4. **Prompt engineering** : Améliorer les prompts système

---

## 🎯 Formats de données

### Email Input
```json
{
  "from": "client@example.com",
  "subject": "Demande de devis",
  "body": "Bonjour, je souhaiterais..."
}
```

### RAG Output
```json
{
  "success": true,
  "response": "Bonjour,\n\nMerci pour...",
  "confidence": 85,
  "intention": "demande_devis",
  "sources": [
    {
      "title": "guide_devis.pdf",
      "excerpt": "Pour obtenir un devis...",
      "score": 92
    }
  ],
  "processingTime": 12.5,
  "stats": {
    "documentsFound": 6,
    "documentsUsed": 3,
    "llmProcessingTime": 11.2
  }
}
```

---

**Pour plus de détails techniques, consultez le code source dans chaque service !**
