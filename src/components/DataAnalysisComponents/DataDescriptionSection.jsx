import React, { useRef, useEffect, useState } from 'react';
import { Info, Sparkles, Mic, MicOff } from 'lucide-react';

const DataDescriptionSection = ({ description, onDescriptionChange, onAiGenerate }) => {
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null); // Référence pour l'objet SpeechRecognition
  const [isListening, setIsListening] = useState(false); // État d'écoute
  const [isSpeechSupported, setIsSpeechSupported] = useState(false); // Vérif compatibilité navigateur

  const GREEN_COLOR = '#5DA781';

  // 1. Initialisation de la reconnaissance vocale
  useEffect(() => {
    // Vérification de la compatibilité (Chrome, Edge, Safari, etc.)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Continue d'écouter même après une pause
      recognition.interimResults = true; // Résultats en temps réel
      recognition.lang = 'fr-FR'; // Langue française

      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        // On récupère uniquement les résultats finaux pour éviter les doublons/instabilités
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          // On ajoute le texte dicté à la suite du texte existant
          // Utilisation de la fonction de mise à jour pour avoir la valeur la plus récente
          onDescriptionChange((prev) => {
            const separator = prev && prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + finalTranscript;
          });
        }
      };

      recognition.onerror = (event) => {
        console.error("Erreur reconnaissance vocale:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        // Si on arrête volontairement, on met à jour l'état, sinon ça peut être une coupure auto
        if (isListening) {
           // Optionnel : relancer ici si on veut une écoute "infinie"
           // recognition.start(); 
        }
      };

      recognitionRef.current = recognition;
    }
  }, [onDescriptionChange]); // Dépendance minimale

  // 2. Gestionnaire du clic Micro
  const toggleListening = () => {
    if (!isSpeechSupported) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        300
      ) + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [description]);

  return (
    <div className="space-y-4">
      {/* Label with Info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-semibold text-gray-900">
            📝 Décrire votre analyse
          </label>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 z-10 whitespace-normal">
              Décrivez les analyses que vous souhaitez effectuer sur vos
              données (statistiques, tendances, corrélations, etc.)
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Indiquez quel type d'analyse vous souhaitez effectuer
        </p>
      </div>

      {/* Textarea Wrapper */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={isListening ? "Écoute en cours... parlez maintenant." : "Ex: Ceci est une analyse des ventes mensuelles..."}
            // Augmentation du padding-right (pr-24) pour accueillir les deux boutons
            className={`w-full px-4 py-3 pr-24 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm resize-none max-h-80 transition-colors ${isListening ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'}`}
            style={{
              '--tw-ring-color': isListening ? '#f87171' : GREEN_COLOR,
            }}
            rows={3}
            onInput={autoResize}
          />
          
          {/* Groupe de Boutons en bas à droite */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            
            {/* Bouton Speech-to-Text */}
            {isSpeechSupported && (
              <button
                onClick={toggleListening}
                className={`p-1.5 rounded-md text-white shadow-sm transition-all duration-200 flex items-center justify-center ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400 hover:bg-gray-500'}`}
                title={isListening ? "Arrêter la dictée" : "Dicter le texte"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Bouton IA */}
            <button
              onClick={onAiGenerate}
              className="p-1.5 rounded-md text-white shadow-sm transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
              style={{ backgroundColor: GREEN_COLOR }}
              title="Améliorer avec l'IA"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Character Count & Status */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {description.length} caractères
          </p>
          <div className="flex items-center gap-3">
            {isListening && (
               <span className="text-xs font-medium text-red-500 flex items-center gap-1 animate-pulse">
                 ● Enregistrement...
               </span>
            )}
            {!isListening && description.trim() && (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                ✓ Prêt à analyser
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {!description.trim() && !isListening && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-900">Suggestions:</p>
          <div className="space-y-1 text-xs text-blue-800">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Calculer les statistiques descriptives</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Identifier les valeurs manquantes et les doublons</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Analyser les corrélations entre les variables</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Générer des visualisations et graphiques</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDescriptionSection;