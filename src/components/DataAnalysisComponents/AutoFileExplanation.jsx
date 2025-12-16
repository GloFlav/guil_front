// frontend/components/dataAnalysisComponents/AutoFileExplanation.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Loader, CheckCircle } from 'lucide-react';

const AutoFileExplanation = ({ 
  fileStats, 
  onExplanationComplete, 
  onTranscriptionReceived,
  disabled,
  isTtsEnabled,
  speakNonBlocking
}) => {
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const scrollContainerRef = useRef(null);
  const ttsLaunchedRef = useRef(false);

  const fetchExplanation = async () => {
    if (!fileStats?.file_id || ttsLaunchedRef.current) return;

    setIsLoading(true);
    setIsComplete(false);

    try {
      // 🎤 Appel API
      const response = await fetch('/api/v1/analyze/file-structure-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileStats.file_id })
      });

      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      
      // Afficher l'explication
      setExplanation(data.ai_summary || "");

      // 🎤 LANCER TTS AUTOMATIQUEMENT (non-bloquant)
      if (isTtsEnabled && data.tts_text) {
        ttsLaunchedRef.current = true;
        // Fire and forget - interface reste accessible
        speakNonBlocking(data.tts_text).catch(err => {
          console.error("TTS error:", err);
        });
      }

      setIsComplete(true);
      onExplanationComplete();

    } catch (error) {
      console.error("Erreur:", error);
      setExplanation("Erreur lors de l'analyse");
      setIsComplete(true);
      onExplanationComplete();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fileStats?.file_id && explanation === "" && !ttsLaunchedRef.current) {
      fetchExplanation();
    }
  }, [fileStats?.file_id]);

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">Analyse du Thème</h3>
          {isComplete && <CheckCircle className="w-5 h-5 text-green-600" />}
        </div>
      </div>

      {/* Contenu avec Scroll */}
      <div
        ref={scrollContainerRef}
        className="bg-white rounded-lg border border-blue-100 p-4 min-h-[150px] max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 mb-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader className="animate-spin text-blue-500 mr-2" size={20} />
            <span className="text-gray-600 text-sm">Analyse en cours...</span>
          </div>
        ) : explanation ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
              {explanation}
            </p>
          </div>
        ) : (
          <p className="text-gray-400 italic text-sm">En attente des données...</p>
        )}
      </div>

      {/* Info TTS */}
      {isComplete && isTtsEnabled && (
        <div className="text-center text-xs text-green-600 font-medium p-2 bg-green-50 rounded border border-green-100">
          🔊 Lecture en cours... (interface accessible)
        </div>
      )}
    </div>
  );
};

export default AutoFileExplanation;