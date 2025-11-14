/**
 * Middleware CORS personnalisé pour supporter ngrok
 */
const cors = require('cors');
const config = require('../config/config');

const corsOptions = {
  origin: (origin, callback) => {
    // Permettre les requêtes sans origin (comme Postman)
    if (!origin) return callback(null, true);

    // Log pour debug
    console.log('CORS - Origin reçue:', origin);
    console.log('CORS - Origines autorisées:', config.cors.allowedOrigins);

    // Vérification simple par correspondance exacte
    const isAllowed = config.cors.allowedOrigins.includes(origin);
    
    console.log('CORS - Autorisé:', isAllowed);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.error('CORS - Origin refusée:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
};

module.exports = cors(corsOptions);
