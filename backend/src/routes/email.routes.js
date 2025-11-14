/**
 * Routes pour la gestion des emails et génération de réponses
 */
const express = require('express');
const router = express.Router();
const ragService = require('../services/rag.service');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * POST /api/email/generate-response
 * Génère une réponse IA pour un email
 */
router.post('/generate-response', async (req, res, next) => {
  try {
    const { from, subject, body } = req.body;

    // Validation
    if (!from || !subject || !body) {
      throw new ValidationError('Les champs from, subject et body sont requis');
    }

    if (body.length < 10) {
      throw new ValidationError('Le corps de l\'email est trop court');
    }

    logger.info(`Requête de génération de réponse pour email de: ${from}`);

    // Générer la réponse avec RAG
    const result = await ragService.generateEmailResponse({
      from,
      subject,
      body,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/email/detect-intention
 * Détecte l'intention d'un email
 */
router.post('/detect-intention', async (req, res, next) => {
  try {
    const { subject, body } = req.body;

    if (!subject || !body) {
      throw new ValidationError('Les champs subject et body sont requis');
    }

    const llmService = require('../services/llm.service');
    const intention = await llmService.detectIntention(subject, body);

    res.json({
      success: true,
      intention,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
