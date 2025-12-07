import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Clock,
  Zap,
  HelpCircle,
} from 'lucide-react';

const SurveyGeneratorDisplay = ({ surveyData }) => {
  const [expandedCategory, setExpandedCategory] = useState(0);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const { metadata, categories, locations } = surveyData;

  const GREEN_COLOR = '#5DA781';

  const totalQuestions = categories.reduce(
    (sum, cat) => sum + cat.questions.length,
    0
  );

  const toggleQuestion = (qId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-4 rounded-lg border-2"
          style={{
            backgroundColor: '#f0f7f3',
            borderColor: GREEN_COLOR,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Durée estimée</p>
              <p className="text-lg font-semibold text-gray-800">
                {metadata.survey_total_duration}
              </p>
            </div>
            <Clock
              className="w-8 h-8 opacity-50"
              style={{ color: GREEN_COLOR }}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Répondants</p>
              <p className="text-lg font-semibold text-gray-800">
                {metadata.number_of_respondents}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Enquêteurs</p>
              <p className="text-lg font-semibold text-gray-800">
                {metadata.number_of_investigators}
              </p>
            </div>
            <Zap className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Localités</p>
              <p className="text-lg font-semibold text-gray-800">
                {metadata.number_of_locations}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-orange-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Objectif de l'enquête
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          {metadata.survey_objective}
        </p>
        <p className="text-xs text-gray-600 mt-4">
          <span className="font-medium">Audience cible:</span>{' '}
          {metadata.target_audience}
        </p>
        <p className="text-xs text-gray-600 mt-2">
          <span className="font-medium">Caractéristiques des lieux:</span>{' '}
          {metadata.location_characteristics}
        </p>
      </div>

      {/* Questions Statistics */}
      <div
        className="border-2 rounded-lg p-4"
        style={{
          backgroundColor: '#f0f7f3',
          borderColor: GREEN_COLOR,
        }}
      >
        <p className="text-sm text-gray-800">
          <span className="font-semibold">{totalQuestions}</span> questions
          réparties dans{' '}
          <span className="font-semibold">{categories.length}</span> catégories
        </p>
      </div>

      {/* Survey Categories */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Questions</h2>

        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === categoryIndex ? -1 : categoryIndex
                )
              }
              className="w-full bg-gray-50 hover:bg-gray-100 px-6 py-4 flex items-center justify-between transition-colors duration-200 border-b border-gray-200"
            >
              <div className="text-left">
                <h3 className="text-sm font-semibold text-gray-900">
                  {category.category_name}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {category.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded border border-gray-300">
                  {category.questions.length} Q
                </span>
                {expandedCategory === categoryIndex ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* Category Questions */}
            {expandedCategory === categoryIndex && (
              <div className="divide-y divide-gray-200 bg-white">
                {category.questions.map((question, qIndex) => (
                  <div key={qIndex} className="p-4 hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => toggleQuestion(question.question_id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-xs font-semibold px-2 py-1 rounded text-white"
                              style={{ backgroundColor: GREEN_COLOR }}
                            >
                              {question.question_id}
                            </span>
                            <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-700">
                              {question.question_type}
                            </span>
                            {question.is_required ? (
                              <span className="text-xs font-medium text-red-600">
                                Obligatoire
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">
                                Optionnel
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {question.question_text}
                          </p>
                          {question.help_text && (
                            <div className="mt-2 flex items-start gap-2">
                              <HelpCircle className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-gray-600 italic">
                                {question.help_text}
                              </p>
                            </div>
                          )}
                        </div>
                        {expandedQuestions[question.question_id] ? (
                          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Expected Answers */}
                    {expandedQuestions[question.question_id] &&
                      question.expected_answers &&
                      question.expected_answers.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-300 space-y-2">
                          <p className="text-xs font-semibold text-gray-600">
                            Réponses possibles:
                          </p>
                          {question.expected_answers.map((answer, aIdx) => (
                            <div
                              key={aIdx}
                              className="text-xs bg-gray-100 p-2 rounded flex items-start gap-2"
                            >
                              <span
                                className="font-semibold text-white px-1.5 py-0.5 rounded text-xs"
                                style={{ backgroundColor: GREEN_COLOR }}
                              >
                                {answer.answer_id}
                              </span>
                              <span className="text-gray-800">
                                {answer.answer_text}
                              </span>
                              {answer.next_question_id && (
                                <span className="text-gray-500 ml-auto">
                                  → {answer.next_question_id}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Locations Info */}
      {locations && locations.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin
              className="w-5 h-5"
              style={{ color: GREEN_COLOR }}
            />
            Lieux d'enquête ({locations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location, idx) => (
              <div
                key={idx}
                className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <p className="font-semibold text-gray-900">{location.name}</p>
                <p className="text-xs text-gray-600 mt-1">📍 {location.pcode}</p>
                <p className="text-xs text-gray-600">
                  {location.adm2}, {location.adm1}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyGeneratorDisplay;