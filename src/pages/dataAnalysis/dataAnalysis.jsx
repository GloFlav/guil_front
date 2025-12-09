import React, { useState } from 'react';
import axios from 'axios';
import {
  Upload,
  FileText,
  Zap,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Loader,
  AlertTriangle,
  Table,
  Database,
  ChevronDown,
  ChevronUp,
  LayoutList,
  Maximize2,
  Minimize2,
  Percent
} from 'lucide-react';
import DataUploadSection from '@/components/dataAnalysisComponents/DataUploadSection';
import DataDescriptionSection from '@/components/dataAnalysisComponents/DataDescriptionSection';
import AnalysisLoader from '@/components/dataAnalysisComponents/AnalysisLoader';
import AnalysisResults from '@/components/dataAnalysisComponents/AnalysisResults';
import ExportSidebar from '@/components/dataAnalysisComponents/ExportSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// ============================================================================
// COMPOSANT : FileStatsCard (Affichage Intelligent des Métadonnées)
// ============================================================================
const FileStatsCard = ({ stats }) => {
  const [showAllEmpty, setShowAllEmpty] = useState(false);
  const [showAllPartial, setShowAllPartial] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);

  if (!stats) return null;

  // --- Calculs et Préparation ---
  const emptyCount = stats.empty_columns ? stats.empty_columns.length : 0;
  const partialList = stats.partially_empty_columns || [];
  const partialCount = partialList.length;
  
  // Pagination de la liste des colonnes pour éviter de surcharger le DOM
  const displayedColumns = showAllColumns ? stats.columns_list : stats.columns_list.slice(0, 20);
  const remainingColumns = stats.columns_list.length - 20;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
      
      {/* --- En-tête : Nom et Taille --- */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg break-all">{stats.filename}</h3>
            <p className="text-sm text-gray-500 font-mono">Taille : {stats.file_size_kb} KB</p>
          </div>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold tracking-wide uppercase">
          Scan Réussi
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- Colonne Gauche : Métriques & Qualité des Données --- */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Tuiles Chiffres Clés */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex flex-col justify-center items-center text-center transition-transform hover:scale-105 duration-200">
              <span className="text-3xl font-extrabold text-blue-600">{stats.total_rows}</span>
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider mt-1">Lignes</span>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex flex-col justify-center items-center text-center transition-transform hover:scale-105 duration-200">
              <span className="text-3xl font-extrabold text-indigo-600">{stats.total_columns}</span>
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider mt-1">Colonnes</span>
            </div>
          </div>

          {/* 1. Accordéon : Colonnes 100% VIDES (Rouge) */}
          {emptyCount > 0 && (
            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${showAllEmpty ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-red-100'}`}>
              <button 
                onClick={() => setShowAllEmpty(!showAllEmpty)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${showAllEmpty ? 'bg-red-200' : 'bg-red-100'}`}>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-red-900 text-sm">
                      {emptyCount} Colonne{emptyCount > 1 ? 's' : ''} vide{emptyCount > 1 ? 's' : ''}
                    </h4>
                  </div>
                </div>
                {showAllEmpty ? <ChevronUp className="w-5 h-5 text-red-400" /> : <ChevronDown className="w-5 h-5 text-red-400" />}
              </button>
              
              {showAllEmpty && (
                <div className="px-4 pb-4 pt-0">
                    <p className="text-xs text-red-800 mb-2 pt-2 border-t border-red-200">
                        Ces colonnes ne contiennent aucune donnée (100% null) :
                    </p>
                    <ul className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-2 bg-white/50 rounded p-2 border border-red-100">
                        {stats.empty_columns.map((col, idx) => (
                        <li key={idx} className="text-xs text-red-700 flex items-start gap-2 py-1 border-b border-red-100/50 last:border-0">
                            <span className="block w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0"></span>
                            <span className="break-words font-medium">{col}</span>
                        </li>
                        ))}
                    </ul>
                </div>
              )}
            </div>
          )}

          {/* 2. Accordéon : Colonnes PARTIELLEMENT VIDES (Ambre) */}
          {partialCount > 0 ? (
            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${showAllPartial ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-amber-100'}`}>
              <button 
                onClick={() => setShowAllPartial(!showAllPartial)}
                className="w-full flex items-center justify-between p-4 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${showAllPartial ? 'bg-amber-200' : 'bg-amber-100'}`}>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-amber-900 text-sm">
                      {partialCount} Colonne{partialCount > 1 ? 's' : ''} incomplète{partialCount > 1 ? 's' : ''}
                    </h4>
                    {!showAllPartial && (
                        <p className="text-xs text-amber-600 mt-0.5">Valeurs manquantes détectées</p>
                    )}
                  </div>
                </div>
                {showAllPartial ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5 text-amber-400" />}
              </button>
              
              {showAllPartial && (
                <div className="px-4 pb-4 pt-0">
                    <p className="text-xs text-amber-800 mb-2 pt-2 border-t border-amber-200">
                        Détail des données manquantes :
                    </p>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2 bg-white/50 rounded p-2 border border-amber-100">
                        {partialList.map((item, idx) => (
                            <div key={idx} className="bg-white p-2 rounded border border-amber-100 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[180px]" title={item.name}>{item.name}</span>
                                    <span className="text-xs font-bold text-amber-700">{item.percentage}% vide</span>
                                </div>
                                {/* Barre de progression visuelle */}
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className="bg-amber-500 h-1.5 rounded-full" 
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 text-right italic">
                                    {item.count} manquants sur {stats.total_rows}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
          ) : (
             // État parfait si aucune erreur
             emptyCount === 0 && (
                <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                        <h4 className="text-sm font-bold text-green-800">Données Complètes</h4>
                        <p className="text-xs text-green-700">Aucune valeur manquante détectée.</p>
                    </div>
                </div>
             )
          )}
        </div>

        {/* --- Colonne Droite : Liste Complète des Colonnes --- */}
        <div className="lg:col-span-7 bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <LayoutList className="w-4 h-4 text-gray-500" />
              Toutes les colonnes
            </h4>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
              {stats.columns_list.length} champs
            </span>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 content-start">
              {displayedColumns.map((col, index) => {
                 // Coloration contextuelle des badges
                 const isEmpty = stats.empty_columns.includes(col);
                 const isPartial = partialList.find(p => p.name === col);
                 
                 let badgeClass = "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600";
                 let tooltipSuffix = "";

                 if (isEmpty) {
                     badgeClass = "bg-red-50 text-red-600 border-red-200";
                     tooltipSuffix = " (Vide)";
                 } else if (isPartial) {
                     badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                     tooltipSuffix = ` (${isPartial.percentage}% vide)`;
                 }

                 return (
                    <span 
                      key={index} 
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium border shadow-sm transition-colors cursor-default ${badgeClass}`}
                      title={col + tooltipSuffix}
                    >
                      {col.length > 25 ? col.substring(0, 25) + '...' : col}
                      {isPartial && <span className="ml-1 text-[9px] opacity-75 font-bold">-{isPartial.percentage}%</span>}
                    </span>
                 );
              })}
            </div>
            
            {/* Boutons Voir Plus / Moins */}
            {!showAllColumns && remainingColumns > 0 && (
              <button 
                onClick={() => setShowAllColumns(true)}
                className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline p-1"
              >
                <Maximize2 className="w-3 h-3" />
                Voir les {remainingColumns} autres colonnes...
              </button>
            )}

            {showAllColumns && stats.columns_list.length > 20 && (
               <button 
               onClick={() => setShowAllColumns(false)}
               className="mt-4 w-full py-2 text-xs font-medium text-gray-500 hover:bg-gray-200 rounded transition-colors flex items-center justify-center gap-2"
             >
               <Minimize2 className="w-3 h-3" />
               Réduire la liste
             </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL : DataAnalysis
// ============================================================================
const DataAnalysis = () => {
  // --- États ---
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileStats, setFileStats] = useState(null); 
  const [isUploading, setIsUploading] = useState(false); 
  
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loadingSteps, setLoadingSteps] = useState([]);

  // --- Configuration ---
  const GREEN_COLOR = '#5DA781';
  const API_URL = "http://localhost:8000/api/v1"; 
  const ALLOWED_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/x-csv',
    'text/plain',
  ];
  const ALLOWED_EXTENSIONS = ['.xls', '.xlsx', '.csv', '.tsv', '.ods'];

  // --- Fonctions ---

  const handleFileUpload = async (file) => {
    // 1. Validation
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
    const isValidType = ALLOWED_TYPES.includes(file.type) || isValidExtension;

    if (!isValidType) {
      MySwal.fire({
        icon: 'error',
        title: 'Format non supporté',
        text: 'Veuillez importer un fichier Excel (.xlsx, .xls) ou CSV.',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      MySwal.fire({ icon: 'error', title: 'Fichier trop volumineux', text: 'Max 50 MB.' });
      return;
    }

    // 2. Set State
    setUploadedFile(file);
    setIsUploading(true);
    setFileStats(null);
    setAnalysisResults(null);

    // 3. API Call
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/analyze/upload-preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data) {
        setFileStats(response.data);
      }
    } catch (error) {
      console.error("Erreur API Preview:", error);
      const errorMsg = error.response?.data?.detail || "Le serveur n'a pas pu lire le fichier.";
      
      MySwal.fire({
        icon: 'error',
        title: 'Erreur de lecture',
        text: errorMsg
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

  const handleAnalyze = () => {
    if (!uploadedFile) return;
    if (!description.trim()) {
      MySwal.fire({ icon: 'warning', title: 'Description requise', text: 'Veuillez décrire l\'objectif de l\'analyse.' });
      return;
    }

    setIsAnalyzing(true);
    setLoadingSteps([]);
    setAnalysisResults(null);

    // TODO: Remplacer par l'appel API réel de génération
    const steps = [
      { step: 1, message: 'Analyse sémantique par IA...' },
      { step: 2, message: 'Détection des anomalies...' },
      { step: 3, message: 'Calcul des corrélations...' },
      { step: 4, message: 'Génération du rapport...' },
    ];
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingSteps((prev) => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setAnalysisResults({ success: true, message: "Analyse terminée (Mock)" });
        setIsAnalyzing(false);
        MySwal.fire({ icon: 'success', title: 'Analyse terminée !', timer: 1500, showConfirmButton: false });
      }
    }, 1200);
  };

  // --- Render ---
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg shadow-sm bg-white border border-gray-100">
                <BarChart3 className="w-6 h-6" style={{ color: GREEN_COLOR }} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analyse de Données IA</h1>
            </div>
            <p className="text-gray-600 ml-14 max-w-2xl">
              Importez vos fichiers bruts. Notre IA détecte automatiquement la structure, la qualité des données et vous propose des insights pertinents.
            </p>
          </div>

          {/* Upload & Stats Section */}
          <div className="space-y-6">
            <DataUploadSection
              onFileUpload={handleFileUpload}
              uploadedFile={uploadedFile}
              onClear={handleClearAll}
              disabled={isAnalyzing || isUploading}
            />

            {/* Loader Scan */}
            {isUploading && (
              <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-gray-300 animate-pulse shadow-sm">
                <Loader className="w-8 h-8 text-green-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-600">Scan du fichier et analyse de la structure...</p>
              </div>
            )}

            {/* Affichage Stats */}
            {!isUploading && fileStats && (
              <FileStatsCard stats={fileStats} />
            )}
          </div>

          {/* Description Section */}
          <div className={`transition-opacity duration-500 ${uploadedFile ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <DataDescriptionSection
                description={description}
                onDescriptionChange={setDescription}
                disabled={isAnalyzing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleAnalyze}
              disabled={!uploadedFile || !fileStats || isAnalyzing || isUploading}
              className={`flex items-center gap-2 px-8 py-3.5 text-white rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                ${(!uploadedFile || !fileStats) ? 'bg-gray-300 cursor-not-allowed shadow-none hover:translate-y-0' : ''}`}
              style={{ backgroundColor: (!uploadedFile || !fileStats) ? undefined : GREEN_COLOR }}
            >
              {isAnalyzing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Lancer l'Analyse Complète
                </>
              )}
            </button>

            {(uploadedFile || description) && (
              <button
                onClick={handleClearAll}
                disabled={isAnalyzing}
                className="px-6 py-3.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm uppercase tracking-wide hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Tout effacer
              </button>
            )}
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && <AnalysisLoader steps={loadingSteps} />}

          {/* Results */}
          {analysisResults && !isAnalyzing && (
            <AnalysisResults data={analysisResults} />
          )}
        </div>
      </div>

      {/* Sidebar */}
      {analysisResults && !isAnalyzing && (
        <ExportSidebar data={analysisResults} />
      )}
    </div>
  );
};

export default DataAnalysis;