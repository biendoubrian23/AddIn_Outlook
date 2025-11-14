/**
 * Routes pour la gestion de la base de connaissances
 */
const express = require('express');
const router = express.Router();
const ragService = require('../services/rag.service');
const vectorStoreService = require('../services/vectorstore.service');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * POST /api/knowledge/add-document
 * Ajoute un document à la base de connaissances
 */
router.post('/add-document', async (req, res, next) => {
  try {
    const { content, title, source } = req.body;

    if (!content) {
      throw new ValidationError('Le champ content est requis');
    }

    if (content.length < 50) {
      throw new ValidationError('Le contenu est trop court (minimum 50 caractères)');
    }

    const metadata = {
      title: title || 'Document sans titre',
      source: source || 'manual',
    };

    const result = await ragService.addDocument(content, metadata);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/knowledge/stats
 * Retourne les statistiques de la base de connaissances
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await ragService.getStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/knowledge/search
 * Recherche dans la base de connaissances
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query, topK } = req.body;

    if (!query) {
      throw new ValidationError('Le champ query est requis');
    }

    const results = await ragService.searchSimilarDocuments(
      query,
      topK || 6
    );

    res.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/knowledge/clear
 * Vide la base de connaissances
 */
router.delete('/clear', async (req, res, next) => {
  try {
    await vectorStoreService.clearCollection();
    res.json({
      success: true,
      message: 'Base de connaissances vidée',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
