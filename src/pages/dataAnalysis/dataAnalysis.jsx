import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Zap,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Loader,
} from 'lucide-react';
import DataUploadSection from '@/components/dataAnalysisComponents/DataUploadSection';
import DataDescriptionSection from '@/components/dataAnalysisComponents/DataDescriptionSection';
import AnalysisLoader from '@/components/dataAnalysisComponents/AnalysisLoader';
import AnalysisResults from '@/components/dataAnalysisComponents/AnalysisResults';
import ExportSidebar from '@/components/dataAnalysisComponents/ExportSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const DataAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loadingSteps, setLoadingSteps] = useState([]);

  const GREEN_COLOR = '#5DA781';
  const ALLOWED_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/x-csv',
    'text/plain',
  ];
  const ALLOWED_EXTENSIONS = ['.xls', '.xlsx', '.csv', '.tsv', '.ods'];

  const handleFileUpload = (file) => {
    // Valider le type de fichier
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
    const isValidType = ALLOWED_TYPES.includes(file.type);

    if (!isValidExtension && !isValidType) {
      MySwal.fire({
        icon: 'error',
        title: 'Format non supporté',
        text: 'Veuillez importer un fichier Excel, CSV ou autre format de tableur.',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      MySwal.fire({
        icon: 'error',
        title: 'Fichier trop volumineux',
        text: 'La taille du fichier ne doit pas dépasser 50 MB.',
      });
      return;
    }

    setUploadedFile(file);
  };

  const simulateAnalysisSteps = () => {
    const steps = [
      { step: 1, message: 'Chargement du fichier...' },
      { step: 2, message: 'Analyse de la structure des données...' },
      { step: 3, message: 'Détection des colonnes et types...' },
      { step: 4, message: 'Calcul des statistiques...' },
      { step: 5, message: 'Identification des patterns...' },
      { step: 6, message: 'Génération du rapport...' },
      { step: 7, message: 'Finalisation de l\'analyse...' },
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingSteps((prev) => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        generateMockResults();
      }
    }, 800);

    return () => clearInterval(interval);
  };

  const generateMockResults = () => {
    const mockData = {
      summary: {
        totalRows: 2456,
        totalColumns: 12,
        missingValues: 145,
        missingPercentage: 5.9,
        duplicateRows: 23,
      },
      columnAnalysis: [
        {
          name: 'ID',
          type: 'Numérique',
          unique: 2433,
          nullCount: 0,
          mean: 1228.5,
          min: 1,
          max: 2456,
        },
        {
          name: 'Nom',
          type: 'Texte',
          unique: 2245,
          nullCount: 35,
          topValues: ['Jean', 'Marie', 'Pierre'],
        },
        {
          name: 'Age',
          type: 'Numérique',
          unique: 78,
          nullCount: 42,
          mean: 42.5,
          min: 18,
          max: 85,
        },
        {
          name: 'Email',
          type: 'Texte',
          unique: 2412,
          nullCount: 68,
          topValues: ['@gmail.com', '@yahoo.com', '@outlook.com'],
        },
      ],
      insights: [
        'Le dataset contient 2456 enregistrements avec 12 colonnes',
        '5.9% des données manquent, principalement dans les colonnes Nom et Email',
        'Il y a 23 lignes dupliquées basées sur l\'ID',
        'L\'âge moyen est de 42.5 ans, avec une plage de 18 à 85 ans',
        '92% de l\'email sont des domaines publics (Gmail, Yahoo, Outlook)',
      ],
    };

    setAnalysisResults(mockData);
    setIsAnalyzing(false);

    MySwal.fire({
      icon: 'success',
      title: 'Analyse terminée',
      text: 'Votre fichier a été analysé avec succès.',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleAnalyze = () => {
    if (!uploadedFile) {
      MySwal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez d\'abord importer un fichier.',
      });
      return;
    }

    if (!description.trim()) {
      MySwal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez décrire l\'analyse que vous souhaitez effectuer.',
      });
      return;
    }

    setIsAnalyzing(true);
    setLoadingSteps([]);
    setAnalysisResults(null);

    simulateAnalysisSteps();
  };

  const handleClearAll = () => {
    setUploadedFile(null);
    setDescription('');
    setIsAnalyzing(false);
    setLoadingSteps([]);
    setAnalysisResults(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#f0f7f3' }}
              >
                <BarChart3
                  className="w-6 h-6"
                  style={{ color: GREEN_COLOR }}
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analyse de Données
              </h1>
            </div>
            <p className="text-gray-600 ml-12">
              Importez et analysez vos fichiers Excel, CSV ou autres formats
              tabulaires ataoko
            </p>
          </div>

          {/* Upload Section */}
          <DataUploadSection
            onFileUpload={handleFileUpload}
            uploadedFile={uploadedFile}
            onClear={() => setUploadedFile(null)}
          />

          {/* Description Section */}
          <DataDescriptionSection
            description={description}
            onDescriptionChange={setDescription}
          />

          {/* Analyze Button */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!uploadedFile || isAnalyzing}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: GREEN_COLOR }}
            >
              {isAnalyzing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Analyser les données
                </>
              )}
            </button>

            {(uploadedFile || description) && (
              <button
                onClick={handleClearAll}
                disabled={isAnalyzing}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Loading Steps */}
          {isAnalyzing && <AnalysisLoader steps={loadingSteps} />}

          {/* Analysis Results */}
          {analysisResults && !isAnalyzing && (
            <AnalysisResults data={analysisResults} />
          )}
        </div>
      </div>

      {/* Export Sidebar */}
      {analysisResults && !isAnalyzing && (
        <ExportSidebar data={analysisResults} />
      )}
    </div>
  );
};

export default DataAnalysis;