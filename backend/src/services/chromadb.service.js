/**
 * Service de gestion de ChromaDB (Vector Database)
 * Mode: Embedded (local, sans Docker)
 */
const { ChromaClient } = require('chromadb');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config/config');
const { ChromaDBError } = require('../utils/errors');

class ChromaDBService {
  constructor() {
    // Mode embedded: stockage local dans ./chromadb_data
    const dbPath = path.join(process.cwd(), 'chromadb_data');
    this.client = new ChromaClient({ path: dbPath });
    this.collectionName = config.chromadb.collectionName;
    this.collection = null;
    logger.info(`ChromaDB en mode embedded: ${dbPath}`);
  }

  /**
   * Initialise la collection ChromaDB
   */
  async initializeCollection() {
    try {
      // Récupérer ou créer la collection
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
        });
        logger.info(`Collection ${this.collectionName} récupérée`);
      } catch (error) {
        // Si la collection n'existe pas, la créer
        logger.info(`Création de la collection: ${this.collectionName}`);
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: { 
            description: 'Email knowledge base for AI assistant',
            'hnsw:space': 'cosine',
          },
        });
        logger.info('Collection créée avec succès');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de ChromaDB', error);
      throw new ChromaDBError(`Erreur ChromaDB init: ${error.message}`);
    }
  }

  /**
   * Ajoute des points (vecteurs) à la collection
   * @param {Array} points - Tableau de {id, vector, payload}
   */
  async upsertPoints(points) {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }

      const ids = points.map(p => String(p.id));
      const embeddings = points.map(p => p.vector);
      const metadatas = points.map(p => p.payload);
      const documents = points.map(p => p.payload.text || '');

      await this.collection.add({
        ids,
        embeddings,
        metadatas,
        documents,
      });

      logger.info(`${points.length} points ajoutés à ChromaDB`);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de points à ChromaDB', error);
      throw new ChromaDBError(`Erreur upsert: ${error.message}`);
    }
  }

  /**
   * Recherche les vecteurs les plus similaires
   * @param {number[]} queryVector - Vecteur de requête
   * @param {number} limit - Nombre de résultats
   * @returns {Promise<Array>} Résultats de recherche
   */
  async search(queryVector, limit = config.rag.topKResults) {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }

      const results = await this.collection.query({
        queryEmbeddings: [queryVector],
        nResults: limit,
      });

      // Formater les résultats pour correspondre au format attendu
      const formattedResults = [];
      
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          formattedResults.push({
            id: results.ids[0][i],
            score: 1 - (results.distances[0][i] || 0), // Convertir distance en score
            payload: results.metadatas[0][i] || {},
          });
        }
      }

      logger.info(`Recherche ChromaDB: ${formattedResults.length} résultats trouvés`);
      return formattedResults;
    } catch (error) {
      logger.error('Erreur lors de la recherche dans ChromaDB', error);
      throw new ChromaDBError(`Erreur search: ${error.message}`);
    }
  }

  /**
   * Compte le nombre de points dans la collection
   */
  async countPoints() {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }

      const count = await this.collection.count();
      return count;
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
      // Supprimer la collection
      await this.client.deleteCollection({ name: this.collectionName });
      // Recréer la collection
      await this.initializeCollection();
      logger.info('Collection vidée et réinitialisée');
    } catch (error) {
      logger.error('Erreur lors du nettoyage de la collection', error);
      throw new ChromaDBError(`Erreur clear: ${error.message}`);
    }
  }

  /**
   * Vérifie la santé de ChromaDB
   */
  async healthCheck() {
    try {
      await this.client.heartbeat();
      return true;
    } catch (error) {
      logger.error('ChromaDB health check failed', error);
      return false;
    }
  }
}

// Instance singleton
const chromadbService = new ChromaDBService();
module.exports = chromadbService;
