/**
 * Application principale de l'Add-in Outlook
 */

/* global Office */

// Configuration
const CONFIG = {
  // URL du backend via ngrok (nécessaire pour Outlook Web qui tourne sur les serveurs Microsoft)
  API_URL: 'https://tsunamic-postpositively-noel.ngrok-free.dev/api'
};

/**
 * Classe principale de l'assistant IA
 */
class AIEmailAssistant {
  constructor() {
    this.currentEmail = null;
    this.generatedResponse = null;
    this.isProcessing = false;
  }

  /**
   * Initialisation de l'application
   */
  init() {
    Office.onReady((info) => {
      if (info.host === Office.HostType.Outlook) {
        console.log('Add-in Outlook chargé');
        this.setupEventListeners();
        this.loadEmailInfo();
      }
    });
  }

  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    // Bouton principal de génération
    document.getElementById('generateBtn').addEventListener('click', () => {
      this.generateResponse();
    });

    // Bouton régénérer
    document.getElementById('regenerateBtn').addEventListener('click', () => {
      this.generateResponse();
    });

    // Bouton copier
    document.getElementById('copyBtn').addEventListener('click', () => {
      this.copyToClipboard();
    });

    // Bouton insérer
    document.getElementById('insertBtn').addEventListener('click', () => {
      this.insertResponse();
    });

    // Bouton réessayer (erreur)
    document.getElementById('retryBtn').addEventListener('click', () => {
      this.hideError();
      this.generateResponse();
    });

    // Compteur de caractères
    document.getElementById('responseText').addEventListener('input', (e) => {
      const charCount = e.target.value.length;
      document.getElementById('charCount').textContent = charCount;
    });
  }

  /**
   * Charge les informations de l'email courant
   */
  async loadEmailInfo() {
    try {
      const item = Office.context.mailbox.item;

      if (!item) {
        console.log('Aucun email sélectionné');
        return;
      }

      // Récupérer l'expéditeur
      const from = await this.getEmailFrom(item);
      
      // Récupérer le sujet
      const subject = item.subject || '(Pas de sujet)';

      // Afficher les infos
      document.getElementById('emailFrom').textContent = from;
      document.getElementById('emailSubject').textContent = subject;
      document.getElementById('emailInfo').classList.remove('hidden');

    } catch (error) {
      console.error('Erreur lors du chargement des infos email', error);
    }
  }

  /**
   * Récupère l'expéditeur de l'email
   */
  getEmailFrom(item) {
    return new Promise((resolve) => {
      if (item.from) {
        // item.from est déjà un objet EmailAddressDetails, pas besoin de getAsync
        resolve(item.from.emailAddress || item.from.displayName || 'Inconnu');
      } else {
        resolve('Inconnu');
      }
    });
  }

  /**
   * Récupère le corps de l'email
   */
  getEmailBody(item) {
    return new Promise((resolve) => {
      item.body.getAsync(Office.CoercionType.Text, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(result.value);
        } else {
          resolve('');
        }
      });
    });
  }

  /**
   * Génère une réponse avec l'IA
   */
  async generateResponse() {
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;
      const item = Office.context.mailbox.item;

      if (!item) {
        throw new Error('Aucun email sélectionné');
      }

      // Masquer les autres sections
      this.hideResult();
      this.hideError();

      // Afficher le loading
      this.showLoading();

      // Étape 1: Lecture email
      this.updateLoadingStep(1);
      const from = await this.getEmailFrom(item);
      const subject = item.subject || '';
      const body = await this.getEmailBody(item);

      this.currentEmail = { from, subject, body };

      if (!body || body.trim().length < 10) {
        throw new Error('Le corps de l\'email est vide ou trop court');
      }

      // Étape 2: Recherche contexte
      this.updateLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Étape 3: Génération
      this.updateLoadingStep(3);

      // Appel API
      const response = await this.callAPI('/email/generate-response', {
        from,
        subject,
        body,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur inconnue');
      }

      // Sauvegarder la réponse
      this.generatedResponse = response;

      // Afficher le résultat
      this.hideLoading();
      this.showResult(response);

    } catch (error) {
      console.error('Erreur génération', error);
      this.hideLoading();
      this.showError(error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Appelle l'API backend
   */
  async callAPI(endpoint, data) {
    const url = `${CONFIG.API_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Erreur HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Affiche l'état de chargement
   */
  showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('generateBtn').disabled = true;
  }

  /**
   * Masque l'état de chargement
   */
  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('generateBtn').disabled = false;
    
    // Réinitialiser les étapes
    for (let i = 1; i <= 3; i++) {
      document.getElementById(`step${i}`).classList.remove('active');
    }
  }

  /**
   * Met à jour l'étape de chargement
   */
  updateLoadingStep(stepNumber) {
    // Retirer l'active de toutes les étapes
    for (let i = 1; i <= 3; i++) {
      document.getElementById(`step${i}`).classList.remove('active');
    }
    
    // Activer l'étape courante
    document.getElementById(`step${stepNumber}`).classList.add('active');

    // Mettre à jour le texte
    const texts = [
      'Lecture de l\'email...',
      'Recherche dans la base de connaissances...',
      'Génération de la réponse...'
    ];
    document.getElementById('loadingText').textContent = texts[stepNumber - 1];
  }

  /**
   * Affiche le résultat
   */
  showResult(data) {
    // Intention
    const intentionBadge = document.getElementById('intentionBadge');
    intentionBadge.textContent = data.intention || 'autre';

    // Confiance
    const confidence = data.confidence || 0;
    document.getElementById('confidenceText').textContent = `${confidence}%`;
    document.getElementById('confidenceFill').style.width = `${confidence}%`;

    // Réponse
    const responseText = document.getElementById('responseText');
    responseText.value = data.response || '';
    document.getElementById('charCount').textContent = responseText.value.length;

    // Sources
    const sources = data.sources || [];
    document.getElementById('sourceCount').textContent = sources.length;
    
    const sourcesList = document.getElementById('sourcesList');
    sourcesList.innerHTML = '';
    
    sources.forEach(source => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${source.title}</strong> (${source.score}%)
        <br>
        <small>${source.excerpt}</small>
      `;
      sourcesList.appendChild(li);
    });

    // Stats
    document.getElementById('processingTime').textContent = 
      (data.processingTime || 0).toFixed(2);

    // Afficher la section
    document.getElementById('result').classList.remove('hidden');
  }

  /**
   * Masque le résultat
   */
  hideResult() {
    document.getElementById('result').classList.add('hidden');
  }

  /**
   * Affiche une erreur
   */
  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('error').classList.remove('hidden');
  }

  /**
   * Masque l'erreur
   */
  hideError() {
    document.getElementById('error').classList.add('hidden');
  }

  /**
   * Copie la réponse dans le presse-papiers
   */
  async copyToClipboard() {
    try {
      const text = document.getElementById('responseText').value;
      
      if (!text) {
        alert('Aucune réponse à copier');
        return;
      }

      await navigator.clipboard.writeText(text);
      
      // Feedback visuel
      const btn = document.getElementById('copyBtn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '✓ Copié !';
      btn.style.background = 'var(--success)';
      btn.style.color = 'white';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);

    } catch (error) {
      console.error('Erreur copie', error);
      alert('Impossible de copier dans le presse-papiers');
    }
  }

  /**
   * Insère la réponse dans l'email
   */
  insertResponse() {
    try {
      const text = document.getElementById('responseText').value;
      
      if (!text) {
        alert('Aucune réponse à insérer');
        return;
      }

      const item = Office.context.mailbox.item;

      // Créer une réponse
      item.displayReplyForm({
        htmlBody: text.replace(/\n/g, '<br>')
      });

      // Feedback
      const btn = document.getElementById('insertBtn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '✓ Inséré !';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);

    } catch (error) {
      console.error('Erreur insertion', error);
      alert('Impossible d\'insérer la réponse: ' + error.message);
    }
  }
}

// Initialisation
const assistant = new AIEmailAssistant();
assistant.init();
