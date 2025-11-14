/**
 * Service de stockage vectoriel local (sans base de données externe)
 * Alternative simple à ChromaDB pour éviter Docker
 */
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config/config');
const { ChromaDBError } = require('../utils/errors');

class VectorStoreService {
  constructor() {
    this.storagePath = path.join(process.cwd(), 'vector_store.json');
    this.collectionName = config.chromadb.collectionName;
    this.vectors = [];
    this.initialized = false;
  }

  /**
   * Initialise le stockage vectoriel
   */
  async initializeCollection() {
    try {
      logger.info(`Initialisation du stockage vectoriel: ${this.storagePath}`);
      
      // Charger les données existantes si le fichier existe
      try {
        const data = await fs.readFile(this.storagePath, 'utf-8');
        this.vectors = JSON.parse(data);
        logger.info(`${this.vectors.length} vecteurs chargés depuis le fichier`);
      } catch (error) {
        // Fichier n'existe pas encore
        this.vectors = [];
        logger.info('Nouveau stockage vectoriel créé');
      }
      
      this.initialized = true;
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du stockage vectoriel', error);
      throw new ChromaDBError(`Erreur init: ${error.message}`);
    }
  }

  /**
   * Sauvegarde les vecteurs sur disque
   */
  async save() {
    try {
      await fs.writeFile(this.storagePath, JSON.stringify(this.vectors, null, 2));
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde', error);
    }
  }

  /**
   * Ajoute des points (vecteurs) à la collection
   * @param {Array} points - Tableau de {id, vector, payload}
   */
  async upsertPoints(points) {
    try {
      if (!this.initialized) {
        await this.initializeCollection();
      }

      for (const point of points) {
        // Supprimer l'ancien point avec le même ID s'il existe
        this.vectors = this.vectors.filter(v => v.id !== point.id);
        
        // Ajouter le nouveau point
        this.vectors.push({
          id: point.id,
          vector: point.vector,
          payload: point.payload,
        });
      }

      await this.save();
      logger.info(`${points.length} points ajoutés au stockage vectoriel`);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de points', error);
      throw new ChromaDBError(`Erreur upsert: ${error.message}`);
    }
  }

  /**
   * Calcule la similarité cosinus entre deux vecteurs
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Recherche les vecteurs les plus similaires
   * @param {number[]} queryVector - Vecteur de requête
   * @param {number} limit - Nombre de résultats
   * @returns {Promise<Array>} Résultats de recherche
   */
  async search(queryVector, limit = config.rag.topKResults) {
    try {
      if (!this.initialized) {
        await this.initializeCollection();
      }

      // Calculer la similarité pour chaque vecteur
      const results = this.vectors.map(item => ({
        id: item.id,
        score: this.cosineSimilarity(queryVector, item.vector),
        payload: item.payload,
      }));

      // Trier par score décroissant et limiter
      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, limit);

      logger.info(`Recherche vectorielle: ${topResults.length} résultats trouvés`);
      return topResults;
    } catch (error) {
      logger.error('Erreur lors de la recherche', error);
      throw new ChromaDBError(`Erreur search: ${error.message}`);
    }
  }

  /**
   * Compte le nombre de points dans la collection
   */
  async countPoints() {
    try {
      if (!this.initialized) {
        await this.initializeCollection();
      }
      return this.vectors.length;
    } catch (error) {
      logger.error('Erreur lors du comptage des points', error);
      return 0;
    }
  }

  /**
   * Supprime tous les points de la collection
   */
  async clearCollection() {
    try {
      this.vectors = [];
      await this.save();
      logger.info('Stockage vectoriel vidé');
    } catch (error) {
      logger.error('Erreur lors du nettoyage', error);
      throw new ChromaDBError(`Erreur clear: ${error.message}`);
    }
  }

  /**
   * Vérifie la santé du stockage
   */
  async healthCheck() {
    try {
      await this.initializeCollection();
      return true;
    } catch (error) {
      logger.error('Health check failed', error);
      return false;
    }
  }
}

// Instance singleton
const vectorStoreService = new VectorStoreService();
module.exports = vectorStoreService;
