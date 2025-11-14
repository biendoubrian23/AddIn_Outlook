/**
 * Script pour vider la base de connaissances
 */
const vectorStoreService = require('../services/vectorstore.service');
const logger = require('../utils/logger');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

async function clearIndex() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.yellow}⚠  SUPPRESSION DE LA BASE DE CONNAISSANCES${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    // Compter les points avant suppression
    const count = await vectorStoreService.countPoints();
    console.log(`Points actuels dans la collection: ${count}\n`);

    if (count === 0) {
      console.log(`${colors.yellow}⚠${colors.reset} La collection est déjà vide\n`);
      return;
    }

    // Confirmer
    console.log(`${colors.red}Cette action va supprimer ${count} chunks de la base de connaissances.${colors.reset}`);
    console.log('Appuyez sur Ctrl+C pour annuler ou attendez 5 secondes...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Supprimer
    console.log('Suppression en cours...');
    await vectorStoreService.clearCollection();

    console.log(`\n${colors.green}✓ Base de connaissances vidée avec succès${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}✗ Erreur:${colors.reset}`, error.message);
    logger.error('Erreur lors de la suppression', error);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  clearIndex().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = clearIndex;
