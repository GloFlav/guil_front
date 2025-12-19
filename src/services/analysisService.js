/**
 * Service pour l'analyse de données
 * Utilise le service axios configuré avec interceptors JWT
 * 
 * @version 4.1.0 - Smart Analytics + PDF Export
 * 
 * NOUVEAUX ENDPOINTS:
 * - /api/v1/smart-analyze/complete        → Analyse complète 8 phases
 * - /api/v1/smart-analyze/feature-engineering → Feature Engineering seul
 * - /api/v1/smart-analyze/ml-pipeline     → ML Pipeline seul
 * - /api/v1/smart-analyze/generate-report → Rapport & Storytelling
 * - /api/v1/smart-analyze/export-pdf      → 🆕 Export PDF Multi-LLM
 * - /ws/smart-analyze/{file_id}           → WebSocket temps réel
 */

import api from '@/services/api';

export const analysisService = {
  // ============================================================================
  // 📤 UPLOAD & PREVIEW
  // ============================================================================

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
          'Content-Type': 'multipart/form-data',
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

  // ============================================================================
  // 📊 ANALYSE EDA (Legacy)
  // ============================================================================

  /**
   * Lance l'analyse EDA complète du fichier
   * Retourne les insights, graphiques, statistiques
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

  // ============================================================================
  // 🚀 SMART ANALYTICS - NOUVELLES PHASES
  // ============================================================================

  /**
   * 🚀 Lance l'analyse intelligente complète (8 phases)
   * Pipeline: Upload → Structure → Context → EDA → Features → ML → Story → Report
   * 
   * @param {string} fileId - ID du fichier uploadé
   * @param {string} userPrompt - Objectif de l'analyse
   * @param {object} options - Options avancées
   * @returns {Promise<SmartAnalysisResult>}
   */
  runSmartAnalysisComplete: async (fileId, userPrompt = '', options = {}) => {
    try {
      const response = await api.post('/api/v1/smart-analyze/complete', {
        file_id: fileId,
        user_prompt: userPrompt,
        options,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur Smart Analysis:', error);
      throw error;
    }
  },

  /**
   * 🔧 Lance uniquement le Feature Engineering (Phase 5)
   * 
   * @param {string} fileId - ID du fichier
   * @param {object} options - Options: create_interactions, apply_pca, etc.
   * @returns {Promise<FeatureEngineeringResult>}
   */
  runFeatureEngineering: async (fileId, options = {}) => {
    try {
      const response = await api.post('/api/v1/smart-analyze/feature-engineering', {
        file_id: fileId,
        options,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur Feature Engineering:', error);
      throw error;
    }
  },

  /**
   * 🤖 Lance uniquement le ML Pipeline (Phase 6)
   * 
   * @param {string} fileId - ID du fichier
   * @param {string} targetVariable - Variable cible (optionnel, auto-détecté sinon)
   * @param {boolean} tuneHyperparams - Activer GridSearchCV
   * @param {object} options - Options supplémentaires
   * @returns {Promise<MLPipelineResult>}
   */
  runMLPipeline: async (fileId, targetVariable = null, tuneHyperparams = false, options = {}) => {
    try {
      const response = await api.post('/api/v1/smart-analyze/ml-pipeline', {
        file_id: fileId,
        target_variable: targetVariable,
        tune_hyperparams: tuneHyperparams,
        options,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur ML Pipeline:', error);
      throw error;
    }
  },

  /**
   * 📖 Génère le rapport et storytelling (Phases 7-8)
   * 
   * @param {string} fileId - ID du fichier (doit avoir une analyse complète en cache)
   * @param {boolean} includeLLMEnrichment - Enrichir avec Multi-LLM
   * @returns {Promise<StorytellerResult>}
   */
  generateReport: async (fileId, includeLLMEnrichment = true) => {
    try {
      const response = await api.post('/api/v1/smart-analyze/generate-report', {
        file_id: fileId,
        include_llm_enrichment: includeLLMEnrichment,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      throw error;
    }
  },

  /**
   * 📊 Récupère le statut d'une analyse Smart Analytics
   * 
   * @param {string} fileId - ID du fichier
   * @returns {Promise<{status: string, progress: number, current_phase: string}>}
   */
  getSmartAnalysisStatus: async (fileId) => {
    try {
      const response = await api.get(`/api/v1/smart-analyze/status/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur statut:', error);
      throw error;
    }
  },

  /**
   * 📊 Récupère les résultats complets d'une Smart Analysis
   * 
   * @param {string} fileId - ID du fichier
   * @returns {Promise<SmartAnalysisResult>}
   */
  getSmartAnalysisResults: async (fileId) => {
    try {
      const response = await api.get(`/api/v1/smart-analyze/results/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération résultats:', error);
      throw error;
    }
  },

  /**
   * 🗑️ Supprime les résultats en cache
   * 
   * @param {string} fileId - ID du fichier
   */
  clearSmartAnalysis: async (fileId) => {
    try {
      const response = await api.delete(`/api/v1/smart-analyze/clear/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur suppression cache:', error);
      throw error;
    }
  },

  // ============================================================================
  // 📄 EXPORT PDF - NOUVEAU
  // ============================================================================

  /**
   * 📄 Exporte le rapport PDF professionnel avec analyse multi-LLM
   * 
   * Génère un rapport PDF de 3-5 pages avec:
   * - Titre contextuel (OpenAI GPT-4)
   * - Vulgarisation grand public (Google Gemini)
   * - Décisions sociales Madagascar (Anthropic Claude)
   * - Graphiques EDA intégrés
   * - Recommandations actionnables
   * 
   * @param {string} fileId - ID du fichier analysé
   * @param {string} userPrompt - Objectif/demande de l'utilisateur
   * @returns {Promise<{success: boolean, report_path: string, download_url: string, file_size: number, pages_estimated: number}>}
   */
  exportSmartAnalysisPDF: async (fileId, userPrompt = '') => {
    try {
      const response = await api.post('/api/v1/smart-analyze/export-pdf', {
        file_id: fileId,
        user_prompt: userPrompt,
      }, {
        timeout: 180000, // 3 minutes pour la génération PDF multi-LLM
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      
      // Extraire le message d'erreur détaillé
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.error 
        || error.message 
        || 'Erreur lors de la génération du rapport PDF';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * 📥 Télécharge directement un fichier PDF exporté
   * 
   * @param {string} downloadUrl - URL de téléchargement (relative: /api/v1/exports/filename.pdf)
   * @param {string} filename - Nom du fichier pour le téléchargement local
   * @returns {Promise<{success: boolean}>}
   */
  downloadPDFFile: async (downloadUrl, filename = 'rapport.pdf') => {
    try {
      const response = await api.get(downloadUrl, {
        responseType: 'blob',
        timeout: 60000,
      });

      // Créer un lien de téléchargement
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur téléchargement PDF:', error);
      throw new Error('Impossible de télécharger le fichier PDF');
    }
  },

  // ============================================================================
  // 🔄 WEBSOCKET SMART ANALYTICS
  // ============================================================================

  /**
   * 🔄 Crée une connexion WebSocket pour le suivi temps réel
   * 
   * @param {string} fileId - ID du fichier
   * @param {object} callbacks - { onProgress, onComplete, onError }
   * @returns {WebSocket}
   */
  createSmartAnalysisWebSocket: (fileId, callbacks = {}) => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Vite utilise import.meta.env, fallback sur localhost:8000 pour le dev
    const wsHost = import.meta.env?.VITE_WS_HOST || 'localhost:8000';
    const wsUrl = `${wsProtocol}//${wsHost}/ws/smart-analyze/${fileId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔌 WebSocket Smart Analysis connecté');
      if (callbacks.onOpen) callbacks.onOpen();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'progress':
            if (callbacks.onProgress) {
              callbacks.onProgress(data.message, data.percentage, data.timestamp);
            }
            break;
          case 'phase_complete':
            if (callbacks.onPhaseComplete) {
              callbacks.onPhaseComplete(data.phase, data.data);
            }
            break;
          case 'completed':
            if (callbacks.onComplete) {
              callbacks.onComplete(data);
            }
            break;
          case 'error':
            if (callbacks.onError) {
              callbacks.onError(data.message);
            }
            break;
          default:
            console.log('📩 Message WebSocket:', data);
        }
      } catch (e) {
        console.error('Erreur parsing WebSocket:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Erreur WebSocket:', error);
      if (callbacks.onError) callbacks.onError('Erreur de connexion WebSocket');
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket fermé');
      if (callbacks.onClose) callbacks.onClose();
    };

    return ws;
  },

  /**
   * 🔄 Lance une Smart Analysis via WebSocket avec suivi temps réel
   * 
   * @param {string} fileId - ID du fichier
   * @param {string} userPrompt - Objectif de l'analyse
   * @param {object} callbacks - { onProgress, onComplete, onError }
   * @returns {WebSocket}
   */
  startSmartAnalysisWithProgress: (fileId, userPrompt, callbacks) => {
    const ws = analysisService.createSmartAnalysisWebSocket(fileId, callbacks);

    // Envoyer le prompt une fois connecté
    const originalOnOpen = callbacks.onOpen;
    ws.onopen = () => {
      console.log('🔌 WebSocket connecté, envoi du prompt...');
      ws.send(JSON.stringify({ user_prompt: userPrompt }));
      if (originalOnOpen) originalOnOpen();
    };

    return ws;
  },

  // ============================================================================
  // 📦 EXPORT & NETTOYAGE
  // ============================================================================

  /**
   * Nettoie le fichier (supprime colonnes vides, etc.)
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

  // ============================================================================
  // 🔍 UTILITAIRES
  // ============================================================================

  /**
   * Récupère la preview d'un fichier (50 premières lignes)
   */
  getFilePreview: async (fileId) => {
    try {
      const response = await api.get(`/api/v1/files/${fileId}/preview`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur preview:', error);
      throw error;
    }
  },
};

export default analysisService;