// frontend/components/dataAnalysisComponents/FilteredDataViewer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Download, Eye, EyeOff } from 'lucide-react';

const FilteredDataViewer = ({ fileStats, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les données du fichier filtré
  const loadFilteredData = async () => {
    if (!fileStats?.file_id || preview) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/files/${fileStats.file_id}/preview`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Erreur chargement données');
      
      const data = await response.json();
      setPreview(data.preview_data || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de charger les données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !preview) {
      loadFilteredData();
    }
  };

  const downloadCSV = () => {
    if (!preview || preview.length === 0) return;

    const headers = Object.keys(preview[0]);
    const csv = [
      headers.join(','),
      ...preview.map(row => 
        headers.map(h => {
          const val = row[h];
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
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
      {/* Header */}
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
          onClick={handleToggle}
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

      {/* Contenu */}
      {isOpen && (
        <div className="mt-4 space-y-3">
          {/* Tableau preview */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Chargement des données...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 text-sm">
              {error}
            </div>
          ) : preview && preview.length > 0 ? (
            <>
              <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      {Object.keys(preview[0]).map((col, idx) => (
                        <th key={idx} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row, ridx) => (
                      <tr key={ridx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        {Object.values(row).map((val, cidx) => (
                          <td key={cidx} className="px-3 py-2 text-gray-700 whitespace-nowrap truncate max-w-[200px]" title={val}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Info + Bouton */}
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="text-xs text-blue-700 font-medium">
                  {preview.length > 10 ? `Affichage: 10 premières lignes sur ${preview.length}` : `${preview.length} lignes`}
                </span>
                
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
                >
                  <Download className="w-3 h-3" />
                  Télécharger CSV
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              Aucune donnée disponible
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilteredDataViewer;