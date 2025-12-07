import { useEffect, useCallback, useRef, useState } from 'react';
import { surveyGeneratorService } from '@/services/surveyGeneratorService';


/**
 * Hook pour gérer la génération de questionnaires avec streaming WebSocket
 * @returns {Object} État et méthodes de contrôle
 */
export function useSurveyGenerator() {
  const [connected, setConnected] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const listenerRef = useRef({});

  // Connexion initiale au WebSocket
  useEffect(() => {
    const setupListeners = async () => {
      try {
        await surveyGeneratorService.connect();
        setConnected(true);
        setError(null);
      } catch (err) {
        console.error('Connexion WebSocket échouée:', err);
        setError(err.message || 'Erreur de connexion');
        setConnected(false);
      }
    };

    // Handlers pour les événements
    const handleConnected = () => {
      setConnected(true);
      setError(null);
    };

    const handleDisconnected = () => {
      setConnected(false);
    };

    const handleProgress = (data) => {
      setProgress(data);
      setError(null);
    };

    const handleError = (errorData) => {
      console.error('Erreur du serveur:', errorData);
      setError(errorData.message || 'Erreur inconnue');
      setGenerating(false);
    };

    const handleResult = (data) => {
      setResult(data);
      setGenerating(false);
      setProgress(null);
    };

    // Enregistrer les listeners
    surveyGeneratorService.on('connected', handleConnected);
    surveyGeneratorService.on('disconnected', handleDisconnected);
    surveyGeneratorService.on('progress', handleProgress);
    surveyGeneratorService.on('error', handleError);
    surveyGeneratorService.on('result', handleResult);

    // Stocker les références
    listenerRef.current = {
      handleConnected,
      handleDisconnected,
      handleProgress,
      handleError,
      handleResult,
    };

    setupListeners();

    // Cleanup
    return () => {
      Object.entries(listenerRef.current).forEach(([key, handler]) => {
        const event = key.replace('handle', '').toLowerCase();
        if (event === 'connected') surveyGeneratorService.off('connected', handler);
        else if (event === 'disconnected') surveyGeneratorService.off('disconnected', handler);
        else if (event === 'progress') surveyGeneratorService.off('progress', handler);
        else if (event === 'error') surveyGeneratorService.off('error', handler);
        else if (event === 'result') surveyGeneratorService.off('result', handler);
      });
    };
  }, []);

  // Fonction pour générer un questionnaire
  const generateSurvey = useCallback(async (prompt, language = 'fr') => {
    if (!connected) {
      setError('WebSocket non connecté');
      return null;
    }

    if (!prompt || prompt.trim().length === 0) {
      setError('Le prompt ne peut pas être vide');
      return null;
    }

    try {
      setGenerating(true);
      setError(null);
      setProgress(null);
      setResult(null);

      const result = await surveyGeneratorService.generateSurvey(prompt, language);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la génération';
      setError(errorMessage);
      setGenerating(false);
      return null;
    }
  }, [connected]);

  // Fonction pour exporter un questionnaire
  const exportSurvey = useCallback(async (surveyId, surveyData, format = 'xlsx') => {
    try {
      const result = await surveyGeneratorService.exportSurvey(surveyId, surveyData, format);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de l\'export';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Fonction pour télécharger un fichier exporté
  const downloadExport = useCallback(async (filename) => {
    try {
      await surveyGeneratorService.downloadExport(filename);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du téléchargement';
      setError(errorMessage);
    }
  }, []);

  // Fonction pour récupérer les localités
  const getLocations = useCallback(async () => {
    try {
      return await surveyGeneratorService.getLocations();
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la récupération des localités';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Fonction pour récupérer les localités par région
  const getLocationsByRegion = useCallback(async (region) => {
    try {
      return await surveyGeneratorService.getLocationsByRegion(region);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la récupération des localités';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Fonction pour vérifier la santé de l'API
  const checkHealth = useCallback(async () => {
    try {
      return await surveyGeneratorService.getHealth();
    } catch (err) {
      const errorMessage = err.message || 'API non disponible';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Fonction pour se déconnecter
  const disconnect = useCallback(() => {
    surveyGeneratorService.disconnect();
    setConnected(false);
  }, []);

  return {
    // État
    connected,
    generating,
    progress,
    error,
    result,
    
    // Méthodes
    generateSurvey,
    exportSurvey,
    downloadExport,
    getLocations,
    getLocationsByRegion,
    checkHealth,
    disconnect,
    
    // Pour accès direct au service si nécessaire
    service: surveyGeneratorService,
  };
}