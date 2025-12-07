import React, { createContext, useContext } from 'react';
import { useSurveyGenerator } from '@/hooks/useSurveyGenerator';

/**
 * Context pour le SurveyGeneratorService
 */
const SurveyGeneratorContext = createContext(null);

/**
 * Provider pour fournir le SurveyGenerator à toute l'application
 */
export function SurveyGeneratorProvider({ children }) {
  const surveyGenerator = useSurveyGenerator();

  return (
    <SurveyGeneratorContext.Provider value={surveyGenerator}>
      {children}
    </SurveyGeneratorContext.Provider>
  );
}

/**
 * Hook pour utiliser le SurveyGenerator
 * @returns {Object} L'instance du SurveyGenerator
 */
export function useSurvey() {
  const context = useContext(SurveyGeneratorContext);
  if (context === null) {
    throw new Error('useSurvey must be used within SurveyGeneratorProvider');
  }
  return context;
}

/**
 * Hook pour utiliser uniquement l'état de connexion
 */
export function useSurveyConnection() {
  const { connected } = useContext(SurveyGeneratorContext);
  if (connected === undefined) {
    throw new Error('useSurveyConnection must be used within SurveyGeneratorProvider');
  }
  return { connected };
}

/**
 * Hook pour utiliser uniquement l'état de génération
 */
export function useSurveyGeneration() {
  const { generating, progress, error, result } = useContext(SurveyGeneratorContext);
  if (generating === undefined) {
    throw new Error('useSurveyGeneration must be used within SurveyGeneratorProvider');
  }
  return { generating, progress, error, result };
}