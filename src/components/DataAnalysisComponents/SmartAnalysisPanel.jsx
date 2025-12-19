/**
 * 🧠 SMART ANALYSIS PANEL V4 - AVEC EXPLICATIONS LLM INTÉGRÉES
 * Phases 5-8: Feature Engineering, ML, Storytelling & Décisions
 * 
 * AMÉLIORATIONS:
 * ✅ Explications LLM intelligentes
 * ✅ Recommandations avec code copiable
 * ✅ Score de santé du modèle
 * ✅ Diagnostic détaillé
 * ✅ TTS pour écouter l'analyse
 */

import React, { useState } from 'react';
import {
  Sparkles, Zap, Brain, FileText, TrendingUp, Target, AlertTriangle,
  CheckCircle, Loader, ChevronDown, ChevronUp, Volume2,
  Download, BarChart3, GitMerge, Award, Lightbulb, BookOpen,
  Play, Pause, ArrowRight, Layers, Cpu, Clock, Printer,
  AlertCircle, Info, Shield, Activity, Copy, Check, Code
} from 'lucide-react';

// ============================================================================
// 🎨 CONSTANTES & COULEURS
// ============================================================================
const PHASE_COLORS = {
  feature_engineering: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
  ml_pipeline: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
  storytelling: { bg: 'bg-gradient-to-r from-indigo-50 to-purple-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-600' },
};

const PRIORITY_COLORS = {
  haute: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  moyenne: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  basse: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' }
};

// 🔧 DICTIONNAIRE DE TRADUCTION MALGACHE → FRANÇAIS
const VARIABLE_TRANSLATIONS = {
  "Inona no jiro ampiasainar...": "Source d'énergie principale",
  "Aiza no maka rano fisotro...": "Source d'eau potable",
  "Inona no amplasaina rehel...": "Équipement utilisé",
  "Taona nanamboarana": "Année de construction",
  "Loharano": "Source",
  "Faritra": "Région",
  "Fari-piadidian": "District",
  "Kaominina": "Commune",
  "Fokontany": "Village",
  "Laharana": "Numéro",
  "Toerana": "Localisation",
  "Karazana": "Type",
  "Vola": "Prix/Coût",
  "Isan'ny olona": "Nombre de personnes",
  "Fahasalamana": "État de santé",
  "Fampiasana": "Utilisation",
  "Faharetana": "Durée",
  "Tantara": "Historique",
  "Mpiasa": "Employé",
  "Mpampiasa": "Utilisateur"
};

// ============================================================================
// 📊 HEALTH SCORE GAUGE - JAUGE DE SANTÉ DU MODÈLE
// ============================================================================
const HealthScoreGauge = ({ score, status }) => {
  const colors = {
    bon: { text: 'text-green-600', bg: 'bg-green-500', light: 'bg-green-50' },
    modéré: { text: 'text-amber-600', bg: 'bg-amber-500', light: 'bg-amber-50' },
    critique: { text: 'text-red-600', bg: 'bg-red-500', light: 'bg-red-50' }
  };
  const color = colors[status] || colors.modéré;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
          <circle
            cx="48" cy="48" r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={color.text}
            style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold ${color.text}`}>{score}</span>
          <span className="text-[10px] text-gray-500">/100</span>
        </div>
      </div>
      <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color.bg} text-white`}>
        {status?.toUpperCase()}
      </span>
    </div>
  );
};

