import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  MapPin,
  AlertCircle,
  Loader,
} from 'lucide-react';
import SurveyGeneratorInput from '@/components/surveyGeneratorComponents/SurveyGeneratorInput';
import SurveyGeneratorDisplay from '@/components/surveyGeneratorComponents/SurveyGeneratorDisplay';
import SurveyGeneratorMap from '@/components/surveyGeneratorComponents/SurveyGeneratorMap';
import SurveyExportSidebar from '@/components/surveyGeneratorComponents/SurveyExportSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import * as socketService from '@/services/socket';

const MySwal = withReactContent(Swal);

const SurveyGenerator = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Bonjour! Je suis Kaï-hwïnd, assistant expert Rag_uil. Je vais vous aider à générer des questionnaires d\'enquête personnalisés. Décrivez simplement vos besoins.',
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [surveyData, setSurveyData] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [messagesHeight, setMessagesHeight] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const minBottomHeight = useRef(150);
  const unsubscribersRef = useRef([]);

  const GREEN_COLOR = '#5DA781';

  // Connexion au WebSocket au montage
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await socketService.connectSocket();
        setConnected(true);
        setConnectionError(null);
      } catch (err) {
        console.error('Erreur de connexion WebSocket:', err);
        setConnectionError(err.message || 'Impossible de se connecter au serveur');
        setConnected(false);
      }
    };

    initializeSocket();

    // Enregistrer les listeners
    const unsubConnected = socketService.on('connected', () => {
      setConnected(true);
      setConnectionError(null);
      addSystemMessage('✅ Connecté au serveur');
    });

    const unsubDisconnected = socketService.on('disconnected', () => {
      setConnected(false);
      addSystemMessage('🔌 Déconnecté du serveur');
    });

    const unsubProgress = socketService.on('progress', (data) => {
      setProgress(data);
      setError(null);
      
      if (data.message) {
        addSystemMessage(data.message);
      }
    });

    const unsubError = socketService.on('error', (errorData) => {
      console.error('Erreur serveur:', errorData);
      setError(errorData.message || 'Erreur inconnue');
      setIsLoading(false);
      addSystemMessage(`❌ Erreur: ${errorData.message}`);
    });

    const unsubResult = socketService.on('result', (data) => {
      console.log('Résultat reçu:', data);
      setSurveyData(data);
      setIsLoading(false);
      setProgress(null);
      addSystemMessage('✅ Questionnaire généré avec succès!');
    });

    const unsubReconnectFailed = socketService.on('reconnect_failed', () => {
      setConnectionError('Impossible de se reconnecter au serveur');
    });

    unsubscribersRef.current = [
      unsubConnected,
      unsubDisconnected,
      unsubProgress,
      unsubError,
      unsubResult,
      unsubReconnectFailed,
    ];

    // Cleanup
    return () => {
      unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addSystemMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        role: 'system',
        text,
        timestamp: new Date(),
      },
    ]);
  };

  // Gestion du redimensionnement
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;

      const minPercentage = (minBottomHeight.current / containerRect.height) * 100;

      if (newHeight >= 0 && newHeight <= (100 - minPercentage)) {
        setMessagesHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSendMessage = async (prompt) => {
    if (!connected) {
      MySwal.fire({
        icon: 'error',
        title: 'Non connecté',
        text: 'Impossible de générer: connexion WebSocket perdue. Rafraîchissez la page.',
      });
      return;
    }

    // Ajouter le message utilisateur
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        role: 'user',
        text: prompt,
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);
    setProgress(null);
    setError(null);

    try {
      // Envoyer le message via WebSocket
      await socketService.sendMessage({
        type: 'generate',
        prompt: prompt,
        language: 'fr',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError(err.message);
      setIsLoading(false);
      addSystemMessage(`❌ Erreur: ${err.message}`);
    }
  };

  const handleRegenerate = async () => {
    if (!surveyData) return;

    setIsLoading(true);
    setProgress(null);
    setError(null);

    try {
      await socketService.sendMessage({
        type: 'generate',
        prompt: messages.find((m) => m.role === 'user')?.text || 'Régénérer le questionnaire',
        language: 'fr',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Erreur régénération:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleViewMap = () => {
    if (surveyData?.locations && surveyData.locations.length > 0) {
      setShowMap(true);
    } else {
      MySwal.fire({
        icon: 'info',
        title: 'Aucun lieu disponible',
        text: 'Le questionnaire ne contient pas de lieux d\'enquête.',
      });
    }
  };

  // Observer la hauteur du champ de saisie
  useEffect(() => {
    if (!inputRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const inputHeight = inputRef.current.offsetHeight + 48;
      minBottomHeight.current = inputHeight;
    });

    resizeObserver.observe(inputRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Affichage de l'erreur de connexion
  useEffect(() => {
    if (connectionError) {
      MySwal.fire({
        icon: 'warning',
        title: 'Erreur de connexion',
        text: connectionError,
        confirmButtonText: 'OK',
      });
    }
  }, [connectionError]);

  return (
    <div className="flex h-screen bg-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col" ref={containerRef}>
        {/* Status Bar */}
        <div className="bg-white border-b border-gray-300 px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-600">
              {connected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          {progress && (
            <div className="flex items-center gap-2">
              <Loader className="w-3 h-3 animate-spin" />
              <span className="text-gray-600">
                {progress.percentage}% - {progress.status}
              </span>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div
          className="overflow-y-auto p-6 space-y-4 bg-gray-50"
          style={{ height: `${messagesHeight}%` }}
        >
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'user' ? (
                <div className="flex justify-end mb-4">
                  <div
                    className="max-w-md rounded-lg p-4 shadow-sm text-white"
                    style={{ backgroundColor: GREEN_COLOR }}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ) : message.role === 'system' ? (
                <div className="flex justify-center mb-4">
                  <div className="max-w-md bg-gray-100 text-gray-600 rounded-lg p-3 flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{message.text}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start mb-4">
                  <div className="max-w-2xl bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                        style={{ backgroundColor: GREEN_COLOR }}
                      >
                        <span className="text-xs font-bold">KH</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 mb-2">{message.text}</p>
                        <p className="text-xs text-gray-500">
                          {message.timestamp?.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-center mb-4">
              <div className="max-w-md bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full animate-bounce"
                  style={{ backgroundColor: GREEN_COLOR }}
                />
                <span className="text-sm text-gray-600">Génération en cours...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center mb-4">
              <div className="max-w-md bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Resizable Separator */}
        <div
          onMouseDown={handleMouseDown}
          className={`h-1 bg-gray-300 hover:bg-blue-500 cursor-ns-resize transition-colors ${
            isDragging ? 'bg-blue-500' : ''
          }`}
          style={{
            userSelect: 'none',
          }}
          title="Glissez pour redimensionner"
        />

        {/* Survey Results and Input - Bottom Section */}
        <div
          className="border-t border-gray-200 overflow-hidden flex flex-col"
          style={{ height: `${100 - messagesHeight}%` }}
        >
          {surveyData && (
            <div className="bg-white p-6 overflow-y-auto flex-1 border-b border-gray-200">
              <SurveyGeneratorDisplay surveyData={surveyData} />

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 flex-wrap">
                <button
                  onClick={handleViewMap}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <MapPin className="w-4 h-4" /> Voir sur la carte
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Régénérer
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-white p-6 flex-shrink-0" ref={inputRef}>
            <SurveyGeneratorInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              connected={connected}
            />
          </div>
        </div>
      </div>

      {/* Export Sidebar - Right */}
      {surveyData && (
        <SurveyExportSidebar data={surveyData} />
      )}

      {/* Map Modal */}
      {showMap && surveyData && (
        <SurveyGeneratorMap
          locations={surveyData.locations}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
};

export default SurveyGenerator;