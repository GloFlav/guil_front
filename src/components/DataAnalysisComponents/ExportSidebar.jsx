import React, { useState } from 'react';
import axios from 'axios';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  CheckCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trash2,
  Filter,
  History,
  FileCheck // Icone pour fichier validé
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const ExportSidebar = ({ data, isLocked }) => {
  const [openSection, setOpenSection] = useState('excel'); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [cleanConfig, setCleanConfig] = useState({
      removeSparse: false 
  });
  
  const API_URL = "http://localhost:8000/api/v1";

  // IDs des fichiers
  const cleanFileId = data.file_id || null;       
  const rawFileId = data.raw_file_id || null;     
  const rowCount = data.total_rows || 0;
  const removedAutoCount = data.removed_empty_columns ? data.removed_empty_columns.length : 0;

  const toggleSection = (id) => {
    // Si l'analyse est en cours, on empêche d'ouvrir/fermer
    if (isLocked) return; 
    setOpenSection(openSection === id ? null : id);
  };
  // --- TÉLÉCHARGEMENT SIMPLE ---
  const handleDirectDownload = (fileId, label) => {
      if (!fileId) return;
      const link = document.createElement('a');
      link.href = `${API_URL}/exports/${fileId}`; 
      link.setAttribute('download', label);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      MySwal.fire({
        icon: 'success', 
        title: 'Téléchargement lancé', 
        text: label,
        showConfirmButton: false, 
        timer: 1500
      });
  };

  // --- TÉLÉCHARGEMENT AVANCÉ (SPARSE) ---
  const handleAdvancedCleanDownload = async () => {
    if (!cleanFileId) return;

    setIsProcessing(true);
    try {
        const response = await axios.post(`${API_URL}/export/clean-download`, {
            file_id: cleanFileId,
            format: 'xlsx',
            remove_sparse: cleanConfig.removeSparse
        });

        if (response.data.success) {
            const link = document.createElement('a');
            link.href = `http://localhost:8000${response.data.download_url}`;
            link.setAttribute('download', `data_advanced_clean.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            MySwal.fire({
                icon: 'success',
                title: 'Export Avancé Réussi',
                html: `<p class="text-xs">Colonnes supplémentaires supprimées : <b>${response.data.removed_total}</b></p>`
            });
        }
    } catch (error) {
        console.error(error);
        MySwal.fire({icon: 'error', title: 'Erreur', text: 'Erreur technique.'});
    } finally {
        setIsProcessing(false);
    }
  };

  const exportOptions = [
    {
      id: 'excel',
      name: 'Excel (.xlsx)',
      icon: FileSpreadsheet,
      color: '#22c55e',
      content: (
        <div className="space-y-4 pt-2">
            
            {/* --- ZONE PRINCIPALE : LE FICHIER NETTOYÉ --- */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 relative overflow-hidden">
                {/* Badge "Recommandé" */}
                <div className="absolute top-0 right-0 bg-green-200 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                    PRÊT À L'EMPLOI
                </div>

                <div className="flex items-start gap-2 mb-3">
                    <FileCheck className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-green-900">Version Nettoyée</h4>
                        <p className="text-[10px] text-green-700 leading-tight mt-0.5">
                            Sans colonnes vides, doublons supprimés, types corrigés.
                        </p>
                        {removedAutoCount > 0 && (
                            <span className="inline-flex items-center gap-1 mt-1.5 bg-white px-1.5 py-0.5 rounded border border-green-200 text-[9px] text-green-600">
                                <Trash2 className="w-2.5 h-2.5" />
                                -{removedAutoCount} colonnes vides
                            </span>
                        )}
                    </div>
                </div>

                <button 
                    onClick={() => handleDirectDownload(cleanFileId, 'data_cleaned.xlsx')}
                    disabled={isProcessing || isLocked}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-all shadow-sm active:scale-95 group"
                >
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    <span className="text-xs font-bold">Télécharger ce fichier</span>
                </button>
            </div>

            {/* --- ZONE SECONDAIRE : L'ORIGINAL --- */}
            <div className="flex justify-center">
                <button 
                    onClick={() => handleDirectDownload(rawFileId, 'original_raw.xlsx')}
                    disabled={isProcessing || isLocked}
                    className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-gray-600 hover:underline transition-colors"
                >
                    <History className="w-3 h-3" />
                    Télécharger l'original non modifié (Backup)
                </button>
            </div>

            {/* --- SEPARATEUR --- */}
            <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-2 text-[9px] text-gray-400 uppercase font-semibold">Options Avancées</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* --- ZONE TERTIAIRE : NETTOYAGE POUSSÉ --- */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-3">
                <div className="flex items-start gap-2">
                    <input 
                        type="checkbox" 
                        id="sparseCheck"
                        checked={cleanConfig.removeSparse}
                        onChange={(e) => setCleanConfig({...cleanConfig, removeSparse: e.target.checked})}
                        className="mt-0.5 w-3.5 h-3.5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer" 
                    />
                    <label htmlFor="sparseCheck" className="cursor-pointer">
                        <span className="text-xs font-medium text-gray-700 block flex items-center gap-1">
                            Nettoyage Agressif (&gt;90% vide)
                            <Filter className="w-3 h-3 text-amber-500" />
                        </span>
                        <span className="text-[10px] text-gray-500 leading-tight">
                            Supprime aussi les colonnes quasi-vides.
                        </span>
                    </label>
                </div>

                <button 
                    onClick={handleAdvancedCleanDownload}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-1.5 p-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all text-xs font-medium"
                >
                    {isProcessing ? (
                        <>
                            <Loader className="w-3 h-3 animate-spin" />
                            <span>Calcul en cours...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>Générer version ultra-léagère</span>
                        </>
                    )}
                </button>
            </div>
        </div>
      )
    },
    {
      id: 'csv',
      name: 'CSV (.csv)',
      icon: FileText,
      color: '#3b82f6',
      content: (
        <div className="space-y-1.5 pt-1">
            <button className="w-full flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 text-xs text-gray-700 transition-colors">
                <span>Standard (UTF-8)</span>
                <Download className="w-3.5 h-3.5 text-gray-400" />
            </button>
        </div>
      )
    },
    {
      id: 'google',
      name: 'Google Workspace',
      icon: Globe,
      color: '#f59e0b',
      content: (
        <div className="pt-1">
            <div className="p-2 bg-orange-50 border border-orange-100 rounded text-center">
                <p className="text-[10px] text-orange-800 font-medium">Bientôt disponible</p>
            </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-20 animate-in slide-in-from-right duration-300">
      
      {/* Header Sidebar */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="p-1.5 bg-green-100 rounded-lg">
             <Download className="w-4 h-4 text-green-700" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Exporter</h3>
        </div>
        <p className="text-[10px] text-gray-500 ml-0.5">
          {rowCount > 0 ? `${rowCount} lignes prêtes à l'export` : 'En attente...'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isOpen = openSection === option.id;

          return (
            <div 
                key={option.id} 
                className={`border rounded-lg transition-all duration-300 overflow-hidden ${isOpen ? 'bg-white border-green-200 shadow-sm ring-1 ring-green-50' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              <button
                onClick={() => toggleSection(option.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded transition-colors ${isOpen ? 'bg-opacity-20' : 'bg-gray-50'}`} style={{ backgroundColor: isOpen ? `${option.color}30` : undefined }}>
                    <Icon className="w-4 h-4" style={{ color: isOpen ? option.color : '#9ca3af' }} />
                  </div>
                  <span className={`font-semibold text-xs ${isOpen ? 'text-gray-900' : 'text-gray-600'}`}>
                    {option.name}
                  </span>
                </div>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
              </button>

              <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="px-3 pb-3">
                        <div className="h-px w-full bg-gray-100 mb-2"></div>
                        {option.content}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
            <p className="text-[9px] text-gray-500 leading-relaxed">
                Format optimisé : Les fichiers générés sont nettoyés et prêts pour l'analyse.
            </p>
        </div>
      </div>

    </div>
  );
};

export default ExportSidebar;