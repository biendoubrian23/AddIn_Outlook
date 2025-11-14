/**
 * Service RAG (Retrieval-Augmented Generation)
 * Combine la recherche vectorielle et la génération LLM
 */
const embeddingService = require('./embedding.service');
const vectorStoreService = require('./vectorstore.service');
const chunkingService = require('./chunking.service');
const llmService = require('./llm.service');
const logger = require('../utils/logger');
const config = require('../config/config');

class RAGService {
  constructor() {
    this.topK = config.rag.topKResults;
    this.rerankTopN = config.rag.rerankTopN;
  }

  /**
   * Initialise le service RAG
   */
  async initialize() {
    try {
      logger.info('Initialisation du service RAG...');
      await vectorStoreService.initializeCollection();
      await embeddingService.initialize();
      await llmService.healthCheck();
      logger.info('Service RAG initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du RAG', error);
      throw error;
    }
  }

  /**
   * Recherche les documents similaires dans la base de connaissances
   * @param {string} query - Requête de recherche
   * @param {number} topK - Nombre de résultats
   * @returns {Promise<Array>} Documents similaires
   */
  async searchSimilarDocuments(query, topK = this.topK) {
    try {
      logger.info(`Recherche RAG pour: "${query.substring(0, 50)}..."`);

      // Générer l'embedding de la requête
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Rechercher dans le stockage vectoriel
      const results = await vectorStoreService.search(queryEmbedding, topK);

      // Formater les résultats
      const documents = results.map(result => ({
        text: result.payload.text,
        score: result.score,
        metadata: result.payload.metadata,
        id: result.id,
      }));

      logger.info(`${documents.length} documents trouvés`);
      return documents;
    } catch (error) {
      logger.error('Erreur lors de la recherche RAG', error);
      throw error;
    }
  }

  /**
   * Rerank les résultats (simple tri par score pour cette version)
   * @param {Array} documents - Documents à reranker
   * @param {number} topN - Nombre de documents à garder
   * @returns {Array} Documents reranked
   */
  rerankDocuments(documents, topN = this.rerankTopN) {
    // Pour une version simple, on garde juste le tri par score
    return documents
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  /**
   * Génère une réponse complète à un email avec RAG
   * @param {object} emailData - {from, subject, body}
   * @returns {Promise<object>} Réponse structurée
   */
  async generateEmailResponse(emailData) {
    try {
      const startTime = Date.now();
      const { from, subject, body } = emailData;

      logger.info(`Traitement email de: ${from}, sujet: ${subject}`);

      // 1. Construire la requête de recherche
      const searchQuery = `${subject}\n${body}`;

      // 2. Détecter l'intention
      const intention = await llmService.detectIntention(subject, body);

      // 3. Rechercher dans la base de connaissances
      const documents = await this.searchSimilarDocuments(searchQuery);

      // 4. Reranker les résultats
      const topDocuments = this.rerankDocuments(documents);

      // 5. Préparer les chunks pour le LLM
      const contextChunks = topDocuments.map(doc => ({
        payload: { text: doc.text },
        score: doc.score,
      }));

      // 6. Générer la réponse avec le LLM
      const llmResult = await llmService.generateEmailResponse(
        emailData,
        contextChunks
      );

      // 7. Construire les sources
      const sources = topDocuments.map(doc => ({
        title: doc.metadata?.title || 'Document',
        excerpt: doc.text.substring(0, 200) + '...',
        score: Math.round(doc.score * 100),
      }));

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

      return {
        success: true,
        response: llmResult.response,
        confidence: llmResult.confidence,
        intention,
        sources,
        processingTime: parseFloat(totalTime),
        stats: {
          documentsFound: documents.length,
          documentsUsed: topDocuments.length,
          llmProcessingTime: llmResult.processingTime,
        },
      };
    } catch (error) {
      logger.error('Erreur lors de la génération de réponse email', error);
      throw error;
    }
  }

  /**
   * Ajoute un document à la base de connaissances
   * @param {string} content - Contenu du document
   * @param {object} metadata - Métadonnées
   */
  async addDocument(content, metadata = {}) {
    try {
      logger.info(`Ajout document: ${metadata.title || 'Sans titre'}`);

      // 1. Chunker le document
      const chunks = chunkingService.chunkDocument(content, metadata);

      // 2. Générer les embeddings
      const texts = chunks.map(c => c.text);
      const embeddings = await embeddingService.generateEmbeddings(texts);

      // 3. Préparer les points pour le stockage vectoriel
      const points = chunks.map((chunk, idx) => ({
        id: this.generateId(),
        vector: embeddings[idx],
        payload: {
          text: chunk.text,
          metadata: {
            ...chunk.metadata,
            ...metadata,
            addedAt: new Date().toISOString(),
          },
        },
      }));

      // 4. Ajouter au stockage vectoriel
      await vectorStoreService.upsertPoints(points);

      logger.info(`Document ajouté avec ${chunks.length} chunks`);

      return {
        success: true,
        chunksCreated: chunks.length,
      };
    } catch (error) {
      logger.error('Erreur lors de l\'ajout du document', error);
      throw error;
    }
  }

  /**
   * Génère un ID unique
   */
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Retourne les stats de la base de connaissances
   */
  async getStats() {
    try {
      const count = await vectorStoreService.countPoints();
      return {
        totalChunks: count,
        collectionName: vectorStoreService.collectionName,
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des stats', error);
      return { totalChunks: 0 };
    }
  }
}

// Instance singleton
const ragService = new RAGService();
module.exports = ragService;
