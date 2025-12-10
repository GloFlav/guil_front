import React, { useState, useMemo } from 'react';
import axios from 'axios';
import {
  Upload,
  Zap,
  BarChart3,
  Loader,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Database,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  LayoutList,
  Maximize2,
  Minimize2,
  Search,
  X,
  Info,
  Sparkles,
  Mic,
  MicOff
} from 'lucide-react';
import DataUploadSection from '@/components/dataAnalysisComponents/DataUploadSection';
// Import local ou renommé si nécessaire
import DataDescriptionSection from '@/components/dataAnalysisComponents/DataDescriptionSection'; 
import AnalysisLoader from '@/components/dataAnalysisComponents/AnalysisLoader';
import AnalysisResults from '@/components/dataAnalysisComponents/AnalysisResults';
import ExportSidebar from '@/components/dataAnalysisComponents/ExportSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// ============================================================================
// COMPOSANT : FileStatsCard (Version Compacte XS/SM)
// [Code inchangé par rapport à la dernière version compacte]
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
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 relative group">
      
      {/* --- En-tête Compact --- */}
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
        
        {/* ================= GAUCHE : STATS & ALERTES ================= */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Métriques Compactes */}
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

          {/* --- 100% VIDES --- */}
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

          {/* --- PARTIELLEMENT VIDES --- */}
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
                          <span className="text-[10px] font-bold text-gray-700 truncate max-w-[120px]" title={item.name}>{item.name}</span>
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

        {/* ================= DROITE : LISTE COMPLÈTE ================= */}
        <div className="lg:col-span-8 bg-gray-50 border border-gray-200 rounded-lg flex flex-col overflow-hidden transition-all duration-300">
          
          {/* Header Liste */}
          <div className="px-3 py-2 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <button 
              onClick={() => setShowAllCols(!showAllCols)}
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-blue-600 transition-colors"
            >
              <LayoutList className="w-3.5 h-3.5 text-gray-500" />
              Structure ({stats.columns_list.length})
              {showAllCols ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Recherche Compacte */}
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

          {/* Contenu Liste */}
          {showAllCols && (
            <div className="p-3 flex-1 bg-gray-50/50">
              
              {visibleColumns.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-[10px] italic">
                   Aucune colonne "{searchTerm}"
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 content-start animate-in fade-in duration-300">
                  {visibleColumns.map((col, index) => {
                    const isEmpty = stats.empty_columns.includes(col);
                    const isPartial = partialList.find(p => p.name === col);
                    
                    let badgeClass = "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600";
                    let dotClass = "bg-gray-300";
                    let tooltip = col;

                    if (isEmpty) {
                        badgeClass = "bg-red-50 text-red-700 border-red-200 hover:border-red-300";
                        dotClass = "bg-red-500";
                        tooltip = `${col} (Vide)`;
                    } else if (isPartial) {
                        badgeClass = "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300";
                        dotClass = "bg-amber-500";
                        tooltip = `${col} (${isPartial.percentage}% vide)`;
                    }

                    return (
                      <span 
                        key={index} 
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border shadow-sm transition-all cursor-default select-all ${badgeClass}`}
                        title={tooltip}
                      >
                        <span className={`w-1 h-1 rounded-full mr-1.5 ${dotClass}`}></span>
                        {col.length > 35 ? col.substring(0, 35) + '..' : col}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Bouton Voir Plus */}
              {filteredColumns.length > 45 && (
                <div className="mt-4 border-t border-gray-200 pt-2 flex justify-center">
                    <button 
                      onClick={() => setExpandedView(!expandedView)}
                      className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm"
                    >
                      {expandedView ? (
                        <>
                          <Minimize2 className="w-3 h-3" />
                          Réduire
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3" />
                          +{hiddenCount} autres
                        </>
                      )}
                    </button>
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
// PAGE PRINCIPALE : DataAnalysis
// ============================================================================
const DataAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileStats, setFileStats] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loadingSteps, setLoadingSteps] = useState([]);

  const GREEN_COLOR = '#5DA781';
  const API_URL = "http://localhost:8000/api/v1"; 

  const handleFileUpload = async (file) => {
    // 1. Validation
    const validExtensions = ['.xls', '.xlsx', '.csv', '.tsv', '.ods'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      MySwal.fire({ icon: 'error', title: 'Format invalide', text: 'Seuls Excel et CSV sont supportés.' });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      MySwal.fire({ icon: 'error', title: 'Fichier lourd', text: 'Limite de 50 Mo dépassée.' });
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setFileStats(null);
    setAnalysisResults(null);

    // 2. Upload & Scan
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/analyze/upload-preview`, formData);
      if (response.data) setFileStats(response.data);
    } catch (error) {
      console.error("Erreur Scan:", error);
      MySwal.fire({
        icon: 'error',
        title: 'Erreur lecture',
        text: error.response?.data?.detail || "Impossible de lire le fichier."
      });
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearAll = () => {
    setUploadedFile(null);
    setFileStats(null);
    setDescription('');
    setIsAnalyzing(false);
    setLoadingSteps([]);
    setAnalysisResults(null);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !fileStats || isAnalyzing) return;
    if (!description.trim()) {
      MySwal.fire({ icon: 'warning', title: 'Description manquante', text: 'Veuillez décrire votre objectif.' });
      return;
    }

    setIsAnalyzing(true);
    setLoadingSteps([]);
    setAnalysisResults(null);

    try {
        const fileId = fileStats.file_id;
        const userPrompt = description.trim();

        // 1. Appel à l'API (Simultanément aux messages de progression)
        const analysisPromise = axios.post(`${API_URL}/analyze/full`, {
            file_id: fileId,
            user_prompt: userPrompt
        });

        // --- ORCHESTRATION DES MESSAGES DE CHARGEMENT ---
        setLoadingSteps((prev) => [...prev, { step: 1, message: '🧠 Inférence du contexte par l\'IA (Déduction de la cible et du type d\'analyse)...' }]);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        setLoadingSteps((prev) => [...prev, { step: 2, message: '⚙️ Feature Engineering (Imputation, Encodage, Fusion de variables)...' }]);
        
        // Correction des données (Correction d'erreurs/outliers)
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoadingSteps((prev) => [...prev, { step: 3, message: '🧼 Correction des incohérences (âge < 0) et neutralisation des Outliers (IQR)...' }]);

        // Analyse
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoadingSteps((prev) => [...prev, { step: 4, message: '📊 Analyse Exploratoire (Calcul des corrélations et génération des graphiques)...' }]);

        // Attendre la fin réelle de l'API
        const response = await analysisPromise;

        setAnalysisResults(response.data);

        MySwal.fire({ icon: 'success', title: 'Analyse terminée !', timer: 1500, showConfirmButton: false });

    } catch (error) {
        console.error("Erreur Analyse Complète:", error);
        MySwal.fire({
            icon: 'error',
            title: 'Erreur d\'Analyse',
            text: error.response?.data?.detail || "Erreur critique dans le pipeline de données/IA."
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
          
          {/* Header Page */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg shadow-sm bg-white border border-gray-100">
                <BarChart3 className="w-5 h-5" style={{ color: GREEN_COLOR }} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Analyse de Données IA</h1>
            </div>
            <p className="text-xs text-gray-500 ml-11 max-w-xl">
              Importez vos fichiers bruts. L'IA scanne la structure, nettoie les erreurs et génère le rapport.
            </p>
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
              <FileStatsCard stats={fileStats} />
            )}
          </div>

          <div className={`transition-all duration-500 ${uploadedFile ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <DataDescriptionSection
                description={description}
                onDescriptionChange={setDescription}
                disabled={isAnalyzing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
            <button
              onClick={handleAnalyze}
              disabled={!uploadedFile || !fileStats || isAnalyzing || isUploading}
              className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow hover:shadow-md hover:-translate-y-0.5
                ${(!uploadedFile || !fileStats) ? 'bg-gray-300 cursor-not-allowed shadow-none' : ''}`}
              style={{ backgroundColor: (!uploadedFile || !fileStats) ? undefined : GREEN_COLOR }}
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

            {(uploadedFile || description) && (
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

          {analysisResults && !isAnalyzing && (
            <AnalysisResults data={analysisResults} />
          )}
        </div>
      </div>
      
      {/* Sidebar visible dès qu'on a des stats */}
      {(analysisResults || fileStats) && !isAnalyzing && (
        <ExportSidebar data={analysisResults || fileStats} />
      )}
    </div>
  );
};

export default DataAnalysis;