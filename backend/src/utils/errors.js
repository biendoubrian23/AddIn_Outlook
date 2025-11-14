/**
 * Classes d'erreurs personnalisées
 */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class OllamaError extends AppError {
  constructor(message) {
    super(message, 503);
    this.name = 'OllamaError';
  }
}

class ChromaDBError extends AppError {
  constructor(message) {
    super(message, 503);
    this.name = 'ChromaDBError';
  }
}

class EmbeddingError extends AppError {
  constructor(message) {
    super(message, 500);
    this.name = 'EmbeddingError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  OllamaError,
  ChromaDBError,
  EmbeddingError,
  NotFoundError,
};
