import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const AnalysisResults = ({ data }) => {
  const [expandedTab, setExpandedTab] = useState('summary');
  const GREEN_COLOR = '#5DA781';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg" style={{ backgroundColor: '#f0f7f3' }}>
          <BarChart3 className="w-6 h-6" style={{ color: GREEN_COLOR }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Résultats de l'analyse</h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Nombre de lignes</p>
          <p
            className="text-2xl font-bold"
            style={{ color: GREEN_COLOR }}
          >
            {data.summary.totalRows.toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Nombre de colonnes</p>
          <p
            className="text-2xl font-bold"
            style={{ color: GREEN_COLOR }}
          >
            {data.summary.totalColumns}
          </p>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Données manquantes</p>
          <p className="text-2xl font-bold text-orange-600">
            {data.summary.missingPercentage}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ({data.summary.missingValues})
          </p>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Lignes dupliquées</p>
          <p className="text-2xl font-bold text-red-600">
            {data.summary.duplicateRows}
          </p>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Qualité des données</p>
          <p
            className="text-2xl font-bold"
            style={{ color: GREEN_COLOR }}
          >
            {Math.round((100 - data.summary.missingPercentage) * 10) / 10}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-300">
        <button
          onClick={() => setExpandedTab('summary')}
          className={`px-4 py-3 font-medium text-sm transition-all ${
            expandedTab === 'summary'
              ? 'border-b-2 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{
            borderBottomColor: expandedTab === 'summary' ? GREEN_COLOR : 'transparent',
            backgroundColor: expandedTab === 'summary' ? GREEN_COLOR : 'transparent',
            borderRadius: expandedTab === 'summary' ? '4px 4px 0 0' : '0',
            color: expandedTab === 'summary' ? 'white' : 'inherit',
          }}
        >
          Résumé
        </button>
        <button
          onClick={() => setExpandedTab('columns')}
          className={`px-4 py-3 font-medium text-sm transition-all ${
            expandedTab === 'columns'
              ? 'border-b-2 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{
            borderBottomColor: expandedTab === 'columns' ? GREEN_COLOR : 'transparent',
            backgroundColor: expandedTab === 'columns' ? GREEN_COLOR : 'transparent',
            borderRadius: expandedTab === 'columns' ? '4px 4px 0 0' : '0',
            color: expandedTab === 'columns' ? 'white' : 'inherit',
          }}
        >
          Colonnes
        </button>
        <button
          onClick={() => setExpandedTab('insights')}
          className={`px-4 py-3 font-medium text-sm transition-all ${
            expandedTab === 'insights'
              ? 'border-b-2 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{
            borderBottomColor: expandedTab === 'insights' ? GREEN_COLOR : 'transparent',
            backgroundColor: expandedTab === 'insights' ? GREEN_COLOR : 'transparent',
            borderRadius: expandedTab === 'insights' ? '4px 4px 0 0' : '0',
            color: expandedTab === 'insights' ? 'white' : 'inherit',
          }}
        >
          Insights
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-4">
        {/* Summary Tab */}
        {expandedTab === 'summary' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Taille du dataset
                </p>
                <p className="text-2xl font-bold" style={{ color: GREEN_COLOR }}>
                  {data.summary.totalRows.toLocaleString()} ×{' '}
                  {data.summary.totalColumns}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {data.summary.totalRows * data.summary.totalColumns} cellules
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Complétude des données
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Complètes</span>
                    <span className="font-medium">
                      {100 - data.summary.missingPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${100 - data.summary.missingPercentage}%`,
                        backgroundColor: GREEN_COLOR,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Columns Tab */}
        {expandedTab === 'columns' && (
          <div className="space-y-3">
            {data.columnAnalysis.map((col, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{col.name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Type: <span className="font-medium">{col.type}</span>
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-white border border-gray-300">
                    {col.unique} uniques
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Valeurs nulles</p>
                    <p className="font-semibold text-gray-900">
                      {col.nullCount}
                    </p>
                  </div>

                  {col.type === 'Numérique' && (
                    <>
                      <div>
                        <p className="text-gray-600">Moyenne</p>
                        <p className="font-semibold text-gray-900">
                          {col.mean?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Min</p>
                        <p className="font-semibold text-gray-900">
                          {col.min}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Max</p>
                        <p className="font-semibold text-gray-900">
                          {col.max}
                        </p>
                      </div>
                    </>
                  )}

                  {col.type === 'Texte' && col.topValues && (
                    <div className="col-span-3">
                      <p className="text-gray-600">Valeurs principales</p>
                      <p className="text-gray-900 mt-1">
                        {col.topValues.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Insights Tab */}
        {expandedTab === 'insights' && (
          <div className="space-y-3">
            {data.insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">{insight}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;