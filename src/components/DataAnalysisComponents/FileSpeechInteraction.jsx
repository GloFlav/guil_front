// frontend/components/dataAnalysisComponents/FileSpeechInteraction.jsx
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';
import useSpeechService from '@/hooks/useSpeechService';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const FileSpeechInteraction = ({ 
  fileStats, 
  onAnalysisPromptReceived,
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle, generating-tts, playing-tts, listening, complete
  const [ttsText, setTtsText] = useState('');
  const [userVoiceInput, setUserVoiceInput] = useState('');
  
  const {
    speak,
    stopSpeaking,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    transcript,
    error,
    cleanup
  } = useSpeechService();

  const API_URL = "http://localhost:8000/api/v1";
  const GREEN_COLOR = '#5DA781';

  // ============================================================================
  // 1. PHASE 1 : Générer le texte TTS et le lire
  // ============================================================================

  const handleStartVoiceGuide = async () => {
    if (!fileStats) return;

    setIsLoading(true);
    setPhase('generating-tts');

    try {
      // Appeler l'API pour générer le texte TTS
      const response = await axios.post(`${API_URL}/analyze/file-structure-tts`, {
        file_id: fileStats.file_id
      });

      const { tts_text } = response.data;
      setTtsText(tts_text);

      // Lancer la lecture du TTS
      setPhase('playing-tts');
      setIsLoading(false);

      await speak(tts_text, {
        language: 'fr-FR',
        rate: 0.95,
        pitch: 1
      });

      // Après la lecture, passer à l'écoute
      setPhase('listening');
      
      // Attendre un peu avant de démarrer l'écoute
      setTimeout(() => {
        startVoiceCapture();
      }, 1000);

    } catch (err) {
      console.error("Erreur:", err);
      setIsLoading(false);
      setPhase('idle');
      
      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.detail || "Impossible de générer le guide vocal"
      });
    }
  };

  // ============================================================================
  // 2. PHASE 2 : Capturer la voix de l'utilisateur
  // ============================================================================

  const startVoiceCapture = async () => {
    try {
      const result = await startListening({
        language: 'fr-FR',
        continuous: false,
        interimResults: true
      });

      setUserVoiceInput(result);
      setPhase('complete');

      // Afficher ce qu'on a capturé
      if (result.trim()) {
        MySwal.fire({
          icon: 'success',
          title: 'Objectif capturé!',
          html: `<p class="text-left"><strong>Vous avez dit:</strong></p><p class="text-left italic text-gray-600">"${result}"</p>`,
          confirmButtonText: 'Continuer avec cette analyse',
          confirmButtonColor: GREEN_COLOR
        }).then((res) => {
          if (res.isConfirmed) {
            // Passer le prompt à la page parent
            onAnalysisPromptReceived(result);
          }
        });
      }

    } catch (err) {
      console.error("Erreur STT:", err);
      MySwal.fire({
        icon: 'warning',
        title: 'Erreur d\'écoute',
        text: "Impossible de capturer votre voix. Veuillez vérifier votre microphone."
      });
      setPhase('idle');
    }
  };

  // ============================================================================
  // RENDER SELON LA PHASE
  // ============================================================================

  if (!fileStats) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
          <Volume2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Guide Vocal Interactif</h3>
          <p className="text-xs text-gray-500 mt-0.5">Écoutez une analyse de votre fichier et exprimez votre objectif</p>
        </div>
      </div>

      {/* PHASE: IDLE */}
      {phase === 'idle' && (
        <button
          onClick={handleStartVoiceGuide}
          disabled={disabled || isLoading}
          className="w-full px-6 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-blue-100 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Démarrer le Guide Vocal
        </button>
      )}

      {/* PHASE: GENERATING TTS */}
      {phase === 'generating-tts' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-gray-700">Génération du guide...</p>
          <p className="text-xs text-gray-500">Analyse de la structure du fichier</p>
        </div>
      )}

      {/* PHASE: PLAYING TTS */}
      {phase === 'playing-tts' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-blue-600 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Écoutez l'analyse de votre fichier...</p>
                <p className="text-xs text-blue-700 mt-1 italic">{ttsText.substring(0, 150)}...</p>
              </div>
            </div>
          </div>

          <button
            onClick={stopSpeaking}
            className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <VolumeX className="w-4 h-4" />
            Arrêter la lecture
          </button>
        </div>
      )}

      {/* PHASE: LISTENING */}
      {phase === 'listening' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-amber-600 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">Microphone actif</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {transcript || "En attente de votre réponse..."}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={stopListening}
            disabled={!isListening}
            className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <MicOff className="w-4 h-4" />
            Terminer l'enregistrement
          </button>
        </div>
      )}

      {/* PHASE: COMPLETE */}
      {phase === 'complete' && userVoiceInput && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm font-bold text-green-900 mb-2">✓ Objectif capturé:</p>
            <p className="text-sm text-green-800 italic">"{userVoiceInput}"</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setPhase('idle');
                setUserVoiceInput('');
                setTtsText('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={() => onAnalysisPromptReceived(userVoiceInput)}
              style={{ backgroundColor: GREEN_COLOR }}
              className="px-4 py-2 text-white rounded-lg font-bold text-sm hover:shadow-md transition-all"
            >
              Continuer l'analyse
            </button>
          </div>
        </div>
      )}

      {/* ERROR DISPLAY */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">Assurez-vous que votre navigateur supporte les APIs Web Speech.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileSpeechInteraction;