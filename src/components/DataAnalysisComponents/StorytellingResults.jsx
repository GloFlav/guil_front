/**
 * 📖 STORYTELLING RESULTS COMPONENT V2
 * Phases 7-8: Affichage des insights, recommandations, TTS et export PDF
 */

import React, { useState } from 'react';
import { 
  Lightbulb, Target, FileText, Volume2, VolumeX, Download, 
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock,
  TrendingUp, BarChart3, ArrowRight, Play, Pause,
  FileDown, Printer
} from 'lucide-react';

// ==================== INSIGHT CARD COMPONENT ====================
const InsightCard = ({ insight, index }) => {
  const [expanded, setExpanded] = useState(false);
  
  const priorityConfig = {
    haute: { bg: 'bg-red-50', border: 'border-red-400', badge: 'bg-red-500', text: 'text-red-700' },
    moyenne: { bg: 'bg-amber-50', border: 'border-amber-400', badge: 'bg-amber-500', text: 'text-amber-700' },
    basse: { bg: 'bg-green-50', border: 'border-green-400', badge: 'bg-green-500', text: 'text-green-700' }
  };
  
  const config = priorityConfig[insight.priority] || priorityConfig.moyenne;
  
  return (
    <div className={`${config.bg} border-l-4 ${config.border} rounded-lg p-4 mb-4 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">{insight.icon || '💡'}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-800">
                {insight.title || insight.category}
              </h4>
              <span className={`${config.badge} text-white text-xs px-2 py-0.5 rounded-full`}>
                {insight.priority?.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-700 mb-2">{insight.finding}</p>
            {insight.metric && (
              <p className="text-sm text-gray-500 mb-2">
                <strong>Métrique:</strong> {insight.metric}
              </p>
            )}
            <p className={`${config.text} text-sm italic`}>
              💼 {insight.so_what}
            </p>
            
            {expanded && insight.details && insight.details.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-2">Caractéristiques:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {insight.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3" />
                      <span>{detail.variable}: {detail.direction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {insight.details && insight.details.length > 0 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
};

// ==================== RECOMMENDATION CARD COMPONENT ====================
const RecommendationCard = ({ recommendation, onPlayTTS }) => {
  const [expanded, setExpanded] = useState(false);
  
  const priorityConfig = {
    haute: { bg: 'bg-gradient-to-r from-red-500 to-red-600', ring: 'ring-red-200' },
    moyenne: { bg: 'bg-gradient-to-r from-amber-500 to-amber-600', ring: 'ring-amber-200' },
    basse: { bg: 'bg-gradient-to-r from-green-500 to-green-600', ring: 'ring-green-200' }
  };
  
  const config = priorityConfig[recommendation.priority] || priorityConfig.moyenne;
  
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden mb-4 hover:shadow-lg transition-all duration-200 ring-2 ${config.ring}`}>
      {/* Header */}
      <div className={`${config.bg} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
              {recommendation.id}
            </div>
            <div>
              <h4 className="font-bold text-lg">{recommendation.title}</h4>
              <p className="text-white/80 text-sm">{recommendation.category}</p>
            </div>
          </div>
          <button 
            onClick={() => onPlayTTS && onPlayTTS(recommendation.tts_text)}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
            title="Écouter"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-4">
        {/* Metrics */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Impact: {recommendation.impact}%
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            Effort: {recommendation.effort}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {recommendation.timeline}
          </span>
        </div>
        
        {/* Description */}
        <p className="text-gray-700 mb-3">{recommendation.description}</p>
        
        {/* Rationale */}
        {recommendation.rationale && (
          <p className="text-gray-500 text-sm mb-4 italic">
            <strong>Justification:</strong> {recommendation.rationale}
          </p>
        )}
        
        {/* Toggle Actions */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Masquer les actions
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Voir les actions ({recommendation.actions?.length || 0})
            </>
          )}
        </button>
        
        {/* Expanded Actions */}
        {expanded && (
          <div className="mt-4 pt-4 border-t">
            <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Actions concrètes
            </h5>
            <div className="space-y-3">
              {recommendation.actions?.map((action, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {action.step}
                  </span>
                  <div>
                    <p className="text-gray-700">{action.action}</p>
                    <p className="text-sm text-gray-500">Responsable: {action.responsible}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* KPIs */}
            {recommendation.kpis && recommendation.kpis.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  KPIs de suivi
                </h5>
                <div className="flex flex-wrap gap-2">
                  {recommendation.kpis.map((kpi, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm">
                      {kpi}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Risks */}
            {recommendation.risks && recommendation.risks.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Points de vigilance
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recommendation.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500">⚠️</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== TTS PLAYER COMPONENT ====================
const TTSPlayer = ({ text, sections }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  
  const speak = (textToSpeak, sectionId = null) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentSection(sectionId);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentSection(null);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentSection(null);
    }
  };
  
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Narration Audio</h3>
            <p className="text-white/70 text-sm">Écoutez le résumé</p>
          </div>
        </div>
        
        <button
          onClick={isPlaying ? stop : () => speak(text, 'all')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5" />
              Arrêter
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Écouter
            </>
          )}
        </button>
      </div>
      
      {sections && sections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sections.slice(0, 6).map((section) => (
            <button
              key={section.id}
              onClick={() => speak(section.text, section.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                currentSection === section.id 
                  ? 'bg-white text-indigo-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== EXPORT BUTTONS COMPONENT ====================
const ExportButtons = ({ exports }) => {
  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handlePrint = () => {
    if (exports?.html) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(exports.html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-5 mb-6">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileDown className="w-5 h-5 text-blue-500" />
        Exporter le Rapport (Phase 8)
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => exports?.html && downloadFile(exports.html, 'rapport.html', 'text/html')}
          disabled={!exports?.html}
          className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
        >
          <FileText className="w-8 h-8 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">HTML</span>
        </button>
        
        <button
          onClick={() => exports?.markdown && downloadFile(exports.markdown, 'rapport.md', 'text/markdown')}
          disabled={!exports?.markdown}
          className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition disabled:opacity-50"
        >
          <FileText className="w-8 h-8 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Markdown</span>
        </button>
        
        <button
          onClick={handlePrint}
          disabled={!exports?.html}
          className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
        >
          <Printer className="w-8 h-8 text-green-600" />
          <span className="text-sm font-medium text-green-700">Imprimer</span>
        </button>
        
        <button
          onClick={handlePrint}
          disabled={!exports?.html}
          className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
        >
          <Download className="w-8 h-8 text-red-600" />
          <span className="text-sm font-medium text-red-700">PDF</span>
        </button>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const StorytellingResults = ({ data }) => {
  const [activeTab, setActiveTab] = useState('insights');
  
  const insights = data?.insights || [];
  const recommendations = data?.recommendations || [];
  const story = data?.story || {};
  const exports = data?.exports || {};
  const ttsText = data?.tts_text || '';
  const ttsSections = data?.tts_sections || [];
  
  const highPriorityInsights = insights.filter(i => i.priority === 'haute').length;
  const highPriorityRecs = recommendations.filter(r => r.priority === 'haute').length;
  
  const handlePlayTTS = (text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  if (!data || (insights.length === 0 && recommendations.length === 0)) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="font-semibold text-amber-800 mb-2">Données insuffisantes</h3>
        <p className="text-amber-600">
          Aucun insight ou recommandation n'a été généré.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Phases 7-8: Storytelling & Décisions
        </h2>
        <p className="text-white/80 mb-4">{story.executive_summary || ''}</p>
        
        <div className="flex flex-wrap gap-4">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <span className="text-2xl font-bold">{insights.length}</span>
            <span className="ml-2 text-white/80">insights</span>
            {highPriorityInsights > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {highPriorityInsights} prioritaires
              </span>
            )}
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <span className="text-2xl font-bold">{recommendations.length}</span>
            <span className="ml-2 text-white/80">décisions</span>
            {highPriorityRecs > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {highPriorityRecs} urgentes
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* TTS Player */}
      {ttsText && <TTSPlayer text={ttsText} sections={ttsSections} />}
      
      {/* Export Buttons */}
      {exports && (exports.html || exports.markdown) && <ExportButtons exports={exports} />}
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === 'insights' 
              ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lightbulb className="w-4 h-4 inline mr-2" />
          Insights ({insights.length})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === 'recommendations' 
              ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Décisions ({recommendations.length})
        </button>
      </div>
      
      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'insights' && (
          <div>
            <p className="text-gray-600 mb-4">
              🎯 <strong>Phase 7.2:</strong> Synthèse des insights clés - "So what?" 
            </p>
            {insights.map((insight, index) => (
              <InsightCard key={insight.id || index} insight={insight} index={index} />
            ))}
          </div>
        )}
        
        {activeTab === 'recommendations' && (
          <div>
            <p className="text-gray-600 mb-4">
              🎯 <strong>Phase 7.5:</strong> Recommandations actionnables avec actions concrètes
            </p>
            {recommendations.map((rec, index) => (
              <RecommendationCard 
                key={rec.id || index} 
                recommendation={rec} 
                onPlayTTS={handlePlayTTS}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Methodology */}
      <div className="bg-gray-50 rounded-xl p-5">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          Méthodologie Phases 7-8
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium mb-2">Phase 7: Interprétation & Storytelling</p>
            <ul className="space-y-1 ml-4">
              <li>41. Interprétation des résultats (variables clés)</li>
              <li>42. Synthèse des insights ("So what?")</li>
              <li>43. Création de supports visuels</li>
              <li>44. Data Storytelling (récit logique)</li>
              <li>45. Recommandations actionnables</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Phase 8: Restitution & Communication</p>
            <ul className="space-y-1 ml-4">
              <li>46. Rapport d'analyse documenté</li>
              <li>47. Présentation orale (TTS)</li>
              <li>48. Documentation technique</li>
              <li>49. Données nettoyées disponibles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorytellingResults;