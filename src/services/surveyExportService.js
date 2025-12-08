
/**
 * Service de gestion des exports (Excel, CSV, Kobo, Google Forms)
 * Communique avec les routes REST du backend FastAPI
 */

class SurveyExportService {
  constructor() {
    // Utilise la variable d'environnement ou le localhost par défaut
    this.apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  /**
   * Méthode générique pour les requêtes POST
   * @private
   */
  async _postRequest(endpoint, data) {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || (result.success === false)) {
        throw new Error(result.error || `Erreur API (${response.status})`);
      }

      return result;
    } catch (error) {
      console.error(`❌ Erreur export vers ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Génère l'export Excel (.xlsx)
   * @param {Object} surveyData - Les données de l'enquête
   * @returns {Promise<{success: boolean, filename: string}>}
   */
  async generateExcel(surveyData) {
    return this._postRequest('/api/v1/export/excel', surveyData);
  }

  /**
   * Génère l'export CSV (.csv)
   * @param {Object} surveyData - Les données de l'enquête
   * @returns {Promise<{success: boolean, filename: string}>}
   */
  async generateCsv(surveyData) {
    return this._postRequest('/api/v1/export/csv', surveyData);
  }

  /**
   * Génère l'export KoboToolbox (XLSForm .xlsx)
   * @param {Object} surveyData - Les données de l'enquête
   * @returns {Promise<{success: boolean, filename: string}>}
   */
  async generateKobo(surveyData) {
    return this._postRequest('/api/v1/export/kobo', surveyData);
  }

  /**
   * Crée un Google Form en ligne via l'API
   * @param {Object} surveyData - Les données de l'enquête
   * @returns {Promise<{success: boolean, responderUri: string, editUri: string}>}
   */
  async createGoogleForm(surveyData) {
    return this._postRequest('/api/v1/create-google-form', surveyData);
  }

  /**
   * Déclenche le téléchargement du fichier généré depuis le dossier statique du serveur
   * @param {string} filename - Le nom du fichier renvoyé par le backend
   */
  async downloadFile(filename) {
    try {
      // Construction de l'URL du fichier statique
      const fileUrl = `${this.apiUrl}/api/v1/exports/${encodeURIComponent(filename)}`;
      
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Impossible de récupérer le fichier');

      const blob = await response.blob();
      
      // Création d'un lien temporaire pour forcer le téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename; // Nom du fichier téléchargé
      document.body.appendChild(a);
      a.click();
      
      // Nettoyage
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }
}

// Créer et exporter une instance unique (Singleton)
export const surveyExportService = new SurveyExportService();

export default SurveyExportService;