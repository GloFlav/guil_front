import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Share2,
  Globe,
  Loader,
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { surveyExportService } from '@/services/SurveyExportService'; // Import du service

const MySwal = withReactContent(Swal);

const SurveyExportSidebar = ({ data }) => {
  const [exporting, setExporting] = useState(null);
  const GREEN_COLOR = '#5DA781';

  // --- LOGIQUE DE TÉLÉCHARGEMENT FICHIER (Excel, CSV, Kobo) ---
  const handleDownloadFile = async (formatName, serviceMethod) => {
    try {
      // 1. Appel au backend pour générer le fichier
      const result = await surveyExportService[serviceMethod](data);

      if (result.success && result.filename) {
        // 2. Déclenchement du téléchargement
        await surveyExportService.downloadFile(result.filename);

        MySwal.fire({
          icon: 'success',
          title: 'Téléchargement lancé',
          text: `Votre fichier ${formatName} a été généré avec succès.`,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error(error);
      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Impossible de générer le fichier ${formatName}. Vérifiez que le serveur est accessible.`,
      });
    } finally {
      setExporting(null);
    }
  };

  // --- LOGIQUE SPÉCIALE GOOGLE FORMS ---
  const handleGoogleFormCreation = async () => {
    try {
      // Notification d'attente
      MySwal.fire({
        title: 'Communication avec Google...',
        text: 'Création du formulaire en cours. Cela peut prendre quelques secondes.',
        didOpen: () => {
          MySwal.showLoading();
        },
        allowOutsideClick: false,
      });

      // Appel au service
      const result = await surveyExportService.createGoogleForm(data);

      if (result.success) {
        const { responderUri, editUri } = result;

        // Affichage des liens
        MySwal.fire({
          icon: 'success',
          title: 'Formulaire Google Créé !',
          html: `
            <div class="flex flex-col gap-3 mt-4 text-left">
              <p class="text-sm text-gray-600 mb-2">Votre formulaire est prêt dans le Cloud.</p>
              
              <a href="${responderUri}" target="_blank" class="flex items-center justify-center gap-2 w-full p-3 bg-green-600 text-white rounded hover:bg-green-700 transition no-underline">
                <span>📝 Répondre au formulaire</span>
              </a>

              <a href="${editUri}" target="_blank" class="flex items-center justify-center gap-2 w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition no-underline">
                <span>⚙️ Modifier (Admin)</span>
              </a>
            </div>
          `,
          showConfirmButton: false,
          showCloseButton: true,
          width: '400px'
        });
      }
    } catch (error) {
      console.error(error);
      MySwal.fire({
        icon: 'error',
        title: 'Erreur Google API',
        text: "Impossible de créer le formulaire. Vérifiez les logs du serveur (authentification requise ?).",
      });
    } finally {
      setExporting(null);
    }
  };

  // --- DISPATCHER ---
  const handleExport = (format) => {
    setExporting(format);

    switch (format) {
      case 'excel':
        handleDownloadFile('Excel', 'generateExcel');
        break;
      case 'csv':
        handleDownloadFile('CSV', 'generateCsv');
        break;
      case 'kobotools':
        handleDownloadFile('KoboToolbox', 'generateKobo');
        break;
      case 'google-forms':
        handleGoogleFormCreation();
        break;
      case 'google-sheets':
        // On utilise le générateur Excel mais on indique que c'est pour Sheets
        handleDownloadFile('Compatible Google Sheets', 'generateExcel');
        break;
      default:
        setExporting(null);
        break;
    }
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
      hint: 'Formulaire en ligne (API)',
    },
    {
      id: 'kobotools',
      name: 'KoboToolbox',
      icon: FileSpreadsheet,
      description: 'Format KoboToolbox',
      color: '#ec4899',
      hint: 'Standard XLSForm',
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
              Les fichiers sont générés par le serveur. Google Forms nécessite une autorisation Google la première fois.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyExportSidebar;