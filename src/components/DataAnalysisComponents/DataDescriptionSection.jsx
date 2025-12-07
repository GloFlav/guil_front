import React, { useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

const DataDescriptionSection = ({ description, onDescriptionChange }) => {
  const textareaRef = useRef(null);
  const GREEN_COLOR = '#5DA781';

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        300
      ) + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [description]);

  return (
    <div className="space-y-4">
      {/* Label with Info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-semibold text-gray-900">
            📝 Décrire votre analyse
          </label>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 z-10 whitespace-normal">
              Décrivez les analyses que vous souhaitez effectuer sur vos
              données (statistiques, tendances, corrélations, etc.)
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Indiquez quel type d'analyse vous souhaitez effectuer
        </p>
      </div>

      {/* Textarea */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Ex: Analysez les tendances d'âge par région, identifiez les patterns manquants dans les données de contact, calculez les statistiques descriptives pour chaque colonne numérique..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm resize-none max-h-80 transition-colors"
          style={{
            focusRingColor: GREEN_COLOR,
          }}
          rows={3}
          onInput={autoResize}
        />

        {/* Character Count */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {description.length} caractères
          </p>
          {description.trim() && (
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              ✓ Prêt à analyser
            </span>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {!description.trim() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-900">Suggestions:</p>
          <div className="space-y-1 text-xs text-blue-800">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Calculer les statistiques descriptives</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Identifier les valeurs manquantes et les doublons</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Analyser les corrélations entre les variables</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Générer des visualisations et graphiques</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDescriptionSection;