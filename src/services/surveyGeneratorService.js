/**
 * Service d'intégration avec l'API Backend Survey Generator
 * Gère la communication WebSocket et REST avec le backend FastAPI
 */

class SurveyGeneratorService {
  constructor() {
    this.apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    this.wsUrl = this.apiUrl.replace('http', 'ws');
    this.ws = null;
    this.listeners = {};
    this.requestId = 0;
  }

  /**
   * Établit la connexion WebSocket
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.wsUrl}/ws`);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connecté au backend');
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Erreur parsing message WebSocket:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Erreur WebSocket:', error);
          this.emit('error', {
            type: 'websocket_error',
            message: 'Erreur de connexion WebSocket',
          });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket déconnecté');
          this.emit('disconnected');
        };
      } catch (error) {
        console.error('Erreur création WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Déconnecte le WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Envoie un message de génération au backend
   * @param {string} prompt - Description du questionnaire à générer
   * @param {string} language - Langue ('fr', 'en', etc.)
   */
  generateSurvey(prompt, language = 'fr') {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket non connecté'));
        return;
      }

      const message = {
        type: 'generate',
        prompt: prompt,
        language: language,
        timestamp: new Date().toISOString(),
      };

      try {
        this.ws.send(JSON.stringify(message));
        console.log('📤 Message généré envoyé:', message);

        // Attendre la réponse complète
        const handleResult = (data) => {
          if (data.type === 'result') {
            this.off('message', handleResult);
            resolve(data.data);
          }
        };

        this.on('message', handleResult);

        // Timeout après 60s
        setTimeout(() => {
          this.off('message', handleResult);
          reject(new Error('Timeout: génération trop longue'));
        }, 60000);
      } catch (error) {
        console.error('Erreur envoi message:', error);
        reject(error);
      }
    });
  }

  /**
   * Gère les messages reçus du backend
   */
  handleMessage(message) {
    const { type, status, message: msg, percentage, data, error } = message;

    console.log(`📥 Message reçu [${status}]:`, message);

    // Émettre différents événements selon le type
    if (type === 'progress') {
      this.emit('progress', {
        status,
        message: msg,
        percentage,
        data,
      });
    } else if (type === 'error') {
      this.emit('error', {
        type: error || 'unknown_error',
        message: msg,
      });
    } else if (type === 'result') {
      this.emit('result', data);
    }

    // Émettre le message générique
    this.emit('message', message);
  }

  /**
   * S'abonne à un événement
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Se désabonne d'un événement
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * Émet un événement
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur listener ${event}:`, error);
        }
      });
    }
  }

  /**
   * Récupère les localités disponibles
   */
  async getLocations() {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/locations`);
      if (!response.ok) throw new Error('Erreur récupération localités');
      return await response.json();
    } catch (error) {
      console.error('Erreur getLocations:', error);
      throw error;
    }
  }

  /**
   * Récupère les localités par région
   */
  async getLocationsByRegion(region) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/v1/locations/${encodeURIComponent(region)}`
      );
      if (!response.ok) throw new Error('Erreur récupération localités');
      return await response.json();
    } catch (error) {
      console.error('Erreur getLocationsByRegion:', error);
      throw error;
    }
  }

  /**
   * Exporte un questionnaire
   */
  async exportSurvey(surveyId, surveyData, format = 'xlsx') {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/v1/export/${encodeURIComponent(surveyId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...surveyData,
            format,
          }),
        }
      );

      if (!response.ok) throw new Error('Erreur export');
      return await response.json();
    } catch (error) {
      console.error('Erreur exportSurvey:', error);
      throw error;
    }
  }

  /**
   * Télécharge un fichier exporté
   */
  async downloadExport(filename) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/v1/exports/${encodeURIComponent(filename)}`
      );

      if (!response.ok) throw new Error('Erreur téléchargement');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (error) {
      console.error('Erreur downloadExport:', error);
      throw error;
    }
  }

  /**
   * Récupère l'état de l'API
   */
  async getHealth() {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (!response.ok) throw new Error('API non disponible');
      return await response.json();
    } catch (error) {
      console.error('Erreur health check:', error);
      throw error;
    }
  }
}

// Créer et exporter une instance unique
export const surveyGeneratorService = new SurveyGeneratorService();

export default SurveyGeneratorService;