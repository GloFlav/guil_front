import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Upload, Zap, BarChart3, Loader, AlertTriangle, AlertCircle, CheckCircle,
  Database, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, LayoutList,
  Search, X, Sparkles, Volume2, VolumeX, Eye, Download
} from 'lucide-react';
import DataUploadSection from '@/components/dataAnalysisComponents/DataUploadSection';
import AnalysisLoader from '@/components/dataAnalysisComponents/AnalysisLoader';
import AnalysisResults from '@/components/dataAnalysisComponents/AnalysisResults';
import ExportSidebar from '@/components/dataAnalysisComponents/ExportSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import analysisService from '@/services/analysisService';

const MySwal = withReactContent(Swal);
const GREEN_COLOR = '#5DA781';

// ============================================================================
// 🎤 TTS MOTOR - AUTO + RAPIDE
// ============================================================================
const TTS_CONFIG = {
  rate: 0.95,
  pitch: 1.0,
  volume: 1.0
};

const useTTSEngine = () => {
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isTtsEnabledRef = useRef(true);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    isTtsEnabledRef.current = isTtsEnabled;
    if (!isTtsEnabled) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
  }, [isTtsEnabled]);

  const getBestFrenchVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const googleFR = voices.find(v => 
      v.name.includes('Google') && v.lang === 'fr-FR'
    );
    if (googleFR) return googleFR;
    const nativeFR = voices.find(v => 
      v.lang === 'fr-FR' && !v.name.includes('Compact')
    );
    if (nativeFR) return nativeFR;
    const anyFR = voices.find(v => v.lang.includes('fr'));
    return anyFR || voices[0];
  };

  const speakNonBlocking = (text, priority = 'NORMAL') => {
    if (!isTtsEnabledRef.current || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }

    if (priority === 'CRITICAL') {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = TTS_CONFIG.rate;
      utterance.pitch = TTS_CONFIG.pitch;
      utterance.volume = TTS_CONFIG.volume;

      const voice = getBestFrenchVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  return { speakNonBlocking, isTtsEnabled, setIsTtsEnabled, isSpeaking };
};

// ============================================================================
// 📊 FILTERED DATA VIEWER (FRONTEND ONLY)
// ============================================================================
const FilteredDataViewer = ({ filteredData, fileStats }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!filteredData || filteredData.length === 0) return null;

  const downloadCSV = () => {
    const headers = Object.keys(filteredData[0]);
    const csv = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered_data_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = Object.keys(filteredData[0]);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-gray-900">Données Filtrées</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {fileStats.total_rows} lignes × {fileStats.total_columns} colonnes
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
        >
          {isOpen ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Masquer
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Afficher
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-3">
          <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="px-2 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 20).map((row, ridx) => (
                  <tr key={ridx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    {columns.map((col, cidx) => {
                      const val = row[col];
                      const displayVal = val === null || val === undefined ? '-' : String(val);
                      return (
                        <td key={cidx} className="px-2 py-1.5 text-gray-700 whitespace-nowrap truncate max-w-[150px]" title={displayVal}>
                          {displayVal.length > 30 ? displayVal.substring(0, 27) + '...' : displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <span className="text-xs text-blue-700 font-medium">
              {filteredData.length > 20 ? `Affichage: 20 premières lignes sur ${filteredData.length}` : `${filteredData.length} lignes`}
            </span>
            
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 📊 FILE STATS CARD
// ============================================================================
const FileStatsCard = ({ stats }) => {
  const [showEmpty, setShowEmpty] = useState(false);
  const [showPartial, setShowPartial] = useState(false);
  const [showAllCols, setShowAllCols] = useState(true);
  const [expandedView, setExpandedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!stats) return null;

  const emptyCount = stats.empty_columns ? stats.empty_columns.length : 0;
  const partialList = stats.partially_empty_columns || [];
  const partialCount = partialList.length;

  const areAllOpen = useMemo(() => {
    const emptyOpen = emptyCount > 0 ? showEmpty : true;
    const partialOpen = partialCount > 0 ? showPartial : true;
    return emptyOpen && partialOpen && showAllCols;
  }, [showEmpty, showPartial, showAllCols, emptyCount, partialCount]);

  const toggleAll = () => {
    const targetState = !areAllOpen;
    if (emptyCount > 0) setShowEmpty(targetState);
    if (partialCount > 0) setShowPartial(targetState);
    setShowAllCols(targetState);
  };

  const filteredColumns = useMemo(() => {
    return stats.columns_list.filter(col => 
      col.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stats.columns_list, searchTerm]);

  const visibleColumns = expandedView ? filteredColumns : filteredColumns.slice(0, 45);
  const hiddenCount = filteredColumns.length - visibleColumns.length;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
      <div className="flex flex-wrap items-center justify-between mb-4 pb-3 border-b border-gray-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm break-all mr-2">{stats.filename}</h3>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
              <span>{stats.file_size_kb} KB</span>
              <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded text-[9px] font-bold uppercase tracking-wider">
                Scan Réussi
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all active:scale-95"
        >
          {areAllOpen ? (
            <>
              <ChevronsUp className="w-3 h-3" />
              Replier
            </>
          ) : (
            <>
              <ChevronsDown className="w-3 h-3" />
              Déplier
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg text-center hover:bg-white hover:shadow-sm transition-all">
              <span className="text-xl font-extrabold text-gray-800">{stats.total_rows}</span>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wide">Lignes</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg text-center hover:bg-white hover:shadow-sm transition-all">
              <span className="text-xl font-extrabold text-blue-600">{stats.total_columns}</span>
              <span className="block text-[9px] font-bold text-blue-800 uppercase tracking-wide">Colonnes</span>
            </div>
          </div>

          {emptyCount > 0 && (
            <div className={`border rounded-lg overflow-hidden transition-all duration-300 ${showEmpty ? 'bg-red-50 border-red-200' : 'bg-white border-red-100'}`}>
              <button 
                onClick={() => setShowEmpty(!showEmpty)}
                className="w-full flex items-center justify-between p-2.5 hover:bg-red-50/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${showEmpty ? 'bg-red-200' : 'bg-red-100'}`}>
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-red-900 text-xs">
                      {emptyCount} vide{emptyCount > 1 ? 's' : ''} (100%)
                    </h4>
                  </div>
                </div>
                {showEmpty ? <ChevronUp className="w-3 h-3 text-red-400" /> : <ChevronDown className="w-3 h-3 text-red-400" />}
              </button>
              
              {showEmpty && (
                <div className="px-3 pb-3 pt-0">
                  <div className="h-px bg-red-200 w-full mb-2" />
                  <ul className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                    {stats.empty_columns.map((col, idx) => (
                      <li key={idx} className="text-[10px] text-red-700 flex items-start gap-1.5 py-1 border-b border-red-100/50 last:border-0 bg-white/50 px-1.5 rounded">
                        <span className="w-1 h-1 bg-red-400 rounded-full mt-1 shrink-0"></span>
                        <span className="font-medium break-all leading-tight">{col}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {partialCount > 0 && (
            <div className={`border rounded-lg overflow-hidden transition-all duration-300 ${showPartial ? 'bg-amber-50 border-amber-200' : 'bg-white border-amber-100'}`}>
              <button 
                onClick={() => setShowPartial(!showPartial)}
                className="w-full flex items-center justify-between p-2.5 hover:bg-amber-50/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${showPartial ? 'bg-amber-200' : 'bg-amber-100'}`}>
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-amber-900 text-xs">
                      {partialCount} incomplète{partialCount > 1 ? 's' : ''}
                    </h4>
                  </div>
                </div>
                {showPartial ? <ChevronUp className="w-3 h-3 text-amber-400" /> : <ChevronDown className="w-3 h-3 text-amber-400" />}
              </button>
              
              {showPartial && (
                <div className="px-3 pb-3 pt-0">
                  <div className="h-px bg-amber-200 w-full mb-2" />
                  <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {partialList.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-amber-100 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-700 truncate max-w-[120px]">{item.name}</span>
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-100">
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                          <div 
                            className="bg-amber-500 h-1 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {emptyCount === 0 && partialCount === 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <h4 className="font-bold text-xs">Qualité Parfaite</h4>
                <p className="text-[10px] text-green-700">100% complété.</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 bg-gray-50 border border-gray-200 rounded-lg flex flex-col overflow-hidden transition-all duration-300">
          <div className="px-3 py-2 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <button 
              onClick={() => setShowAllCols(!showAllCols)}
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-blue-600 transition-colors"
            >
              <LayoutList className="w-3.5 h-3.5 text-gray-500" />
              Structure ({stats.columns_list.length})
              {showAllCols ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAllCols && (
              <div className="relative w-full sm:w-48 animate-in fade-in zoom-in duration-200">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filtrer..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-6 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-1 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-2.5 h-2.5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            )}
          </div>

          {showAllCols && (
            <div className="p-3 flex-1 bg-gray-50/50">
              {stats.columns_list.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-[10px] italic">
                  Aucune colonne
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 content-start animate-in fade-in duration-300">
                  {visibleColumns.map((col, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border shadow-sm bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all cursor-default select-all"
                      title={col}
                    >
                      <span className="w-1 h-1 bg-gray-300 rounded-full mr-1.5"></span>
                      {col.length > 35 ? col.substring(0, 35) + '..' : col}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setExpandedView(true)}
                      className="text-[9px] text-blue-500 hover:text-blue-700 px-2 py-0.5 underline"
                    >
                      +{hiddenCount} colonnes
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 🎤 EXPLICATION TAB - Affichée après upload avec TTS auto + boutons
// ============================================================================
const ExplanationTab = ({ 
  fileStats, 
  onExplanationComplete,
  isTtsEnabled,
  speakNonBlocking
}) => {
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsLaunchedRef = useRef(false);
  const ttsDataRef = useRef(null);

  const fetchExplanation = async () => {
    if (!fileStats?.file_id || ttsLaunchedRef.current) return;

    setIsLoading(true);
    setIsComplete(false);

    try {
      const response = await fetch('/api/v1/analyze/file-structure-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileStats.file_id })
      });

      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      setExplanation(data.ai_summary || "");
      ttsDataRef.current = data.tts_text;

      // 🎤 TTS AUTOMATIQUE au chargement
      if (isTtsEnabled && data.tts_text) {
        ttsLaunchedRef.current = true;
        setIsSpeaking(true);
        speakNonBlocking(data.tts_text).then(() => {
          setIsSpeaking(false);
        }).catch(err => {
          console.error("TTS error:", err);
          setIsSpeaking(false);
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

  const handleListen = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (ttsDataRef.current) {
      setIsSpeaking(true);
      speakNonBlocking(ttsDataRef.current).then(() => {
        setIsSpeaking(false);
      }).catch(() => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">📖 Explication du Dataset</h3>
          {isComplete && <CheckCircle className="w-5 h-5 text-green-600" />}
        </div>

        {isComplete && isTtsEnabled && ttsDataRef.current && (
          <button
            onClick={handleListen}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isSpeaking 
                ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-50'
                : 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-50'
            }`}
            title={isSpeaking ? "Arrêter la lecture" : "Écouter l'explication"}
          >
            <Volume2 className="w-4 h-4" />
            {isSpeaking ? "Arrêter" : "🔊 Écouter"}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-blue-100 p-4 min-h-[200px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <Loader className="animate-spin text-blue-500 mb-3" size={24} />
            <span className="text-gray-600 text-sm font-medium">Analyse du dataset...</span>
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

      {isSpeaking && (
        <div className="mt-4 text-center text-xs text-green-600 font-medium p-2 bg-green-50 rounded border border-green-100 animate-pulse">
          🔊 Lecture en cours...
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 📊 EDA TABS avec Explications et TTS par onglet
// ============================================================================
const EDATabsWithExplanations = ({ 
  analysisResults, 
  isTtsEnabled,
  speakNonBlocking
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSpeakingTab, setIsSpeakingTab] = useState(null);
  
  if (!analysisResults?.tab_explanations) {
    return null;
  }

  const tabs = Object.entries(analysisResults.tab_explanations).map(([key, explanation]) => ({
    key,
    title: explanation.title || key,
    summary: explanation.summary || "",
    recommendation: explanation.recommendation || ""
  }));

  if (tabs.length === 0) return null;

  const activeTabData = tabs.find(t => t.key === activeTab);

  const handleTabSpeak = (tabKey, text) => {
    if (isSpeakingTab === tabKey) {
      window.speechSynthesis.cancel();
      setIsSpeakingTab(null);
      return;
    }

    setIsSpeakingTab(tabKey);
    speakNonBlocking(text).then(() => {
      setIsSpeakingTab(null);
    }).catch(() => {
      setIsSpeakingTab(null);
    });
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ONGLETS */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-3 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-600 border-transparent hover:text-blue-500'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* CONTENU ACTIF */}
      {activeTabData && (
        <div className="p-6 space-y-4 animate-in fade-in duration-300">
          {/* Boutons TTS */}
          {isTtsEnabled && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleTabSpeak(activeTab, activeTabData.summary)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isSpeakingTab === activeTab
                    ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-50'
                    : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                {isSpeakingTab === activeTab ? "Arrêter résumé" : "🔊 Écouter résumé"}
              </button>

              <button
                onClick={() => handleTabSpeak(`${activeTab}-rec`, activeTabData.recommendation)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isSpeakingTab === `${activeTab}-rec`
                    ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-50'
                    : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-50'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                {isSpeakingTab === `${activeTab}-rec` ? "Arrêter recom." : "📢 Lire recommandations"}
              </button>
            </div>
          )}

          {/* Textes */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm">Résumé</h4>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                {activeTabData.summary}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm">Recommandations</h4>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded-lg border border-blue-200">
                {activeTabData.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 📊 MAIN PAGE
// ============================================================================
const DataAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileStats, setFileStats] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [explanationComplete, setExplanationComplete] = useState(false);
  
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loadingSteps, setLoadingSteps] = useState([]);

  const { speakNonBlocking, isTtsEnabled, setIsTtsEnabled } = useTTSEngine();

  const handleFileUpload = async (file) => {
    const validExtensions = ['.xls', '.xlsx', '.csv', '.tsv', '.ods'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      MySwal.fire({ 
        icon: 'error', 
        title: 'Format invalide', 
        text: 'Seuls Excel et CSV sont supportés.' 
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      MySwal.fire({ 
        icon: 'error', 
        title: 'Fichier lourd', 
        text: 'Limite de 50 Mo dépassée.' 
      });
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setFileStats(null);
    setFilteredData(null);
    setExplanationComplete(false);
    setAnalysisResults(null);

    if (isTtsEnabled) {
      const text = `Je vais analyser le fichier ${file.name}`;
      speakNonBlocking(text, 'CRITICAL').catch(err => console.error("TTS error:", err));
    }

    try {
      const response = await analysisService.uploadFilePreview(file);
      setFileStats(response);

      if (response.filtered_data) {
        setFilteredData(response.filtered_data);
      }

      if (isTtsEnabled && response) {
        const rows = response.total_rows;
        const cols = response.total_columns;
        const partialCount = response.partially_empty_columns?.length || 0;
        
        const filteringText = `Je viens de filtrer le fichier. Maintenant on a ${rows} lignes et ${cols} colonnes valides. ${partialCount} partiellement incomplètes conservées.`;
        speakNonBlocking(filteringText, 'NORMAL').catch(err => console.error("TTS error:", err));
      }

    } catch (error) {
      console.error("❌ Erreur Scan:", error);
      
      const errorMessage = error.response?.data?.detail 
        || error.message 
        || "Impossible de lire le fichier.";
      
      MySwal.fire({
        icon: 'error',
        title: 'Erreur lecture',
        text: errorMessage
      });
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearAll = () => {
    setUploadedFile(null);
    setFileStats(null);
    setFilteredData(null);
    setExplanationComplete(false);
    setDescription('');
    setIsAnalyzing(false);
    setLoadingSteps([]);
    setAnalysisResults(null);
  };

  const handleExplanationComplete = (transcription) => {
    setExplanationComplete(true);
    if (transcription) {
      setDescription(transcription);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !fileStats || isAnalyzing) return;
    if (!description.trim()) {
      MySwal.fire({ 
        icon: 'warning', 
        title: 'Description manquante', 
        text: 'Veuillez décrire votre objectif.' 
      });
      return;
    }

    setIsAnalyzing(true);
    setLoadingSteps([]);
    setAnalysisResults(null);

    try {
        const fileId = fileStats.file_id;
        const userPrompt = description.trim();

        const analysisPromise = analysisService.analyzeFileFull(fileId, userPrompt);

        setLoadingSteps((prev) => [...prev, { step: 1, message: '🧠 Inférence du contexte par l\'IA...' }]);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        setLoadingSteps((prev) => [...prev, { step: 2, message: '⚙️ Feature Engineering...' }]);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoadingSteps((prev) => [...prev, { step: 3, message: '🧼 Correction des incohérences...' }]);

        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoadingSteps((prev) => [...prev, { step: 4, message: '📊 Analyse Exploratoire...' }]);

        const response = await analysisPromise;

        setAnalysisResults(response);

        MySwal.fire({ 
          icon: 'success', 
          title: 'Analyse terminée !', 
          timer: 1500, 
          showConfirmButton: false 
        });

    } catch (error) {
        console.error("❌ Erreur Analyse Complète:", error);
        
        const errorMessage = error.response?.data?.detail 
          || error.message 
          || "Erreur critique dans le pipeline de données/IA.";
        
        MySwal.fire({
            icon: 'error',
            title: 'Erreur d\'Analyse',
            text: errorMessage
        });
    } finally {
        setIsAnalyzing(false);
        setLoadingSteps((prev) => [...prev, { step: 5, message: 'Pipeline terminé.' }]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-sm">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-4 space-y-5">
          
          {/* Header */}
          <div className="space-y-1 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg shadow-sm bg-white border border-gray-100">
                  <BarChart3 className="w-5 h-5" style={{ color: GREEN_COLOR }} />
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Analyse de Données IA</h1>
              </div>
              <p className="text-xs text-gray-500 ml-11 max-w-xl">
                Importez vos fichiers bruts. L'IA scanne la structure, visualise les données, puis analyse en profondeur.
              </p>
            </div>

            <button 
              onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors ${
                isTtsEnabled 
                  ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-50' 
                  : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-50'
              }`}
              title="Activer/Désactiver la synthèse vocale"
            >
              {isTtsEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  Voix Activée
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  Voix Désactivée
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <DataUploadSection
              onFileUpload={handleFileUpload}
              uploadedFile={uploadedFile}
              onClear={handleClearAll}
              disabled={isAnalyzing || isUploading}
            />

            {isUploading && (
              <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-gray-300 animate-pulse">
                <Loader className="w-8 h-8 text-green-600 animate-spin mb-3" />
                <p className="font-medium text-gray-700 text-sm">Scan du fichier en cours...</p>
                <p className="text-xs text-gray-400">Analyse de la structure et de la qualité des données</p>
              </div>
            )}

            {!isUploading && fileStats && (
              <>
                <FileStatsCard stats={fileStats} />
                <FilteredDataViewer filteredData={filteredData} fileStats={fileStats} />

                {/* 🎤 ONGLET EXPLICATION - Nouveau ! */}
                {!explanationComplete && (
                  <ExplanationTab
                    fileStats={fileStats}
                    onExplanationComplete={handleExplanationComplete}
                    isTtsEnabled={isTtsEnabled}
                    speakNonBlocking={speakNonBlocking}
                  />
                )}
              </>
            )}

            {/* OBJECTIF */}
            {uploadedFile && explanationComplete && !analysisResults && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Votre Objectif</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Modifiez si nécessaire avant de lancer l'analyse</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isAnalyzing}
                      placeholder="Décrivez votre objectif d'analyse..."
                      className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      rows={3}
                    />
                    
                    {description && (
                      <button
                        onClick={() => setDescription('')}
                        className="absolute top-2 right-2 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOUTONS */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
            <button
              onClick={handleAnalyze}
              disabled={!uploadedFile || !fileStats || !explanationComplete || isAnalyzing || isUploading}
              className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow hover:shadow-md hover:-translate-y-0.5
                ${(!uploadedFile || !fileStats || !explanationComplete) ? 'bg-gray-300 cursor-not-allowed shadow-none' : ''}`}
              style={{ backgroundColor: (!uploadedFile || !fileStats || !explanationComplete) ? undefined : GREEN_COLOR }}
            >
              {isAnalyzing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Traitement IA...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Lancer l'Analyse
                </>
              )}
            </button>

            {uploadedFile && (
              <button
                onClick={handleClearAll}
                disabled={isAnalyzing}
                className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-white hover:text-red-500 hover:border-red-200 transition-colors"
              >
                Tout effacer
              </button>
            )}
          </div>

          {isAnalyzing && <AnalysisLoader steps={loadingSteps} />}

          {/* 📊 ONGLETS EDA AVEC EXPLICATIONS - Nouveau ! */}
          {analysisResults && !isAnalyzing && (
            <>
              <EDATabsWithExplanations
                analysisResults={analysisResults}
                isTtsEnabled={isTtsEnabled}
                speakNonBlocking={speakNonBlocking}
              />
              <AnalysisResults data={analysisResults} />
            </>
          )}
        </div>
      </div>
      
      {(analysisResults || fileStats) && !isAnalyzing && (
        <ExportSidebar data={analysisResults || fileStats} />
      )}
    </div>
  );
};

export default DataAnalysis;