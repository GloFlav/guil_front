// frontend/hooks/useSpeechService.js
import { useState, useCallback, useRef } from 'react';

/**
 * Hook personnalisé pour gérer Text-to-Speech et Speech-to-Text
 * Utilise la Web Speech API native du navigateur
 */
export const useSpeechService = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  
  const synthesisRef = useRef(null);
  const recognitionRef = useRef(null);

  // ============================================================================
  // TEXT-TO-SPEECH (TTS)
  // ============================================================================
  
  const speak = useCallback((text, options = {}) => {
    return new Promise((resolve, reject) => {
      // Vérifier le support
      const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
      if (!SpeechSynthesisUtterance) {
        const msg = "TTS non supporté par ce navigateur";
        setError(msg);
        reject(new Error(msg));
        return;
      }

      // Arrêter toute parole en cours
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configuration
      utterance.lang = options.language || 'fr-FR';
      utterance.rate = options.rate || 0.95;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        const errorMsg = `Erreur TTS: ${event.error}`;
        setError(errorMsg);
        reject(new Error(errorMsg));
      };

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // ============================================================================
  // SPEECH-TO-TEXT (STT)
  // ============================================================================

  const startListening = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        const msg = "STT non supporté par ce navigateur";
        setError(msg);
        reject(new Error(msg));
        return;
      }

      const recognition = new SpeechRecognition();
      
      // Configuration
      recognition.lang = options.language || 'fr-FR';
      recognition.continuous = options.continuous || false;
      recognition.interimResults = options.interimResults || true;
      recognition.maxAlternatives = 1;

      let finalTranscript = '';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setError(null);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        resolve(finalTranscript.trim());
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        const errorMsg = `Erreur STT: ${event.error}`;
        setError(errorMsg);
        reject(new Error(errorMsg));
      };

      recognitionRef.current = recognition;
      recognition.start();
    });
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  const cleanup = useCallback(() => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsSpeaking(false);
    setIsListening(false);
    setTranscript('');
    setError(null);
  }, []);

  return {
    // TTS
    speak,
    stopSpeaking,
    isSpeaking,
    
    // STT
    startListening,
    stopListening,
    isListening,
    transcript,
    
    // Shared
    error,
    cleanup
  };
};

export default useSpeechService;