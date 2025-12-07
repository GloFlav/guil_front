import React, { useRef } from 'react';
import { Upload, File, X } from 'lucide-react';

const DataUploadSection = ({ onFileUpload, uploadedFile, onClear }) => {
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const GREEN_COLOR = '#5DA781';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.style.backgroundColor = '#f0f7f3';
      dropZoneRef.current.style.borderColor = GREEN_COLOR;
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.style.backgroundColor = 'transparent';
      dropZoneRef.current.style.borderColor = '#d1d5db';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (dropZoneRef.current) {
      dropZoneRef.current.style.backgroundColor = 'transparent';
      dropZoneRef.current.style.borderColor = '#d1d5db';
    }

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          📁 Importer votre fichier de données
        </label>
        <p className="text-xs text-gray-600">
          Formats supportés: Excel (.xls, .xlsx), CSV (.csv), TSV (.tsv), ODS
          (.ods)
        </p>
      </div>

      {!uploadedFile ? (
        // Drop Zone
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer transition-all duration-200 hover:bg-gray-50"
          style={{
            borderColor: '#d1d5db',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".xls,.xlsx,.csv,.tsv,.ods"
          />

          <div className="space-y-3">
            <div className="flex justify-center">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: '#f0f7f3' }}
              >
                <Upload
                  className="w-8 h-8"
                  style={{ color: GREEN_COLOR }}
                />
              </div>
            </div>

            <div>
              <p className="text-lg font-semibold text-gray-900">
                Déposez votre fichier ici
              </p>
              <p className="text-sm text-gray-600 mt-1">
                ou cliquez pour parcourir
              </p>
            </div>

            <p className="text-xs text-gray-500">
              Taille maximale: 50 MB
            </p>
          </div>
        </div>
      ) : (
        // File Preview
        <div
          className="border-2 rounded-lg p-4 flex items-center justify-between"
          style={{ borderColor: GREEN_COLOR, backgroundColor: '#f0f7f3' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: GREEN_COLOR }}
            >
              <File className="w-6 h-6 text-white" />
            </div>

            <div>
              <p className="font-semibold text-gray-900">
                {uploadedFile.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            title="Supprimer le fichier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Alternative Upload Button */}
      {!uploadedFile && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Sélectionner un fichier
        </button>
      )}
    </div>
  );
};

export default DataUploadSection;