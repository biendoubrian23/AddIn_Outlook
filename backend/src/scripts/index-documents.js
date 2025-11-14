/**
 * Script d'indexation des documents de la base de connaissances
 * Lit tous les fichiers du dossier docs/ et les indexe dans ChromaDB
 */
const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const config = require('../config/config');
const logger = require('../utils/logger');
const ragService = require('../services/rag.service');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

class DocumentIndexer {
  constructor() {
    this.knowledgeBasePath = path.resolve(__dirname, '../../', config.paths.knowledgeBase);
    this.stats = {
      totalFiles: 0,
      successFiles: 0,
      failedFiles: 0,
      totalChunks: 0,
      startTime: null,
    };
  }

  /**
   * Point d'entrée principal
   */
  async run() {
    try {
      this.printBanner();
      this.stats.startTime = Date.now();

      // Initialiser le service RAG
      console.log(`${colors.blue}[1/4]${colors.reset} Initialisation du service RAG...`);
      await ragService.initialize();
      console.log(`${colors.green}✓${colors.reset} Service RAG initialisé\n`);

      // Lister les fichiers
      console.log(`${colors.blue}[2/4]${colors.reset} Recherche des fichiers dans: ${this.knowledgeBasePath}`);
      const files = await this.listFiles();
      this.stats.totalFiles = files.length;
      console.log(`${colors.green}✓${colors.reset} ${files.length} fichier(s) trouvé(s)\n`);

      if (files.length === 0) {
        console.log(`${colors.yellow}⚠${colors.reset} Aucun fichier à indexer`);
        return;
      }

      // Indexer les fichiers
      console.log(`${colors.blue}[3/4]${colors.reset} Indexation des documents...`);
      await this.indexFiles(files);

      // Afficher les résultats
      console.log(`\n${colors.blue}[4/4]${colors.reset} Résumé`);
      this.printStats();

    } catch (error) {
      console.error(`${colors.red}✗ Erreur fatale:${colors.reset}`, error.message);
      logger.error('Erreur lors de l\'indexation', error);
      process.exit(1);
    }
  }

  /**
   * Liste tous les fichiers supportés
   */
  async listFiles() {
    const files = [];
    const supportedExtensions = ['.txt', '.md', '.pdf', '.docx'];

    try {
      const items = await fs.readdir(this.knowledgeBasePath);

      for (const item of items) {
        const fullPath = path.join(this.knowledgeBasePath, item);
        const stat = await fs.stat(fullPath);

        if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            files.push({
              path: fullPath,
              name: item,
              ext,
              size: stat.size,
            });
          }
        }
      }

      return files;
    } catch (error) {
      throw new Error(`Impossible de lire le dossier: ${error.message}`);
    }
  }

  /**
   * Indexe tous les fichiers
   */
  async indexFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = `[${i + 1}/${files.length}]`;

      console.log(`\n${progress} Traitement: ${colors.yellow}${file.name}${colors.reset}`);
      console.log(`  Taille: ${this.formatBytes(file.size)}`);

      try {
        // Extraire le contenu
        const content = await this.extractContent(file);
        console.log(`  ✓ Contenu extrait (${content.length} caractères)`);

        // Ajouter au RAG
        const result = await ragService.addDocument(content, {
          title: file.name,
          source: file.path,
          type: file.ext,
        });

        this.stats.successFiles++;
        this.stats.totalChunks += result.chunksCreated;
        console.log(`  ${colors.green}✓ Indexé avec succès (${result.chunksCreated} chunks)${colors.reset}`);

      } catch (error) {
        this.stats.failedFiles++;
        console.log(`  ${colors.red}✗ Erreur: ${error.message}${colors.reset}`);
        logger.error(`Erreur lors de l'indexation de ${file.name}`, error);
      }
    }
  }

  /**
   * Extrait le contenu d'un fichier selon son type
   */
  async extractContent(file) {
    switch (file.ext) {
      case '.txt':
      case '.md':
        return await this.extractTextFile(file.path);

      case '.pdf':
        return await this.extractPDF(file.path);

      case '.docx':
        return await this.extractDOCX(file.path);

      default:
        throw new Error(`Type de fichier non supporté: ${file.ext}`);
    }
  }

  /**
   * Extrait le contenu d'un fichier texte
   */
  async extractTextFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  }

  /**
   * Extrait le contenu d'un PDF
   */
  async extractPDF(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * Extrait le contenu d'un DOCX
   */
  async extractDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Formate les bytes en taille lisible
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Affiche la bannière
   */
  printBanner() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.blue}🤖 OUTLOOK AI ASSISTANT - INDEXATION DES DOCUMENTS${colors.reset}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Affiche les statistiques finales
   */
  printStats() {
    const duration = ((Date.now() - this.stats.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log(`${colors.green}✓ INDEXATION TERMINÉE${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Fichiers traités:     ${this.stats.totalFiles}`);
    console.log(`${colors.green}Succès:               ${this.stats.successFiles}${colors.reset}`);
    if (this.stats.failedFiles > 0) {
      console.log(`${colors.red}Échecs:               ${this.stats.failedFiles}${colors.reset}`);
    }
    console.log(`Chunks créés:         ${this.stats.totalChunks}`);
    console.log(`Durée:                ${duration}s`);
    console.log('='.repeat(60) + '\n');
  }
}

// Exécution
if (require.main === module) {
  const indexer = new DocumentIndexer();
  indexer.run().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = DocumentIndexer;