// ============================================================================
// ✅ DIAGNOSTIC CHECK - POINT DE CONTRÔLE
// ============================================================================
const DiagnosticCheck = ({ check }) => {
  const config = {
    ok: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
  }[check.status] || { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50' };
  
  const Icon = config.icon;
  
  return (
    <div className={`p-2.5 rounded-lg ${config.bg} flex items-start gap-2`}>
      <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-800">{check.name}</span>
          <span className={`text-xs font-bold ${config.color}`}>{check.value}</span>
        </div>
        <p className="text-[10px] text-gray-600 mt-0.5">{check.message}</p>
      </div>
    </div>
  );
};

// ============================================================================
// 💡 RECOMMENDATION CARD - CARTE DE RECOMMANDATION AVEC CODE
// ============================================================================
const RecommendationCard = ({ rec, isExpanded, onToggle }) => {
  const [copiedCode, setCopiedCode] = useState(null);
  const colors = PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.moyenne;
  
  const copyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(idx);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  return (
    <div className={`rounded-lg overflow-hidden border ${colors.border} ${colors.bg}`}>
      <button onClick={onToggle} className="w-full p-3 flex items-center justify-between hover:bg-white/50 transition">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            rec.priority === 'haute' ? 'bg-red-500' : rec.priority === 'moyenne' ? 'bg-amber-500' : 'bg-green-500'
          }`}>
            {rec.id}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{rec.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${colors.badge}`}>
                {rec.priority?.toUpperCase()}
              </span>
              <span className="text-[9px] text-gray-500">{rec.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />{rec.timeline}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-xs text-gray-700">{rec.description}</p>
          
          <div className="flex gap-2">
            <div className="flex-1 p-2 bg-white rounded border border-gray-100">
              <p className="text-[9px] text-gray-500 uppercase">Impact</p>
              <p className="text-[10px] font-medium text-green-700">{rec.expected_impact}</p>
            </div>
            <div className="flex-1 p-2 bg-white rounded border border-gray-100">
              <p className="text-[9px] text-gray-500 uppercase">Effort</p>
              <p className="text-[10px] font-medium text-blue-700">{rec.effort}</p>
            </div>
          </div>
          
          {rec.actions?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />Actions concrètes
              </p>
              {rec.actions.map((action, idx) => (
                <div key={idx} className="bg-white rounded border border-gray-100 p-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {action.step}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800">{action.action}</p>
                      {action.code && (
                        <div className="mt-1.5 relative">
                          <div className="bg-gray-900 rounded p-2 overflow-x-auto">
                            <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap">{action.code}</pre>
                          </div>
                          <button
                            onClick={() => copyCode(action.code, idx)}
                            className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                            title="Copier le code"
                          >
                            {copiedCode === idx ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 🔴 OVERFITTING ALERT - ALERTE D'OVERFITTING
// ============================================================================
const OverfittingAlert = ({ analysis }) => {
  if (!analysis?.detected) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-800 flex items-center gap-2">
            Overfitting Détecté
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              analysis.severity === 'élevée' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
            }`}>
              Sévérité {analysis.severity}
            </span>
          </p>
          {analysis.causes?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {analysis.causes.map((cause, idx) => (
                <li key={idx} className="text-[11px] text-red-700 flex items-start gap-1">
                  <span className="text-red-400">•</span>{cause}
                </li>
              ))}
            </ul>
          )}
          {analysis.impact && (
            <p className="text-[11px] text-red-600 mt-2 pt-2 border-t border-red-200">
              <strong>Impact:</strong> {analysis.impact}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 🧠 LLM EXPLANATION PANEL - PANNEAU D'EXPLICATION INTELLIGENT
// ============================================================================
const LLMExplanationPanel = ({ llmExplanation }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedRec, setExpandedRec] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  if (!llmExplanation?.success) return null;
  
  const { explanation, recommendations, diagnostic, tts_text } = llmExplanation;
  
  const speak = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
  
  const highPriorityCount = recommendations?.filter(r => r.priority === 'haute').length || 0;
  
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">Analyse Intelligente</h4>
              <p className="text-[10px] text-white/80">
                {explanation?.model_selected} • {explanation?.problem_type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
              diagnostic?.health_status === 'bon' ? 'bg-green-400 text-green-900' :
              diagnostic?.health_status === 'modéré' ? 'bg-amber-400 text-amber-900' :
              'bg-red-400 text-red-900'
            }`}>
              Score: {diagnostic?.health_score}/100
            </span>
            {tts_text && (
              <button onClick={() => speak(tts_text)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition">
                {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
        {highPriorityCount > 0 && (
          <div className="mt-2 flex items-center gap-2 bg-red-500/30 px-2 py-1 rounded">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[11px]">{highPriorityCount} action{highPriorityCount > 1 ? 's' : ''} prioritaire{highPriorityCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {[
          { id: 'summary', label: 'Résumé', icon: Info },
          { id: 'diagnostic', label: 'Diagnostic', icon: Activity },
          { id: 'actions', label: `Actions (${recommendations?.length || 0})`, icon: Lightbulb }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition ${
              activeTab === tab.id ? 'text-indigo-700 border-b-2 border-indigo-500 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {/* Summary Tab */}
        {activeTab === 'summary' && explanation && (
          <div className="space-y-3">
            {/* Summary Text */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div 
                className="text-xs text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: explanation.summary?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
            </div>
            
            {/* Confidence */}
            <div className={`flex items-center gap-2 p-2 rounded-lg ${
              explanation.confidence_level === 'élevé' ? 'bg-green-50 border border-green-200' :
              explanation.confidence_level === 'modéré' ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <Shield className={`w-4 h-4 ${
                explanation.confidence_level === 'élevé' ? 'text-green-600' :
                explanation.confidence_level === 'modéré' ? 'text-amber-600' : 'text-red-600'
              }`} />
              <div>
                <p className="text-xs font-medium text-gray-800">Confiance: {explanation.confidence_level}</p>
                <p className="text-[10px] text-gray-600">
                  {explanation.confidence_level === 'élevé' ? 'Prêt pour la production' :
                   explanation.confidence_level === 'modéré' ? 'Optimisations recommandées' : 'Corrections nécessaires'}
                </p>
              </div>
            </div>
            
            {/* Metrics */}
            {explanation.metrics_analysis && (
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-[10px] font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-blue-500" />Performances
                </p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-sm font-bold text-blue-700">{explanation.metrics_analysis.train_accuracy}</p>
                    <p className="text-[9px] text-gray-500">Train</p>
                  </div>
                  <div className="text-center p-2 bg-amber-50 rounded">
                    <p className="text-sm font-bold text-amber-700">{explanation.metrics_analysis.validation_accuracy}</p>
                    <p className="text-[9px] text-gray-500">Validation</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-sm font-bold text-green-700">{explanation.metrics_analysis.test_accuracy}</p>
                    <p className="text-[9px] text-gray-500">Test</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 italic">{explanation.metrics_analysis.interpretation}</p>
              </div>
            )}
            
            {/* Data Quality */}
            {explanation.data_quality && (
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-[10px] font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <Target className="w-3 h-3 text-purple-500" />Qualité des Données
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-1.5 bg-gray-50 rounded">
                    <p className="text-sm font-bold text-gray-800">{explanation.data_quality.features}</p>
                    <p className="text-[8px] text-gray-500">Features</p>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 rounded">
                    <p className="text-sm font-bold text-gray-800">{explanation.data_quality.samples_train}</p>
                    <p className="text-[8px] text-gray-500">Train</p>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 rounded">
                    <p className="text-sm font-bold text-gray-800">{explanation.data_quality.samples_test}</p>
                    <p className="text-[8px] text-gray-500">Test</p>
                  </div>
                  <div className={`text-center p-1.5 rounded ${
                    explanation.data_quality.ratio_status === 'critique' ? 'bg-red-100' :
                    explanation.data_quality.ratio_status === 'élevé' ? 'bg-amber-100' : 'bg-green-100'
                  }`}>
                    <p className={`text-sm font-bold ${
                      explanation.data_quality.ratio_status === 'critique' ? 'text-red-700' :
                      explanation.data_quality.ratio_status === 'élevé' ? 'text-amber-700' : 'text-green-700'
                    }`}>{explanation.data_quality.ratio}</p>
                    <p className="text-[8px] text-gray-500">Ratio</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mt-2 italic">{explanation.data_quality.interpretation}</p>
              </div>
            )}
            
            {/* Overfitting Alert */}
            <OverfittingAlert analysis={explanation.overfitting_analysis} />
          </div>
        )}
        
        {/* Diagnostic Tab */}
        {activeTab === 'diagnostic' && diagnostic && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
              <HealthScoreGauge score={diagnostic.health_score} status={diagnostic.health_status} />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Score de Santé du Modèle</p>
                <p className="text-xs text-gray-600 mt-1">{diagnostic.summary}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />Points de Contrôle
              </p>
              {diagnostic.checks?.map((check, idx) => (
                <DiagnosticCheck key={idx} check={check} />
              ))}
            </div>
          </div>
        )}
        
        {/* Actions Tab */}
        {activeTab === 'actions' && recommendations && (
          <div className="space-y-2">
            {recommendations.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p className="text-sm font-medium">Aucune action requise</p>
              </div>
            ) : (
              recommendations.map((rec, idx) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  isExpanded={expandedRec === idx}
                  onToggle={() => setExpandedRec(expandedRec === idx ? null : idx)}
                />
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[9px] text-gray-400">
          Généré le {llmExplanation.generated_at ? new Date(llmExplanation.generated_at).toLocaleString('fr-FR') : 'N/A'}
        </p>
        <div className="flex items-center gap-1 text-[9px] text-gray-400">
          <Brain className="w-3 h-3" />Smart Analytics
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 🔧 FEATURE ENGINEERING RESULTS
// ============================================================================
const FeatureEngineeringResults = ({ data, isExpanded, onToggle }) => {
  if (!data) return null;

  const transformations = data.transformations || {};
  const featureSummary = data.feature_summary || {};
  const recommendations = data.recommendations || [];

  const temporalFeatures = [];
  if (transformations.temporal && Array.isArray(transformations.temporal)) {
    transformations.temporal.forEach(t => {
      if (t.features_created) temporalFeatures.push(...t.features_created);
    });
  }

  const interactionFeatures = [];
  if (transformations.interactions && Array.isArray(transformations.interactions)) {
    transformations.interactions.forEach(i => {
      if (i.features_created) interactionFeatures.push(...i.features_created);
    });
  }

  const totalFeaturesCreated = featureSummary.features_created || 0;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${PHASE_COLORS.feature_engineering.border} ${PHASE_COLORS.feature_engineering.bg}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Layers className={`w-5 h-5 ${PHASE_COLORS.feature_engineering.icon}`} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">Phase 5: Feature Engineering</h3>
            <p className="text-xs text-gray-600">
              {totalFeaturesCreated} nouvelles features créées
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
            +{totalFeaturesCreated} features
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {temporalFeatures.length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Features Temporelles ({temporalFeatures.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {temporalFeatures.slice(0, 10).map((feat, idx) => (
                  <span key={idx} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {interactionFeatures.length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Features d'Interaction ({interactionFeatures.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {interactionFeatures.slice(0, 8).map((feat, idx) => (
                  <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <h4 className="text-xs font-bold text-green-800 mb-2">Recommandations</h4>
              <ul className="space-y-1">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx} className="text-[10px] text-green-700 flex items-start gap-1">
                    <span>•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 🤖 ML PIPELINE RESULTS - AVEC EXPLICATIONS LLM
// ============================================================================
const MLPipelineResults = ({ data, isExpanded, onToggle }) => {
  const [showLLMExplanation, setShowLLMExplanation] = useState(true);
  
  if (!data) return null;

  const problemType = data.problem_type || 'unknown';
  const bestModel = data.best_model || null;
  const modelsTrained = data.models_trained || {};
  const featureImportance = data.feature_importance || {};
  const dataSummary = data.data_summary || {};
  const warnings = data.warnings || [];
  const llmExplanation = data.llm_explanation || null;
  const testMetrics = data.test_metrics || {};

  // Fonction de traduction
  const translateVariable = (name) => {
    if (!name) return 'Variable inconnue';
    if (VARIABLE_TRANSLATIONS[name]) return VARIABLE_TRANSLATIONS[name];
    for (const [key, translation] of Object.entries(VARIABLE_TRANSLATIONS)) {
      if (name.includes(key) || key.includes(name)) return translation;
    }
    return name;
  };

  // Statistiques
  const trainSize = dataSummary.train_size || 1;
  const featureCount = dataSummary.total_features || 0;
  const ratioFeaturesToTrain = featureCount / trainSize;
  const isHighDimensionality = ratioFeaturesToTrain > 0.2;

  const mlSuccess = bestModel && bestModel.name;
  const hasOverfitting = data.overfitting_detected || (mlSuccess && bestModel.score === 1);

  const getProblemTypeLabel = (type) => {
    const labels = {
      'binary_classification': '🎯 Classification Binaire',
      'multiclass_classification': '🎯 Classification Multi-classe',
      'regression': '📈 Régression',
      'clustering': '🔮 Clustering'
    };
    return labels[type] || type;
  };

  // Extraire les modèles
  const allModels = Object.entries(modelsTrained).map(([name, info]) => {
    let score = 0;
    if (info?.val_metrics) {
      if (problemType === 'regression') {
        score = info.val_metrics.r2 || 0;
      } else {
        score = info.val_metrics.f1 || info.val_metrics.accuracy || 0;
      }
    }
    return { name, score, metrics: info?.val_metrics || {} };
  }).sort((a, b) => b.score - a.score);

  const featureImportanceArray = featureImportance.top_features || [];

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${PHASE_COLORS.ml_pipeline.border} ${PHASE_COLORS.ml_pipeline.bg}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Cpu className={`w-5 h-5 ${PHASE_COLORS.ml_pipeline.icon}`} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">Phase 6: Machine Learning</h3>
            <p className="text-xs text-gray-600">
              {mlSuccess ? `${getProblemTypeLabel(problemType)} • Meilleur: ${bestModel.name}` : 'En attente'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mlSuccess && bestModel.score != null && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              hasOverfitting ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
            }`}>
              Score: {(bestModel.score * 100).toFixed(1)}%{hasOverfitting && ' ⚠️'}
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-800">Avertissements système</span>
              </div>
              <ul className="text-[11px] text-amber-700 space-y-0.5 ml-6">
                {warnings.map((w, idx) => <li key={idx}>• {w}</li>)}
              </ul>
            </div>
          )}

          {/* 🧠 LLM EXPLANATION PANEL */}
          {llmExplanation && llmExplanation.success && (
            <div>
              <button
                onClick={() => setShowLLMExplanation(!showLLMExplanation)}
                className="w-full flex items-center justify-between p-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg hover:from-indigo-200 hover:to-purple-200 transition mb-2"
              >
                <span className="text-xs font-bold text-indigo-800 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  🧠 Analyse Intelligente & Recommandations
                </span>
                {showLLMExplanation ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
              </button>
              {showLLMExplanation && <LLMExplanationPanel llmExplanation={llmExplanation} />}
            </div>
          )}

          {/* Data Summary */}
          {dataSummary.total_features > 0 && (
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="text-[10px] font-bold text-gray-700 mb-2">📊 Données utilisées</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-lg font-bold text-blue-700">{featureCount}</p>
                  <p className="text-[9px] text-gray-600">Features</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-lg font-bold text-blue-700">{trainSize}</p>
                  <p className="text-[9px] text-gray-600">Train</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-lg font-bold text-blue-700">{dataSummary.test_size || 0}</p>
                  <p className="text-[9px] text-gray-600">Test</p>
                </div>
                <div className={`p-2 rounded ${isHighDimensionality ? 'bg-red-100' : 'bg-green-100'}`}>
                  <p className={`text-lg font-bold ${isHighDimensionality ? 'text-red-700' : 'text-green-700'}`}>
                    {ratioFeaturesToTrain.toFixed(2)}
                  </p>
                  <p className="text-[9px] text-gray-600">Ratio F/S</p>
                </div>
              </div>
              {isHighDimensionality && (
                <p className="text-[10px] text-red-600 mt-2">
                  ⚠️ Ratio élevé ({ratioFeaturesToTrain.toFixed(2)} &gt; 0.2) - Risque d'overfitting
                </p>
              )}
            </div>
          )}

          {/* Best Model */}
          {mlSuccess && bestModel && (
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-bold text-blue-900">{bestModel.name}</p>
                  <p className="text-[10px] text-blue-700">Meilleur modèle</p>
                </div>
              </div>
              {testMetrics && Object.keys(testMetrics).length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {Object.entries(testMetrics).slice(0, 4).map(([key, val]) => (
                    <div key={key} className="bg-white/80 p-2 rounded text-center">
                      <p className={`text-sm font-bold ${
                        typeof val === 'number' && val >= 0.7 ? 'text-green-600' : 
                        typeof val === 'number' && val >= 0.5 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {typeof val === 'number' ? (val * 100).toFixed(1) + '%' : val}
                      </p>
                      <p className="text-[9px] text-gray-600 uppercase">{key}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Model Comparison */}
          {allModels.length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="text-[10px] font-bold text-gray-700 mb-2 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />Comparaison ({allModels.length})
              </p>
              <div className="space-y-1.5">
                {allModels.slice(0, 5).map((model, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold w-5 ${idx === 0 ? 'text-blue-600' : 'text-gray-500'}`}>#{idx + 1}</span>
                    <span className="text-[11px] text-gray-800 flex-1 truncate">{model.name}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-gray-400'}`}
                           style={{ width: `${Math.max(0, Math.min(100, model.score * 100))}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold w-12 text-right ${model.score === 1 ? 'text-red-600' : 'text-gray-700'}`}>
                      {(model.score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Importance */}
          {featureImportanceArray.length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="text-[10px] font-bold text-gray-700 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />Importance Features (Top 5)
              </p>
              <div className="space-y-1.5">
                {featureImportanceArray.slice(0, 5).map((feat, idx) => {
                  const translatedName = translateVariable(feat.feature);
                  const isTranslated = translatedName !== feat.feature;
                  
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-800 truncate" title={feat.feature}>
                          {isTranslated ? translatedName : feat.feature}
                        </p>
                        {isTranslated && (
                          <p className="text-[9px] text-gray-400 truncate">{feat.feature.substring(0, 25)}...</p>
                        )}
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                             style={{ width: `${Math.max(0, Math.min(100, feat.importance * 100))}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-600 w-10 text-right">{(feat.importance * 100).toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 📖 STORYTELLING RESULTS
// ============================================================================
const StorytellingResults = ({ data, isExpanded, onToggle }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  const [expandedRec, setExpandedRec] = useState(null);

  if (!data) return null;

  const insights = data.insights || [];
  const recommendations = data.recommendations || [];
  const ttsText = data.tts_text || '';
  const exports = data.exports || {};

  const speak = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const downloadFile = (content, filename, type) => {
    if (!content) return;
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${PHASE_COLORS.storytelling.border} ${PHASE_COLORS.storytelling.bg}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-indigo-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BookOpen className={`w-5 h-5 ${PHASE_COLORS.storytelling.icon}`} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">Phases 7-8: Storytelling & Décisions</h3>
            <p className="text-xs text-gray-600">
              {insights.length} insights • {recommendations.length} recommandations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {insights.length > 0 && (
            <span className="text-xs font-bold bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">
              {insights.length} insights
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* TTS Player */}
          {ttsText && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-sm">Narration Audio</p>
                    <p className="text-[10px] text-white/70">Écoutez le résumé</p>
                  </div>
                </div>
                <button
                  onClick={() => speak(ttsText)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-indigo-600 rounded-lg font-bold text-xs"
                >
                  {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isSpeaking ? 'Stop' : 'Écouter'}
                </button>
              </div>
            </div>
          )}

          {/* Export Buttons */}
          {(exports.html || exports.markdown) && (
            <div className="bg-white p-3 rounded-lg border border-indigo-100">
              <p className="text-[10px] font-bold text-gray-700 mb-2 flex items-center gap-1">
                <Download className="w-3 h-3" />Exporter
              </p>
              <div className="flex gap-2">
                {exports.html && (
                  <button
                    onClick={() => downloadFile(exports.html, 'rapport.html', 'text/html')}
                    className="px-3 py-1 text-[10px] font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    HTML
                  </button>
                )}
                {exports.markdown && (
                  <button
                    onClick={() => downloadFile(exports.markdown, 'rapport.md', 'text/markdown')}
                    className="px-3 py-1 text-[10px] font-medium bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                  >
                    Markdown
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-700">💡 Insights</p>
              {insights.slice(0, 5).map((insight, idx) => (
                <div key={idx} className={`p-2 rounded-lg border-l-4 ${
                  insight.priority === 'haute' ? 'bg-red-50 border-red-500' :
                  insight.priority === 'moyenne' ? 'bg-amber-50 border-amber-500' :
                  'bg-green-50 border-green-500'
                }`}>
                  <p className="text-xs font-medium text-gray-800">{insight.title}</p>
                  <p className="text-[10px] text-gray-600">{insight.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 🚀 EXPORTS
// ============================================================================

export const ContinueAnalysisButton = ({ onContinue, disabled, isLoading }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
          <Brain className="w-8 h-8 text-white" />
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Analyse EDA Terminée ✓</h3>
          <p className="text-sm text-gray-600 max-w-md">
            Continuez avec l'analyse avancée : Feature Engineering, Machine Learning et rapport intelligent.
          </p>
        </div>

        <button
          onClick={onContinue}
          disabled={disabled || isLoading}
          className={`flex items-center gap-3 px-8 py-3 text-white font-bold text-sm rounded-xl shadow-lg transition-all ${
            disabled || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
          }`}
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Continuer l'Analyse Avancée
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const SmartAnalysisProgress = ({ progress, message, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
          <Brain className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Analyse Avancée en Cours</h2>
          <p className="text-xs text-gray-600">Feature Engineering • ML • Storytelling</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-indigo-700">{message || 'Initialisation...'}</span>
          <span className="font-bold text-indigo-800">{progress}%</span>
        </div>
        <div className="w-full bg-indigo-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const SmartAnalysisResultsPanel = ({ smartResults, isTtsEnabled = true }) => {
  const [expandedPhase, setExpandedPhase] = useState('ml_pipeline');

  const togglePhase = (phase) => {
    setExpandedPhase(expandedPhase === phase ? null : phase);
  };

  if (!smartResults) return null;

  const data = smartResults.data || smartResults;
  
  const featureEngineering = data.feature_engineering || null;
  const mlPipeline = data.ml_pipeline || null;
  const storytelling = data.storyteller || null;

  const hasResults = featureEngineering || mlPipeline || storytelling;

  if (!hasResults) return null;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Analyse Avancée IA</h2>
            <p className="text-xs text-gray-600">Feature Engineering • ML • Storytelling</p>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-bold text-green-800">Complète</span>
          </div>
        </div>
      </div>

      {/* Results Sections */}
      <div className="space-y-3">
        {featureEngineering && (
          <FeatureEngineeringResults
            data={featureEngineering}
            isExpanded={expandedPhase === 'feature_engineering'}
            onToggle={() => togglePhase('feature_engineering')}
          />
        )}

        {mlPipeline && (
          <MLPipelineResults
            data={mlPipeline}
            isExpanded={expandedPhase === 'ml_pipeline'}
            onToggle={() => togglePhase('ml_pipeline')}
          />
        )}

        {storytelling && (
          <StorytellingResults
            data={storytelling}
            isExpanded={expandedPhase === 'storytelling'}
            onToggle={() => togglePhase('storytelling')}
          />
        )}
      </div>
    </div>
  );
};

export { SmartAnalysisResultsPanel };
export default SmartAnalysisResultsPanel;