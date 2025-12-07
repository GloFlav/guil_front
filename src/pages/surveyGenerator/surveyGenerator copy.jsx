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
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [minBottomHeight, setMinBottomHeight] = useState(150);

  const GREEN_COLOR = '#5DA781';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      // Calculer la hauteur minimale disponible (en pourcentage)
      const minPercentage = (minBottomHeight / containerRect.height) * 100;

      // Limiter la hauteur des messages
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
  }, [isDragging, minBottomHeight]);

  const generateRandomLocations = () => {
    const baseLatitude = -21.4557;
    const baseLongitude = 47.2901;
    const radius = 0.3;

    const locations = [];
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;

      locations.push({
        id: i + 1,
        name: `Zone d'enquête ${i + 1}`,
        latitude: baseLatitude + distance * Math.cos(angle),
        longitude: baseLongitude + distance * Math.sin(angle),
        pcode: `FIAR-${String(i + 1).padStart(3, '0')}`,
        adm2: 'Fianarantsoa II',
        adm1: 'Fianarantsoa',
      });
    }

    return locations;
  };

  const generateMockSurvey = () => {
    return {
      metadata: {
        survey_title: 'Enquête Communautaire 2024',
        survey_objective: 'Cette enquête vise à collecter des informations détaillées sur les besoins et les défis de la communauté locale.',
        target_audience: 'Chefs de ménage et responsables communautaires',
        location_characteristics: 'Zones rurales et semi-urbaines',
        survey_total_duration: '45-60 minutes',
        number_of_respondents: 250,
        number_of_investigators: 15,
        number_of_locations: 3,
      },
      categories: [
        {
          category_name: 'Informations Démographiques',
          description: 'Questions concernant les caractéristiques personnelles',
          questions: [
            {
              question_id: 'Q1',
              question_text: 'Quel est votre âge?',
              question_type: 'Numérique',
              is_required: true,
              help_text: 'Entrez votre âge en années',
              expected_answers: [
                { answer_id: 'A1', answer_text: '18-30 ans' },
                { answer_id: 'A2', answer_text: '31-50 ans' },
                { answer_id: 'A3', answer_text: '+50 ans' },
              ],
            },
            {
              question_id: 'Q2',
              question_text: 'Quel est votre niveau d\'éducation?',
              question_type: 'Choix multiple',
              is_required: true,
              expected_answers: [
                { answer_id: 'A1', answer_text: 'Primaire' },
                { answer_id: 'A2', answer_text: 'Secondaire' },
                { answer_id: 'A3', answer_text: 'Supérieur' },
                { answer_id: 'A4', answer_text: 'Sans éducation' },
              ],
            },
          ],
        },
        {
          category_name: 'Conditions de Vie',
          description: 'Questions sur le logement et les conditions sanitaires',
          questions: [
            {
              question_id: 'Q3',
              question_text: 'Quel type d\'eau utilisez-vous pour boire?',
              question_type: 'Choix unique',
              is_required: true,
              expected_answers: [
                { answer_id: 'A1', answer_text: 'Eau courante' },
                { answer_id: 'A2', answer_text: 'Puits' },
                { answer_id: 'A3', answer_text: 'Source' },
                { answer_id: 'A4', answer_text: 'Eau de pluie' },
              ],
            },
            {
              question_id: 'Q4',
              question_text: 'Disposez-vous d\'une installation sanitaire?',
              question_type: 'Oui/Non',
              is_required: true,
              expected_answers: [
                { answer_id: 'A1', answer_text: 'Oui' },
                { answer_id: 'A2', answer_text: 'Non' },
              ],
            },
          ],
        },
        {
          category_name: 'Activités Économiques',
          description: 'Questions sur l\'emploi et les revenus',
          questions: [
            {
              question_id: 'Q5',
              question_text: 'Quel est votre secteur d\'activité principal?',
              question_type: 'Choix multiple',
              is_required: false,
              expected_answers: [
                { answer_id: 'A1', answer_text: 'Agriculture' },
                { answer_id: 'A2', answer_text: 'Commerce' },
                { answer_id: 'A3', answer_text: 'Artisanat' },
                { answer_id: 'A4', answer_text: 'Service' },
              ],
            },
          ],
        },
      ],
      locations: generateRandomLocations(),
    };
  };

  const handleSendMessage = (prompt) => {
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

    setTimeout(() => {
      const mockSurvey = generateMockSurvey();
      setSurveyData(mockSurvey);

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'assistant',
          text: '✅ Questionnaire généré avec succès! J\'ai créé une enquête adaptée à vos besoins.',
          timestamp: new Date(),
        },
      ]);

      setIsLoading(false);
    }, 1500);
  };

  const handleRegenerate = () => {
    const newSurvey = generateMockSurvey();
    setSurveyData(newSurvey);

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        role: 'assistant',
        text: '🔄 Questionnaire régénéré avec succès!',
        timestamp: new Date(),
      },
    ]);
  };

  const handleViewMap = () => {
    if (surveyData?.locations && surveyData.locations.length > 0) {
      setShowMap(true);
    }
  };

  // Observer la hauteur du champ de saisie
  useEffect(() => {
    if (!inputRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Ajouter padding et margins (24px padding haut/bas + 24px pour les autres éléments)
      const inputHeight = inputRef.current.offsetHeight + 48;
      setMinBottomHeight(inputHeight);
    });

    resizeObserver.observe(inputRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen bg-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col" ref={containerRef}>
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
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Régénérer
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-white p-6 flex-shrink-0" ref={inputRef}>
            <SurveyGeneratorInput onSendMessage={handleSendMessage} isLoading={isLoading} />
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