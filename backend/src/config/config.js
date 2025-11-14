/**
 * Configuration centralisée de l'application
 */
require('dotenv').config();

const config = {
  // Server
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // Ollama LLM
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    params: {
      temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.1,
      top_p: parseFloat(process.env.LLM_TOP_P) || 0.3,
      top_k: parseInt(process.env.LLM_TOP_K) || 30,
      num_predict: parseInt(process.env.LLM_NUM_PREDICT) || 400,
      repeat_penalty: parseFloat(process.env.LLM_REPEAT_PENALTY) || 1.3,
    },
  },

  // ChromaDB Vector DB (Mode Embedded - local)
  chromadb: {
    url: process.env.CHROMADB_URL || './chromadb_data',
    collectionName: process.env.CHROMADB_COLLECTION_NAME || 'email_knowledge_base',
  },

  // RAG Configuration
  rag: {
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 1000,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 300,
    topKResults: parseInt(process.env.TOP_K_RESULTS) || 6,
    rerankTopN: parseInt(process.env.RERANK_TOP_N) || 3,
  },

  // Embedding
  embedding: {
    model: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
    dimension: parseInt(process.env.EMBEDDING_DIMENSION) || 384,
  },

  // Paths
  paths: {
    knowledgeBase: process.env.KNOWLEDGE_BASE_PATH || '../docs',
    logs: process.env.LOG_FILE || './logs/app.log',
  },

  // CORS
  cors: {
    allowedOrigins: [
      'https://localhost:3000',
      'https://localhost:8080', 
      'https://tsunamic-postpositively-noel.ngrok-free.dev',
      'https://outlook.office.com',
      'https://outlook.live.com'
    ],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
