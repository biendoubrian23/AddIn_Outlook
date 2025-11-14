/**
 * Middleware de gestion globale des erreurs
 */
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  // Log l'erreur
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // Erreur opérationnelle (prévue)
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        type: err.name,
      },
    });
  }

  // Erreur de validation Joi
  if (err.name === 'ValidationError' && err.details) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: err.details.map(d => d.message),
      },
    });
  }

  // Erreur inattendue
  return res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Une erreur interne est survenue',
      type: 'InternalServerError',
    },
  });
};

module.exports = errorHandler;
