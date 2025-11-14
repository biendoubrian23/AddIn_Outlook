/**
 * Service de chunking de texte pour RAG
 */
const logger = require('../utils/logger');
const config = require('../config/config');

class ChunkingService {
  constructor() {
    this.chunkSize = config.rag.chunkSize;
    this.overlap = config.rag.chunkOverlap;
  }

  /**
   * Découpe un texte en chunks avec overlap
   * @param {string} text - Texte à découper
   * @param {object} metadata - Métadonnées du document
   * @returns {Array} Tableau de chunks avec métadonnées
   */
  chunkText(text, metadata = {}) {
    try {
      // Nettoyer le texte
      const cleanText = this.cleanText(text);

      // Diviser en phrases approximatives
      const sentences = this.splitIntoSentences(cleanText);

      const chunks = [];
      let currentChunk = '';
      let currentLength = 0;

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const sentenceLength = sentence.length;

        // Si la phrase seule dépasse la taille max, la découper
        if (sentenceLength > this.chunkSize) {
          if (currentChunk) {
            chunks.push(this.createChunk(currentChunk, chunks.length, metadata));
            currentChunk = '';
            currentLength = 0;
          }
          
          // Découper la longue phrase
          const subChunks = this.splitLongSentence(sentence);
          subChunks.forEach(sub => {
            chunks.push(this.createChunk(sub, chunks.length, metadata));
          });
          continue;
        }

        // Vérifier si ajouter cette phrase dépasse la limite
        if (currentLength + sentenceLength > this.chunkSize && currentChunk) {
          // Sauvegarder le chunk actuel
          chunks.push(this.createChunk(currentChunk, chunks.length, metadata));

          // Commencer un nouveau chunk avec overlap
          currentChunk = this.getOverlapText(currentChunk) + sentence;
          currentLength = currentChunk.length;
        } else {
          // Ajouter la phrase au chunk actuel
          currentChunk += (currentChunk ? ' ' : '') + sentence;
          currentLength = currentChunk.length;
        }
      }

      // Ajouter le dernier chunk
      if (currentChunk.trim()) {
        chunks.push(this.createChunk(currentChunk, chunks.length, metadata));
      }

      logger.info(`Texte découpé en ${chunks.length} chunks`);
      return chunks;
    } catch (error) {
      logger.error('Erreur lors du chunking', error);
      throw error;
    }
  }

  /**
   * Nettoie le texte
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Divise le texte en phrases
   */
  splitIntoSentences(text) {
    // Découpe sur les points, points d'exclamation, points d'interrogation
    // tout en préservant les abréviations courantes
    const sentences = text
      .replace(/([.!?])\s+(?=[A-ZÀ-Ü])/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return sentences;
  }

  /**
   * Découpe une phrase trop longue
   */
  splitLongSentence(sentence) {
    const words = sentence.split(' ');
    const chunks = [];
    let currentChunk = '';

    for (const word of words) {
      if ((currentChunk + ' ' + word).length > this.chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = word;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + word;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Récupère le texte d'overlap pour le chunk suivant
   */
  getOverlapText(text) {
    if (text.length <= this.overlap) {
      return text + ' ';
    }

    // Prendre les derniers caractères
    const overlapText = text.slice(-this.overlap);

    // Chercher le début du dernier mot complet
    const lastSpaceIndex = overlapText.indexOf(' ');
    if (lastSpaceIndex > 0) {
      return overlapText.slice(lastSpaceIndex + 1) + ' ';
    }

    return overlapText + ' ';
  }

  /**
   * Crée un objet chunk avec métadonnées
   */
  createChunk(text, index, metadata) {
    return {
      text: text.trim(),
      index,
      metadata: {
        ...metadata,
        chunkIndex: index,
        chunkSize: text.length,
      },
    };
  }

  /**
   * Découpe un document en chunks (alias pour compatibilité)
   */
  chunkDocument(content, metadata = {}) {
    return this.chunkText(content, metadata);
  }
}

// Instance singleton
const chunkingService = new ChunkingService();
module.exports = chunkingService;
