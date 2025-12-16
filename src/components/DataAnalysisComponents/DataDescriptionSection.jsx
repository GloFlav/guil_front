import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Info, Sparkles, Mic, MicOff } from 'lucide-react';

const DataDescriptionSection = ({ description, onDescriptionChange, onAiGenerate }) => {
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  // On garde une référence du texte AVANT de commencer à parler
  // pour éviter d'écrire par-dessus ou de dupliquer.
  const textBeforeSpeechRef = useRef('');

  const GREEN_COLOR = '#5DA781';

  // 1. Initialisation
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) { 
      return;
    }

    setIsSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // IMPORTANT: On veut les résultats en direct
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      // Au démarrage, on fige le texte actuel pour savoir où ajouter la suite
      // On utilise textareaRef.current.value pour avoir la valeur la plus à jour possible
      textBeforeSpeechRef.current = textareaRef.current ? textareaRef.current.value : '';
    };

    recognition.onresult = (event) => {
      let currentSessionTranscript = '';

      // On boucle sur TOUS les résultats (pas seulement isFinal)
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentSessionTranscript += event.results[i][0].transcript;
      }

      // MISE À JOUR INSTANTANÉE
      // On combine : (Texte avant de parler) + (Espace éventuel) + (Ce qu'on dit maintenant)
      const separator = (textBeforeSpeechRef.current && !textBeforeSpeechRef.current.endsWith(' ')) ? ' ' : '';
      onDescriptionChange(textBeforeSpeechRef.current + separator + currentSessionTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Erreur Speech:", event.error);
      if(event.error === 'not-allowed') setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [onDescriptionChange]); // Dépendance minimale

  // 2. Gestionnaire du clic
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Mise à jour de la ref manuellement juste avant de lancer pour être sûr
      textBeforeSpeechRef.current = description; 
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, description]);

  // Auto-resize du textarea
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 300) + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [description]);

  return (
    <div className="space-y-4">
      {/* En-tête avec Info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-semibold text-gray-900">
            📝 Décrire votre analyse
          </label>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 z-10 whitespace-normal">
              Décrivez les analyses souhaitées (statistiques, tendances, etc.)
            </div>
          </div>
        </div>
      </div>

      {/* Zone de texte */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={isListening ? "Je vous écoute..." : "Ex: Je voudrais analyser l'évolution des ventes..."}
            className={`w-full px-4 py-3 pr-24 border rounded-lg focus:outline-none focus:ring-2 text-sm resize-none max-h-80 transition-colors ${isListening ? 'border-red-400 ring-2 ring-red-100 bg-red-50/10' : 'border-gray-300 focus:ring-green-100'}`}
            style={{
              '--tw-ring-color': isListening ? '#f87171' : GREEN_COLOR,
              borderColor: isListening ? '#f87171' : undefined
            }}
            rows={3}
            onInput={autoResize}
          />
          
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {/* Bouton Micro */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-md text-white shadow-sm transition-all duration-200 flex items-center justify-center ${isListening ? 'bg-red-500 animate-pulse scale-105' : 'bg-gray-400 hover:bg-gray-500'}`}
                title={isListening ? "Arrêter" : "Dicter"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Bouton IA */}
            <button
              type="button"
              onClick={onAiGenerate}
              className="p-1.5 rounded-md text-white shadow-sm transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
              style={{ backgroundColor: GREEN_COLOR }}
              title="Générer avec l'IA"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compteur et Statut */}
        <div className="flex justify-between items-center h-5">
          <p className="text-xs text-gray-500">
            {description ? description.length : 0} caractères
          </p>
          {isListening && (
              <span className="text-xs font-bold text-red-500 flex items-center gap-1 animate-pulse">
                ● Écriture en direct...
              </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataDescriptionSection;