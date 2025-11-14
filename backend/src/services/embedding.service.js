/**
 * Service de génération d'embeddings avec Xenova/transformers
 */
const logger = require('../utils/logger');
const config = require('../config/config');
const { EmbeddingError } = require('../utils/errors');

class EmbeddingService {
  constructor() {
    this.pipe = null;
    this.modelName = config.embedding.model;
    this.dimension = config.embedding.dimension;
    this.transformers = null;
  }

  /**
   * Initialise le modèle d'embedding
   */
  async initialize() {
    try {
      if (!this.pipe) {
        logger.info(`Chargement du modèle d'embedding: ${this.modelName}...`);
        
        // Import dynamique de @xenova/transformers (module ES)
        if (!this.transformers) {
          this.transformers = await import('@xenova/transformers');
        }
        
        this.pipe = await this.transformers.pipeline('feature-extraction', this.modelName);
        logger.info('Modèle d\'embedding chargé avec succès');
      }
    } catch (error) {
      logger.error('Erreur lors du chargement du modèle d\'embedding', error);
      throw new EmbeddingError('Impossible de charger le modèle d\'embedding');
    }
  }

  /**
   * Génère un embedding pour un texte
   * @param {string} text - Texte à vectoriser
   * @returns {Promise<number[]>} Vecteur d'embedding
   */
  async generateEmbedding(text) {
    try {
      await this.initialize();

      if (!text || text.trim().length === 0) {
        throw new EmbeddingError('Le texte ne peut pas être vide');
      }

      // Nettoyer le texte
      const cleanText = text.trim().replace(/\s+/g, ' ');

      // Générer l'embedding
      const output = await this.pipe(cleanText, {
        pooling: 'mean',
        normalize: true,
      });

      // Convertir en array
      const embedding = Array.from(output.data);

      logger.debug(`Embedding généré (dimension: ${embedding.length})`);
      return embedding;
    } catch (error) {
      logger.error('Erreur lors de la génération de l\'embedding', error);
      throw new EmbeddingError(`Erreur embedding: ${error.message}`);
    }
  }

  /**
   * Génère des embeddings pour plusieurs textes
   * @param {string[]} texts - Tableau de textes
   * @returns {Promise<number[][]>} Tableau d'embeddings
   */
  async generateEmbeddings(texts) {
    try {
      const embeddings = await Promise.all(
        texts.map(text => this.generateEmbedding(text))
      );
      return embeddings;
    } catch (error) {
      logger.error('Erreur lors de la génération des embeddings multiples', error);
      throw new EmbeddingError(`Erreur embeddings multiples: ${error.message}`);
    }
  }
}

// Instance singleton
const embeddingService = new EmbeddingService();
module.exports = embeddingService;
