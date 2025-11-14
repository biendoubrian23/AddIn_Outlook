/**
 * Serveur Express principal
 */
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const logger = require('./utils/logger');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const ragService = require('./services/rag.service');

// Routes
const emailRoutes = require('./routes/email.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');
const healthRoutes = require('./routes/health.routes');

// Créer l'application Express
const app = express();

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour permettre le chargement dans Outlook
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(corsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requêtes max
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger les requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/email', emailRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api', healthRoutes);

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Outlook AI Assistant API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      info: '/api/info',
      generateResponse: 'POST /api/email/generate-response',
      addDocument: 'POST /api/knowledge/add-document',
      stats: 'GET /api/knowledge/stats',
    },
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
  });
});

// Gestionnaire d'erreurs global
app.use(errorHandler);

// Initialisation et démarrage du serveur
async function startServer() {
  try {
    logger.info('🚀 Démarrage du serveur Outlook AI Assistant...');

    // Initialiser le service RAG
    await ragService.initialize();

    // Démarrer le serveur
    const PORT = config.server.port;
    app.listen(PORT, () => {
      logger.info('=================================================');
      logger.info(`✅ Serveur démarré sur le port ${PORT}`);
      logger.info(`📍 URL: http://localhost:${PORT}`);
      logger.info(`🤖 Modèle LLM: ${config.ollama.model}`);
      logger.info(`🧠 Modèle Embedding: ${config.embedding.model}`);
      logger.info(`📊 Collection ChromaDB: ${config.chromadb.collectionName}`);
      logger.info('=================================================');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM reçu, fermeture du serveur...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT reçu, fermeture du serveur...');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur', error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();

module.exports = app;
