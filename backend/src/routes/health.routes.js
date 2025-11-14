/**
 * Routes pour la santé et le monitoring
 */
const express = require('express');
const router = express.Router();
const vectorStoreService = require('../services/vectorstore.service');
const llmService = require('../services/llm.service');
const logger = require('../utils/logger');

/**
 * GET /api/health
 * Vérifie la santé de tous les services
 */
router.get('/health', async (req, res) => {
  try {
    const checks = {
      api: true,
      vectorstore: await vectorStoreService.healthCheck(),
      ollama: await llmService.healthCheck(),
    };

    const allHealthy = Object.values(checks).every(v => v === true);

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      timestamp: new Date().toISOString(),
      services: checks,
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

/**
 * GET /api/info
 * Informations sur l'API
 */
router.get('/info', (req, res) => {
  const config = require('../config/config');
  
  res.json({
    success: true,
    name: 'Outlook AI Assistant API',
    version: '1.0.0',
    environment: config.server.env,
    models: {
      llm: config.ollama.model,
      embedding: config.embedding.model,
    },
    rag: {
      chunkSize: config.rag.chunkSize,
      chunkOverlap: config.rag.chunkOverlap,
      topK: config.rag.topKResults,
    },
  });
});

module.exports = router;
