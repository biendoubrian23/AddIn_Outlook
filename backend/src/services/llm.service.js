/**
 * Service LLM avec Ollama (Llama 3.2)
 */
const { Ollama } = require('ollama');
const logger = require('../utils/logger');
const config = require('../config/config');
const { OllamaError } = require('../utils/errors');

class LLMService {
  constructor() {
    this.client = new Ollama({ host: config.ollama.url });
    this.model = config.ollama.model;
    this.params = config.ollama.params;
  }

  /**
   * Vérifie si Ollama est disponible et si le modèle est chargé
   */
  async healthCheck() {
    try {
      const models = await this.client.list();
      const hasModel = models.models.some(m => m.name.includes(this.model));
      
      if (!hasModel) {
        logger.warn(`Modèle ${this.model} non trouvé. Tentative de téléchargement...`);
        await this.pullModel();
      }
      
      return true;
    } catch (error) {
      logger.error('Ollama health check failed', error);
      return false;
    }
  }

  /**
   * Télécharge le modèle si nécessaire
   */
  async pullModel() {
    try {
      logger.info(`Téléchargement du modèle ${this.model}...`);
      await this.client.pull({ model: this.model });
      logger.info('Modèle téléchargé avec succès');
    } catch (error) {
      throw new OllamaError(`Erreur téléchargement modèle: ${error.message}`);
    }
  }

  /**
   * Génère une réponse avec le LLM
   * @param {string} prompt - Prompt pour le LLM
   * @param {string} systemPrompt - Instruction système
   * @returns {Promise<string>} Réponse générée
   */
  async generateResponse(prompt, systemPrompt = null) {
    try {
      const startTime = Date.now();

      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: prompt,
      });

      logger.info('Génération de réponse avec Ollama...');

      const response = await this.client.chat({
        model: this.model,
        messages,
        options: {
          temperature: this.params.temperature,
          top_p: this.params.top_p,
          top_k: this.params.top_k,
          num_predict: this.params.num_predict,
          repeat_penalty: this.params.repeat_penalty,
        },
        stream: false,
      });

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`Réponse générée en ${processingTime}s`);

      return {
        response: response.message.content,
        processingTime: parseFloat(processingTime),
        model: this.model,
      };
    } catch (error) {
      logger.error('Erreur lors de la génération avec Ollama', error);
      throw new OllamaError(`Erreur génération: ${error.message}`);
    }
  }

  /**
   * Génère une réponse email avec contexte RAG
   * @param {object} emailData - Données de l'email
   * @param {Array} contextChunks - Chunks de contexte du RAG
   * @returns {Promise<object>} Réponse structurée
   */
  async generateEmailResponse(emailData, contextChunks) {
    try {
      const { from, subject, body } = emailData;

      // Construire le contexte à partir des chunks
      const context = contextChunks
        .map((chunk, idx) => `[${idx + 1}] ${chunk.payload.text}`)
        .join('\n\n');

      // System prompt
      const systemPrompt = `Tu es un assistant IA professionnel qui aide à rédiger des réponses aux emails.
Tu dois générer des réponses claires, professionnelles et pertinentes basées sur le contexte fourni.

RÈGLES IMPORTANTES:
- Utilise un ton professionnel et courtois
- Base ta réponse uniquement sur le contexte fourni
- Si le contexte ne contient pas d'information pertinente, indique-le poliment
- Sois concis mais complet
- Utilise le français correct
- Ne mentionne jamais que tu utilises un contexte ou une base de connaissances`;

      // User prompt avec contexte
      const userPrompt = `EMAIL REÇU:
De: ${from}
Sujet: ${subject}
Corps: ${body}

CONTEXTE DE LA BASE DE CONNAISSANCES:
${context}

TÂCHE:
Génère une réponse professionnelle à cet email en utilisant les informations du contexte fourni.
La réponse doit être directement utilisable et commencer par une formule de politesse appropriée.`;

      // Générer la réponse
      const result = await this.generateResponse(userPrompt, systemPrompt);

      // Calculer un score de confiance basé sur la similarité des chunks
      const avgScore = contextChunks.length > 0
        ? contextChunks.reduce((sum, c) => sum + c.score, 0) / contextChunks.length
        : 0;
      
      const confidence = Math.round(avgScore * 100);

      return {
        response: result.response,
        confidence,
        processingTime: result.processingTime,
        model: result.model,
        contextsUsed: contextChunks.length,
      };
    } catch (error) {
      logger.error('Erreur lors de la génération de réponse email', error);
      throw error;
    }
  }

  /**
   * Détecte l'intention d'un email
   * @param {string} subject - Sujet de l'email
   * @param {string} body - Corps de l'email
   * @returns {Promise<string>} Intention détectée
   */
  async detectIntention(subject, body) {
    try {
      const prompt = `Analyse cet email et identifie son intention principale en UN SEUL MOT parmi:
- question
- reclamation
- demande_info
- demande_devis
- commande
- remerciement
- autre

Email:
Sujet: ${subject}
Corps: ${body}

Réponds uniquement par le mot de l'intention, sans explication.`;

      const result = await this.generateResponse(prompt);
      const intention = result.response.trim().toLowerCase();

      logger.info(`Intention détectée: ${intention}`);
      return intention;
    } catch (error) {
      logger.warn('Erreur détection intention, utilisation de "autre"', error);
      return 'autre';
    }
  }
}

// Instance singleton
const llmService = new LLMService();
module.exports = llmService;
