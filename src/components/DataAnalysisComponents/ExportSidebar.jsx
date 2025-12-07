import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Share2,
  Globe,
  CheckCircle,
  Loader,
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const ExportSidebar = ({ data }) => {
  const [exporting, setExporting] = useState(null);
  const GREEN_COLOR = '#5DA781';

  const handleExport = async (format) => {
    setExporting(format);

    // Simuler l'export
    setTimeout(() => {
      MySwal.fire({
        icon: 'success',
        title: 'Export réussi',
        text: `Votre fichier a été téléchargé au format ${format}.`,
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
      description: 'Télécharger au format .xlsx',
      color: '#22c55e',
    },
    {
      id: 'csv',
      name: 'CSV',
      icon: FileText,
      description: 'Télécharger au format .csv',
      color: '#3b82f6',
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      icon: Globe,
      description: 'Créer un Google Sheet',
      color: '#f59e0b',
    },
    {
      id: 'google-forms',
      name: 'Google Forms',
      icon: Share2,
      description: 'Créer un Google Form',
      color: '#8b5cf6',
    },
    {
      id: 'kobotools',
      name: 'KoboToolbox',
      icon: FileSpreadsheet,
      description: 'Exporter pour KoboToolbox',
      color: '#ec4899',
    },
  ];

  return (
    <div className="w-80 bg-white border-l border-gray-300 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Download
            className="w-5 h-5"
            style={{ color: GREEN_COLOR }}
          />
          <h3 className="text-lg font-bold text-gray-900">Exporter les résultats</h3>
        </div>
        <p className="text-xs text-gray-600">
          Choisissez le format de téléchargement
        </p>
      </div>

      {/* Export Options */}
      <div className="space-y-3">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isExporting = exporting === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleExport(option.id)}
              disabled={isExporting}
              className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 text-left space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${option.color}20` }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: option.color }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {option.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {option.description}
                    </p>
                  </div>
                </div>

                {isExporting ? (
                  <Loader className="w-4 h-4 text-gray-600 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Summary */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">
          Résumé de l'export
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Lignes</span>
            <span className="font-semibold text-gray-900">
              {data.summary.totalRows.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Colonnes</span>
            <span className="font-semibold text-gray-900">
              {data.summary.totalColumns}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Formats</span>
            <span className="font-semibold text-gray-900">
              {exportOptions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Features */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">
          Capacités
        </h4>

        <div className="space-y-2">
          {[
            'Export de toutes les données',
            'Préservation du formatage',
            'Métadonnées incluses',
            'Compatibilité multi-plateforme',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Help */}
      <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs font-medium text-blue-900">💡 Besoin d'aide?</p>
        <p className="text-xs text-blue-800 leading-relaxed">
          Consultez notre documentation pour des instructions détaillées sur chaque
          format d'export.
        </p>
      </div>
    </div>
  );
};

export default ExportSidebar;