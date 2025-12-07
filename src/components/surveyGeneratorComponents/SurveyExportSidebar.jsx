import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Share2,
  Globe,
  CheckCircle,
  Loader,
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const SurveyExportSidebar = ({ data }) => {
  const [exporting, setExporting] = useState(null);
  const GREEN_COLOR = '#5DA781';

  const handleExport = async (format) => {
    setExporting(format);

    // Simuler l'export
    setTimeout(() => {
      MySwal.fire({
        icon: 'success',
        title: 'Export réussi',
        text: `Votre questionnaire a été exporté au format ${format}.`,
        timer: 2000,
        showConfirmButton: false,
      });
      setExporting(null);
    }, 1500);
  };

  const exportOptions = [
    {
      id: 'excel',
      name: 'Excel',
      icon: FileSpreadsheet,
      description: 'Format .xlsx pour Excel',
      color: '#22c55e',
      hint: 'Parfait pour les analyses',
    },
    {
      id: 'csv',
      name: 'CSV',
      icon: FileText,
      description: 'Format .csv universel',
      color: '#3b82f6',
      hint: 'Compatible partout',
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      icon: Globe,
      description: 'Créer un Google Sheet',
      color: '#f59e0b',
      hint: 'Collaboration en temps réel',
    },
    {
      id: 'google-forms',
      name: 'Google Forms',
      icon: Share2,
      description: 'Créer un Google Form',
      color: '#8b5cf6',
      hint: 'Formulaire en ligne',
    },
    {
      id: 'kobotools',
      name: 'KoboToolbox',
      icon: FileSpreadsheet,
      description: 'Format KoboToolbox',
      color: '#ec4899',
      hint: 'Pour les enquêtes',
    },
  ];

  return (
    <div className="w-80 bg-white border-l border-gray-300 overflow-y-auto p-6 space-y-6 h-screen flex flex-col">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Download
            className="w-5 h-5"
            style={{ color: GREEN_COLOR }}
          />
          <h3 className="text-lg font-bold text-gray-900">Télécharger</h3>
        </div>
        <p className="text-xs text-gray-600">
          Exportez le questionnaire généré
        </p>
      </div>

      {/* Export Options */}
      <div className="space-y-3 flex-1">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isExporting = exporting === option.id;

          return (
            <div key={option.id}>
              <button
                onClick={() => handleExport(option.id)}
                disabled={isExporting}
                className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 text-left space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${option.color}20` }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: option.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {option.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {isExporting ? (
                    <Loader className="w-4 h-4 text-gray-600 animate-spin flex-shrink-0 mt-1" />
                  ) : (
                    <Download className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>

              {/* Hint */}
              <p className="text-xs text-gray-500 px-4 py-1">
                {option.hint}
              </p>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Summary */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">
          📊 Résumé du questionnaire
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Catégories</span>
            <span className="font-semibold text-gray-900">
              {data.categories?.length || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Questions</span>
            <span className="font-semibold text-gray-900">
              {data.categories?.reduce((sum, cat) => sum + (cat.questions?.length || 0), 0) || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Localités</span>
            <span className="font-semibold text-gray-900">
              {data.locations?.length || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Durée estimée</span>
            <span className="font-semibold text-gray-900">
              {data.metadata?.survey_total_duration || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Info Box */}
      <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-blue-900">Formats disponibles</p>
            <p className="text-xs text-blue-800 leading-relaxed mt-1">
              Choisissez le format qui correspond à votre besoin: Excel pour l'analyse, Google Forms pour la collecte en ligne, ou KoboToolbox pour les enquêtes terrain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyExportSidebar;