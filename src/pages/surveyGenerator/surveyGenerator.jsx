import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  MapPin,
  AlertCircle,
  Loader,
  Terminal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import SurveyGeneratorInput from '@/components/surveyGeneratorComponents/SurveyGeneratorInput';
import SurveyGeneratorDisplay from '@/components/surveyGeneratorComponents/SurveyGeneratorDisplay';
import SurveyGeneratorMap from '@/components/surveyGeneratorComponents/SurveyGeneratorMap';
import SurveyExportSidebar from '@/components/surveyGeneratorComponents/SurveyExportSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import * as socketService from '@/services/socket';

const MySwal = withReactContent(Swal);

// --- BANQUE DE PHRASES TTS (Conservée) ---
const PHRASES = {
  START: [
    "C'est reçu ! Je m'occupe de tout. Lancement de la procédure.",
    "Message bien reçu. J'active les protocoles. Installez-vous.",
    "Entendu. Je prends le relais pour structurer votre demande. C'est parti.",
    "C'est noté. Je démarre l'orchestrateur. Initialisation en cours."
  ],
  PLAN: [
    "Voici le déroulé des opérations. Premièrement : j'analyse la structure de votre demande. Deuxièmement : je génère le contenu en alternant les modèles LLM pour préserver les tokens. Troisièmement : je calcule les coordonnées géographiques adéquates. Pour suivre les détails techniques, regardez les logs qui s'affichent à l'écran. Veuillez patienter.",
    "Je lance la séquence en trois phases. Phase 1 : Fragmentation de la demande. Phase 2 : Rédaction multi-agents pour éviter la saturation mémoire. Phase 3 : Recherche des points GPS sur la carte. Je vous invite à lire le terminal pour voir l'avancement précis. Merci de patienter quelques instants.",
    "Opération lancée. D'abord, j'extrais les concepts clés. Ensuite, je rote les modèles d'intelligence artificielle pour contourner la limite de tokens. Enfin, je définirai les lieux d'enquête géographiques. Les détails techniques défilent dans les logs, n'hésitez pas à les consulter. Je m'occupe de tout.",
    "Plan d'exécution activé. Un : Découpage du prompt. Deux : Génération sécurisée par blocs pour garantir l'intégrité des tokens. Trois : Identification des coordonnées géographiques pertinentes. Vous pouvez suivre chaque étape technique via les logs affichés. La procédure est en cours, veuillez patienter."
  ],
  GEO_TRIGGER: [
    "J'ai les données ! Je suis actuellement en train de placer les coordonnées GPS exactes sur la carte.",
    "Focus géographique : je finalise la triangulation des points d'enquête sur la zone.",
    "La couche cartographique est prête. J'injecte les localités détectées dans le rapport.",
    "Analyse spatiale terminée. Je verrouille les positions des lieux à visiter."
  ],
  SUCCESS_OUTRO: [
    "Génération terminée avec succès ! Tout est là : structure, questions et carte. Vous pouvez télécharger le résultat en Excel, C S V, ou pour Kobo Tools dès maintenant.",
    "Mission accomplie. Le système a tout généré. Les exports Excel, Google Forms et Kobo sont prêts dans le menu de droite.",
    "C'est tout bon. Le questionnaire et les lieux sont synchronisés. N'hésitez pas à exporter en Excel ou Kobo pour passer à l'action.",
    "Opération réussie. La puissance du multi-modèle a porté ses fruits. Vos fichiers d'export sont disponibles."
  ]
};

