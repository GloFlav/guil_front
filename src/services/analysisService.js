// frontend/services/analysisService.js
/**
 * Service pour l'analyse de données
 * Utilise le service axios configuré avec interceptors JWT
 */

import api from '@/services/api'; // ← Votre service API existant!

export const analysisService = {
  /**
   * Upload et scan rapide d'un fichier
   * Retourne les métadonnées: stats, colonnes, qualité des données
   */
  uploadFilePreview: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/v1/analyze/upload-preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important pour les fichiers!
        },
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur upload preview:', error);
      throw error;
    }
  },

  /**
   * Génère l'explication thématique du fichier
   * Retourne TTS text et explication IA
   * 
   * @param {string} fileId - ID du fichier uploadé
   * @param {string} userPrompt - Prompt optionnel (défaut: "")
   * @returns {Promise<{success: boolean, tts_text: string, ai_summary: string, structure: object}>}
   */
  getFileStructureExplanation: async (fileId, userPrompt = '') => {
    try {
      const response = await api.post('/api/v1/analyze/file-structure-tts', {
        file_id: fileId,
        user_prompt: userPrompt,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur structure TTS:', error);
      throw error;
    }
  },

  /**
   * Lance l'analyse complète du fichier
   * Retourne les insights, graphiques, statistiques
   * 
   * @param {string} fileId - ID du fichier uploadé
   * @param {string} userPrompt - Objectif/description de l'analyse
   * @returns {Promise<FullAnalysisResult>}
   */
  analyzeFileFull: async (fileId, userPrompt) => {
    try {
      const response = await api.post('/api/v1/analyze/full', {
        file_id: fileId,
        user_prompt: userPrompt,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur analyse complète:', error);
      throw error;
    }
  },

  /**
   * Nettoie le fichier (supprime colonnes vides, etc.)
   * @param {string} fileId - ID du fichier
   * @param {string} format - Format de sortie (xlsx, csv)
   * @param {boolean} removeSparse - Supprimer colonnes partiellement vides
   */
  cleanAndDownload: async (fileId, format = 'xlsx', removeSparse = false) => {
    try {
      const response = await api.post('/api/v1/export/clean-download', {
        file_id: fileId,
        format,
        remove_sparse: removeSparse,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
      throw error;
    }
  },

  /**
   * Exporte en Excel
   */
  exportToExcel: async (surveyData) => {
    try {
      const response = await api.post('/api/v1/export/excel', surveyData);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
      throw error;
    }
  },

  /**
   * Exporte en CSV
   */
  exportToCSV: async (surveyData) => {
    try {
      const response = await api.post('/api/v1/export/csv', surveyData);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur export CSV:', error);
      throw error;
    }
  },
};

export default analysisService;