const getRandomPhrase = (category) => {
  const phrases = PHRASES[category];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

const SurveyGenerator = () => {
  // --- STATE ---
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Bonjour! Je suis Kaï-hwïnd. Décrivez votre enquête, je vais orchestrer la génération via nos modèles multi-LLM en parallèle.',
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
  
  // --- TTS STATE ---
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const isTtsEnabledRef = useRef(true); 
  
  const lastLogTimeRef = useRef(0);
  const hasSpokenGeoRef = useRef(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const minBottomHeight = useRef(150);
  const unsubscribersRef = useRef([]);

  const GREEN_COLOR = '#5DA781';

  // --- SYNC TTS REF ---
  useEffect(() => {
    isTtsEnabledRef.current = isTtsEnabled;
    if (!isTtsEnabled) window.speechSynthesis.cancel();
  }, [isTtsEnabled]);

  // --- MOTEUR VOCAL ---
  const speakText = (text, priority = 'NORMAL') => {
    if (!isTtsEnabledRef.current || !('speechSynthesis' in window)) return;

    if (priority === 'CRITICAL') {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.1; 
    utterance.pitch = 1.0; 

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      (v.name.includes('Google') && v.lang.includes('fr')) || 
      (v.name.includes('Français') && !v.name.includes('Compact'))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => window.speechSynthesis.cancel();
  }, []);

  // --- WEBSOCKET CONNECTION & LISTENERS ---
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await socketService.connectSocket();
        setConnected(true);
      } catch (err) {
        console.error('Erreur WS:', err);
        setConnected(false);
      }
    };

    initializeSocket();

    const unsubConnected = socketService.on('connected', () => {
      setConnected(true);
      addSystemMessage('✅ Système connecté');
    });

    const unsubDisconnected = socketService.on('disconnected', () => {
      setConnected(false);
      addSystemMessage('🔌 Système déconnecté');
    });

    const unsubProgress = socketService.on('progress', (data) => setProgress(data));

    // --- RECEPTION DES LOGS ---
    const unsubLog = socketService.on('log', (logData) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          role: 'server_log',
          text: logData.text,
          level: logData.level,
          timestamp: new Date(),
        },
      ]);

      // Logique TTS pour les logs
      if (isTtsEnabledRef.current) {
        const lowerText = logData.text.toLowerCase();
        const now = Date.now();

        if (now < lastLogTimeRef.current) return;

        if ((lowerText.includes('location') || lowerText.includes('gps') || lowerText.includes('coordin')) && !hasSpokenGeoRef.current) {
            hasSpokenGeoRef.current = true;
            speakText(getRandomPhrase('GEO_TRIGGER'), 'CRITICAL'); 
            lastLogTimeRef.current = now + 5000;
            return;
        }

        if (!window.speechSynthesis.speaking && (now - lastLogTimeRef.current > 3000)) {
             if (lowerText.includes('cleaning')) {
                 speakText("Nettoyage et structuration des données.", 'NORMAL');
                 lastLogTimeRef.current = now;
             }
        }
      }
    });

    // --- GESTION DU STREAMING PARALLÈLE (Le cœur de la modif) ---
    // On écoute l'événement générique 'message' pour capter les types custom du backend
    const unsubMessage = socketService.on('message', (msg) => {
        if (!msg || !msg.type) return;

        // 1. Initialisation de la structure (Métadonnées)
        if (msg.type === 'init_structure') {
            setSurveyData(msg.data); // Affiche le squelette immédiatement
        }
        // 2. Mise à jour des lieux
        else if (msg.type === 'update_locations') {
            setSurveyData(prev => {
                if(!prev) return { locations: msg.data };
                return { ...prev, locations: msg.data };
            });
        }
        // 3. Ajout progressif des catégories (Dès qu'un LLM a fini)
        else if (msg.type === 'append_categories') {
            setSurveyData(prev => {
                const currentCats = prev?.categories || [];
                // Fusion des nouvelles catégories
                const newCats = [...currentCats, ...msg.data];
                
                // Petit tri optionnel pour garder l'ordre logique si l'ID le permet, sinon on empile
                // newCats.sort((a, b) => (a.order || 0) - (b.order || 0));

                return { ...prev, categories: newCats };
            });
        }
    });

    // --- RÉSULTAT FINAL ---
    const unsubResult = socketService.on('result', (data) => {
      // On s'assure que tout est bien synchro à la fin
      setSurveyData(data);
      setIsLoading(false);
      setProgress(null);
      
      const nbCategories = data.categories?.length || 0;
      const nbLocations = data.locations?.length || 0;
      
      const outro = getRandomPhrase('SUCCESS_OUTRO');
      const stats = ` J'ai généré ${nbCategories} catégories et ${nbLocations} lieux.`;
      
      addSystemMessage('✅ Génération terminée !');
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now(), 
          role: 'assistant', 
          text: "Génération terminée. Résultat prêt au téléchargement.", 
          timestamp: new Date() 
        }
      ]);

      speakText(stats + " " + outro, 'CRITICAL');
    });

    const unsubError = socketService.on('error', (errData) => {
      setError(errData.message);
      setIsLoading(false);
      addSystemMessage(`❌ Erreur: ${errData.message}`);
      speakText("Alerte critique. Le processus a rencontré une erreur fatale.", 'CRITICAL');
    });

    unsubscribersRef.current = [
        unsubConnected, 
        unsubDisconnected, 
        unsubProgress, 
        unsubLog, 
        unsubMessage, // Ajout du listener custom
        unsubResult, 
        unsubError
    ];
    
    return () => unsubscribersRef.current.forEach((unsub) => unsub());
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);
  const addSystemMessage = (text) => setMessages((prev) => [...prev, { id: Date.now(), role: 'system', text, timestamp: new Date() }]);

  // --- ACTIONS ---
  const handleSendMessage = async (prompt) => {
    if (!connected) return;

    window.speechSynthesis.cancel();
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: prompt, timestamp: new Date() }]);
    setIsLoading(true);
    setSurveyData(null);
    setProgress(null);
    setError(null);
    hasSpokenGeoRef.current = false;

    // TTS SEQUENCE
    if(isTtsEnabledRef.current) {
        speakText(getRandomPhrase('START'), 'CRITICAL');
        speakText(getRandomPhrase('PLAN'), 'NORMAL');
        lastLogTimeRef.current = Date.now() + 17000; 
    }

    try {
      await socketService.sendMessage({ type: 'generate', prompt, language: 'fr' });
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!surveyData) return;
    const lastPrompt = [...messages].reverse().find(m => m.role === 'user')?.text;
    if (lastPrompt) handleSendMessage(lastPrompt);
  };
  
  const handleViewMap = () => {
    if (surveyData?.locations?.length > 0) setShowMap(true);
    else MySwal.fire({ icon: 'info', text: 'Pas de lieux disponibles' });
  };

  // UI Drag & Resize
  const handleMouseDown = (e) => { e.preventDefault(); setIsDragging(true); };
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const h = ((e.clientY - rect.top) / rect.height) * 100;
      const minP = (minBottomHeight.current / rect.height) * 100;
      if (h >= 20 && h <= (100 - minP)) setMessagesHeight(h);
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging]);
  useEffect(() => {
    if (!inputRef.current) return;
    const obs = new ResizeObserver(() => { minBottomHeight.current = inputRef.current.offsetHeight + 48; });
    obs.observe(inputRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-1 flex flex-col" ref={containerRef}>
        
        {/* Header Status */}
        <div className="bg-white border-b border-gray-300 px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-gray-600">{connected ? 'Connecté' : 'Déconnecté'}</span>
            </div>
            <button 
              onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              className={`flex items-center gap-1.5 transition-colors ${isTtsEnabled ? 'text-green-600 font-medium' : 'text-gray-400'}`}
              title="Activer/Désactiver la lecture vocale"
            >
              {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{isTtsEnabled ? 'Voix active' : 'Muet'}</span>
            </button>
          </div>
          {progress && (
            <div className="flex items-center gap-2">
              <Loader className="w-3 h-3 animate-spin" />
              <span className="text-gray-600">{progress.percentage}%</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="overflow-y-auto p-6 space-y-2 bg-gray-50" style={{ height: `${messagesHeight}%` }}>
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'user' ? (
                <div className="flex justify-end mb-4 mt-4">
                  <div className="max-w-md rounded-lg p-4 shadow-sm text-white" style={{ backgroundColor: GREEN_COLOR }}>
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ) : message.role === 'system' ? (
                <div className="flex justify-center mb-2 mt-2">
                  <div className="bg-gray-200 text-gray-600 rounded-full px-4 py-1 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>{message.text}</span>
                  </div>
                </div>
              ) : message.role === 'server_log' ? (
                <div className="flex justify-start px-2 animate-fade-in">
                  <div className="w-full max-w-4xl bg-[#1e1e1e] text-gray-300 rounded p-1.5 border-l-2 shadow-sm font-mono text-[10px] overflow-hidden"
                       style={{ 
                         borderLeftColor: message.level === 'ERROR' ? '#ef4444' : 
                                          message.level === 'WARNING' ? '#eab308' : '#22c55e',
                         opacity: 0.95
                       }}>
                    <div className="flex items-start gap-2">
                        <Terminal className="w-3 h-3 mt-0.5 text-gray-500 flex-shrink-0" />
                        <span className="whitespace-pre-wrap break-all leading-tight">{message.text}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start mb-4 mt-4">
                  <div className="max-w-2xl bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: GREEN_COLOR }}>
                        <span className="text-xs font-bold">KH</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 whitespace-pre-line">{message.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div onMouseDown={handleMouseDown} className="h-1 bg-gray-300 cursor-ns-resize hover:bg-blue-400" />

        {/* Input & Result */}
        <div className="flex-1 flex flex-col" style={{ height: `${100 - messagesHeight}%` }}>
          {surveyData && (
            <div className="bg-white p-6 overflow-y-auto flex-1 border-b border-gray-200">
              <SurveyGeneratorDisplay surveyData={surveyData} />
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button onClick={handleViewMap} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <MapPin className="w-4 h-4" /> Voir carte
                </button>
                <button onClick={handleRegenerate} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" /> Régénérer
                </button>
              </div>
            </div>
          )}
          <div className="bg-white p-6 flex-shrink-0" ref={inputRef}>
            <SurveyGeneratorInput onSendMessage={handleSendMessage} isLoading={isLoading} connected={connected} />
          </div>
        </div>
      </div>

      {surveyData && <SurveyExportSidebar data={surveyData} />}
      {showMap && surveyData && <SurveyGeneratorMap locations={surveyData.locations} onClose={() => setShowMap(false)} />}
    </div>
  );
};

export default SurveyGenerator;