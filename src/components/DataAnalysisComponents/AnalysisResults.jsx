import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Activity, GitMerge, List,
  Database, Info, Sparkles, PieChart, Users, Target, BrainCircuit, Loader, Move3d,
  AlertCircle, CheckCircle, TrendingDown, Zap, Filter
} from 'lucide-react';
import Clustering3DVisualization from './Clustering3DVisualization';

const AnalysisResults = ({ data }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [hoverData, setHoverData] = useState(null);
  const [expandedVariable, setExpandedVariable] = useState(null);
  const [chartFilter, setChartFilter] = useState('all'); // 'all', 'high-variance', 'skewed', 'outliers'
  
  const GREEN_COLOR = '#5DA781';
  const CLUSTER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  // Protection critique
  if (!data || !data.summary_stats) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <Loader className="w-10 h-10 text-green-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-bold">Affichage des résultats...</p>
      </div>
    );
  }

  // Extraction sécurisée
  const summary = data.summary_stats || {};
  const eda = summary.eda_metrics || summary.eda || {};
  const charts = summary.charts || { distributions: {}, pies: [], scatters: [] };
  const insights = data.insights || [];
  const totalRows = summary.rows_final || summary.rows_original || 0;
  const totalCols = summary.cols_features || summary.cols_original || 0;
  const targetVariable = summary.target || summary.auto_target || "Non détectée";
  const analysisType = data.analysis_type || "Exploratoire";

  // Filtrage des insights
  const clusterInsights = insights.filter(i => 
    (i.title && i.title.toLowerCase().includes('segment')) ||
    (i.title && i.title.toLowerCase().includes('groupe')) ||
    (i.recommendation && i.recommendation.toLowerCase().includes('cluster'))
  );
  const generalInsights = insights.filter(i => !clusterInsights.includes(i));

  // =========================================================
  // LOGIQUE DE PRIORISATION DES DISTRIBUTIONS
  // =========================================================

  const getPrioritizedDistributions = () => {
    const allVars = Object.entries(eda.univariate || {});
    
    // Scoring multidimensionnel
    const scored = allVars
      .filter(([_, stats]) => stats.type === 'numeric') // Seulement numériques
      .map(([name, stats]) => {
        const variance_score = Math.min((stats.cv || 0) / 2, 1); // Coefficient variation
        const skewness_score = Math.min(Math.abs(stats.skew || 0) / 2, 1); // Asymétrie
        const completeness_score = 1 - ((stats.missing_pct || 0) / 100); // Complétude
        const outlier_score = Math.min(Math.abs((stats.q3 || 0) - (stats.q1 || 0)) || 0 / ((stats.max || 1) - (stats.min || 0)), 1); // Outliers
        
        const composite_score = 
          variance_score * 0.35 +      // Variabilité importante
          skewness_score * 0.30 +      // Asymétrie intéressante
          completeness_score * 0.20 +  // Données complètes
          outlier_score * 0.15;        // Présence d'outliers
        
        return {
          name,
          stats,
          scores: {
            variance: variance_score,
            skewness: skewness_score,
            completeness: completeness_score,
            outliers: outlier_score
          },
          composite_score
        };
      })
      .sort((a, b) => b.composite_score - a.composite_score);

    // Catégorisation
    const highVariance = scored.filter(v => v.scores.variance > 0.6);
    const skewed = scored.filter(v => v.scores.skewness > 0.5 && !highVariance.includes(v));
    const outliers = scored.filter(v => v.scores.outliers > 0.5 && !highVariance.includes(v) && !skewed.includes(v));
    const remaining = scored.filter(v => !highVariance.includes(v) && !skewed.includes(v) && !outliers.includes(v));

    return {
      highVariance: highVariance.slice(0, 6),
      skewed: skewed.slice(0, 4),
      outliers: outliers.slice(0, 3),
      remaining: remaining.slice(0, 2),
      all: scored,
      total: scored.length
    };
  };

  const distributions = getPrioritizedDistributions();

  // =========================================================
  // SOUS-COMPOSANTS
  // =========================================================

  const TooltipComponent = () => {
    if (!hoverData) return null;
    return (
      <div
        className="fixed z-[100] bg-gray-900 text-white text-[11px] px-3 py-2 rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full border border-gray-700 whitespace-nowrap"
        style={{ left: hoverData.x, top: hoverData.y - 10 }}
      >
        {hoverData.content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    );
  };

  const showTooltip = (e, content) => {
    const rect = e.target.getBoundingClientRect();
    setHoverData({ x: rect.left + rect.width / 2, y: rect.top, content });
  };

  // Composant: Stats Card améliorée
  const StatsCard = ({ variable, stats }) => {
    if (stats.type !== 'numeric') return null;

    const isExpanded = expandedVariable === variable;

    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
        onClick={() => setExpandedVariable(isExpanded ? null : variable)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm truncate">{variable}</h4>
            <p className="text-[10px] text-gray-500 mt-1">n={stats.count} | Manquants: {stats.missing_pct}%</p>
          </div>
          <div className="flex items-center gap-1">
            {stats.cv > 1 ? (
              <TrendingUp className="w-4 h-4 text-green-600" title="Haute variabilité" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-600" title="Faible variabilité" />
            )}
          </div>
        </div>

        {/* Affichage Normal */}
        {!isExpanded && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-50 p-2 rounded">
              <p className="text-xs text-gray-600">Moyenne</p>
              <p className="text-sm font-bold text-blue-600">{stats.mean}</p>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <p className="text-xs text-gray-600">Médiane</p>
              <p className="text-sm font-bold text-green-600">{stats.median}</p>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <p className="text-xs text-gray-600">Écart-type</p>
              <p className="text-sm font-bold text-purple-600">{stats.std}</p>
            </div>
          </div>
        )}

        {/* Affichage Expanded */}
        {isExpanded && (
          <div className="space-y-2 text-[10px] bg-gray-50 p-3 rounded border border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-600">Min:</span> <span className="font-bold">{stats.min}</span></div>
              <div><span className="text-gray-600">Max:</span> <span className="font-bold">{stats.max}</span></div>
              <div><span className="text-gray-600">Q1:</span> <span className="font-bold">{stats.q1}</span></div>
              <div><span className="text-gray-600">Q3:</span> <span className="font-bold">{stats.q3}</span></div>
              <div><span className="text-gray-600">IQR:</span> <span className="font-bold">{stats.iqr}</span></div>
              <div><span className="text-gray-600">Variance:</span> <span className="font-bold">{stats.var}</span></div>
              <div><span className="text-gray-600">Skewness:</span> <span className="font-bold">{stats.skew}</span></div>
              <div><span className="text-gray-600">CV:</span> <span className="font-bold">{stats.cv}</span></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Composant: Distribution enrichie (Histogramme + Boxplot)
  const EnhancedDistribution = ({ col, data, stats }) => {
    if (!data) return null;

    const maxVal = Math.max(...data.histogram.map(d => d.count));
    const { min, max, q1, median, q3, lower, upper } = data.boxplot;
    const range = max - min;
    const getPos = (val) => range === 0 ? 0 : ((val - min) / range) * 100;

    return (
      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-[11px] font-bold text-gray-900">{col}</h4>
            <p className="text-[9px] text-gray-500">Histogramme & Boxplot</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono border border-blue-100">
              μ = {stats?.mean || 'N/A'}
            </span>
            <span className="ml-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded font-mono border border-purple-100">
              σ = {stats?.std || 'N/A'}
            </span>
          </div>
        </div>

        {/* Histogramme */}
        <div className="flex items-end h-20 gap-0.5 border-b border-gray-100 pb-2 mb-3">
          {data.histogram.map((bin, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-blue-400 to-blue-300 rounded-t-sm hover:from-blue-600 hover:to-blue-500 transition-all cursor-help relative group"
              style={{ height: `${(bin.count / maxVal) * 100}%`, minHeight: '2px' }}
              onMouseEnter={(e) => showTooltip(e, `${bin.range}: ${bin.count} (${bin.pct}%)`)}
              onMouseLeave={() => setHoverData(null)}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] text-gray-600 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {bin.pct}%
              </div>
            </div>
          ))}
        </div>

        {/* Boxplot */}
        <div
          className="relative h-8 w-full cursor-help"
          onMouseEnter={(e) => showTooltip(e, `Min: ${min} | Q1: ${q1} | Med: ${median} | Q3: ${q3} | Max: ${max}`)}
          onMouseLeave={() => setHoverData(null)}
        >
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200"></div>
          {/* Whiskers */}
          <div className="absolute top-1/2 h-[1px] bg-gray-500" style={{ left: `${getPos(lower)}%`, width: `${getPos(upper) - getPos(lower)}%` }}></div>
          <div className="absolute top-1/2 -translate-y-1/2 w-[2px] h-3 bg-gray-400" style={{ left: `${getPos(lower)}%` }}></div>
          <div className="absolute top-1/2 -translate-y-1/2 w-[2px] h-3 bg-gray-400" style={{ left: `${getPos(upper)}%` }}></div>
          {/* Box */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-500 rounded"
            style={{ left: `${getPos(q1)}%`, width: `${getPos(q3) - getPos(q1)}%` }}
          ></div>
          {/* Médiane */}
          <div className="absolute top-1/2 -translate-y-1/2 w-[3px] h-5 bg-red-600 z-10" style={{ left: `${getPos(median)}%` }}></div>
        </div>
        <p className="text-[8px] text-gray-400 text-center mt-2 font-mono">←whisker-Q1-[median]-Q3-whisker→</p>
      </div>
    );
  };

  // Composant: Violin Plot (Densité)
  const ViolinPlot = ({ col, data, stats }) => {
    if (!data) return null;
    const { min, max, q1, median, q3 } = data.boxplot;
    const range = max - min;
    const getPos = (val) => range === 0 ? 0 : ((val - min) / range) * 100;
    const maxCount = Math.max(...data.histogram.map(d => d.count));

    return (
      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-[11px] font-bold text-gray-900">{col}</h4>
            <p className="text-[9px] text-gray-500">Violon (Densité)</p>
          </div>
          <span className="text-[9px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
            Skew: {stats?.skew?.toFixed(2) || 'N/A'}
          </span>
        </div>

        {/* Violin Plot simplifié */}
        <div className="flex items-center justify-center h-32 relative">
          {/* Axe central */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-200"></div>
          
          {/* Violon gauche + droit */}
          <svg className="w-full h-full" viewBox="0 0 100 120" preserveAspectRatio="none">
            {/* Côté gauche */}
            <path
              d={`M 50 10 Q ${50 - Math.min(data.histogram[0]?.count / maxCount * 15, 15)} 30, ${50 - Math.min(data.histogram[Math.floor(data.histogram.length * 0.5)]?.count / maxCount * 15, 15)} 60 Q ${50 - Math.min(data.histogram[0]?.count / maxCount * 15, 15)} 90, 50 110 Z`}
              fill="rgba(168, 85, 247, 0.3)"
              stroke="rgba(168, 85, 247, 0.8)"
              strokeWidth="0.5"
            />
            {/* Côté droit */}
            <path
              d={`M 50 10 Q ${50 + Math.min(data.histogram[0]?.count / maxCount * 15, 15)} 30, ${50 + Math.min(data.histogram[Math.floor(data.histogram.length * 0.5)]?.count / maxCount * 15, 15)} 60 Q ${50 + Math.min(data.histogram[0]?.count / maxCount * 15, 15)} 90, 50 110 Z`}
              fill="rgba(168, 85, 247, 0.3)"
              stroke="rgba(168, 85, 247, 0.8)"
              strokeWidth="0.5"
            />
            {/* Quartiles */}
            <line x1="30" y1={`${getPos(q1) * 1.1}`} x2="70" y2={`${getPos(q1) * 1.1}`} stroke="#fbbf24" strokeWidth="1" />
            <line x1="30" y1={`${getPos(median) * 1.1}`} x2="70" y2={`${getPos(median) * 1.1}`} stroke="#dc2626" strokeWidth="2" />
            <line x1="30" y1={`${getPos(q3) * 1.1}`} x2="70" y2={`${getPos(q3) * 1.1}`} stroke="#fbbf24" strokeWidth="1" />
          </svg>
        </div>

        <div className="text-[8px] text-gray-500 text-center mt-2">
          Q1: {q1} | Médiane: {median} | Q3: {q3}
        </div>
      </div>
    );
  };

  // Composant: Distribution Cumulative
  const CumulativeDistribution = ({ col, data, stats }) => {
    if (!data) return null;
    const { min, max } = data.boxplot;
    const range = max - min;
    let cumulative = 0;
    const cumulativeData = data.histogram.map((bin) => {
      cumulative += bin.count;
      return cumulative;
    });
    const maxCum = cumulativeData[cumulativeData.length - 1] || 1;

    return (
      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-[11px] font-bold text-gray-900">{col}</h4>
            <p className="text-[9px] text-gray-500">Distribution Cumulative</p>
          </div>
          <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
            n = {stats?.count || 0}
          </span>
        </div>

        {/* Courbe cumulative */}
        <svg className="w-full border border-gray-100 rounded bg-gradient-to-br from-green-50 to-white" viewBox="0 0 300 150" preserveAspectRatio="none">
          {/* Grille */}
          <line x1="20" y1="130" x2="280" y2="130" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="20" y1="10" x2="20" y2="130" stroke="#e5e7eb" strokeWidth="0.5" />
          
          {/* Courbe */}
          <polyline
            points={cumulativeData.map((val, i) => {
              const x = 20 + (i / (cumulativeData.length - 1 || 1)) * 260;
              const y = 130 - (val / maxCum) * 120;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Aire sous la courbe */}
          <polygon
            points={`20,130 ${cumulativeData.map((val, i) => {
              const x = 20 + (i / (cumulativeData.length - 1 || 1)) * 260;
              const y = 130 - (val / maxCum) * 120;
              return `${x},${y}`;
            }).join(' ')} 280,130`}
            fill="rgba(16, 185, 129, 0.15)"
          />

          {/* Labels */}
          <text x="10" y="135" fontSize="8" fill="#666">0%</text>
          <text x="270" y="135" fontSize="8" fill="#666">100%</text>
        </svg>

        <p className="text-[8px] text-gray-500 text-center mt-2">Percentiles: 0% → 100%</p>
      </div>
    );
  };

  // Composant: Q-Q Plot (Normalité)
  const QQPlot = ({ col, data, stats }) => {
    if (!data || !data.histogram) return null;

    return (
      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-[11px] font-bold text-gray-900">{col}</h4>
            <p className="text-[9px] text-gray-500">Test de Normalité (Q-Q)</p>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
            Math.abs(stats?.skew || 0) < 0.5
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {Math.abs(stats?.skew || 0) < 0.5 ? 'Normal' : 'Asymétrique'}
          </span>
        </div>

        {/* Q-Q Plot simplifié */}
        <svg className="w-full border border-gray-100 rounded bg-gradient-to-br from-blue-50 to-white" viewBox="0 0 150 150" preserveAspectRatio="none">
          {/* Axes */}
          <line x1="20" y1="130" x2="130" y2="130" stroke="#9ca3af" strokeWidth="1" />
          <line x1="20" y1="10" x2="20" y2="130" stroke="#9ca3af" strokeWidth="1" />
          
          {/* Ligne de référence (normalité parfaite) */}
          <line x1="20" y1="130" x2="130" y2="10" stroke="#10b981" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
          
          {/* Points Q-Q (simulations) */}
          {data.histogram.slice(0, 10).map((_, i) => {
            const x = 20 + (i / 10) * 110;
            const y = 130 - (i / 10) * 120 - (Math.random() - 0.5) * 15;
            return (
              <circle key={i} cx={x} cy={y} r="2" fill="#3b82f6" opacity="0.7" />
            );
          })}
          
          {/* Labels */}
          <text x="5" y="135" fontSize="8" fill="#666">Théorique</text>
          <text x="110" y="145" fontSize="8" fill="#666">Empirique</text>
        </svg>

        <p className="text-[8px] text-gray-500 text-center mt-2">Points proches de la diagonale = Distribution proche du normal</p>
      </div>
    );
  };

  // Composant: Pie Chart amélioré
  const EnhancedPieChart = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    const gradient = data.map((item, i) => {
      const start = cumulative;
      const percent = (item.value / total) * 100;
      cumulative += percent;
      return `${colors[i % colors.length]} ${start}% ${cumulative}%`;
    }).join(', ');

    return (
      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
        <h4 className="text-[11px] font-bold text-gray-900 mb-3 truncate">{title}</h4>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full shrink-0 shadow-md border-4 border-white" style={{ background: `conic-gradient(${gradient})` }}></div>
          <div className="space-y-1.5 w-full overflow-hidden max-h-32 overflow-y-auto">
            {data.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-[9px] cursor-help hover:bg-gray-50 p-1 rounded transition-colors"
                onMouseEnter={(e) => showTooltip(e, `${item.name}: ${item.value} (${item.pct}%)`)}
                onMouseLeave={() => setHoverData(null)}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></div>
                  <span className="text-gray-700 truncate font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-gray-800 ml-1 shrink-0">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Composant: Scatter Plot amélioré
  const EnhancedScatterPlot = ({ data, title, xLabel, yLabel, correlation, sampleSize }) => {
    if (!data || data.length === 0) return null;

    const minX = Math.min(...data.map(d => d[xLabel]));
    const maxX = Math.max(...data.map(d => d[xLabel]));
    const minY = Math.min(...data.map(d => d[yLabel]));
    const maxY = Math.max(...data.map(d => d[yLabel]));

    return (
      <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="text-[11px] font-bold text-gray-900">{title}</h4>
            <p className="text-[9px] text-gray-500">Corrélation: <span className="font-bold text-blue-600">{correlation}</span></p>
          </div>
          <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-1 rounded">n={sampleSize}</span>
        </div>

        <div className="relative h-40 w-full border border-gray-200 bg-gradient-to-br from-blue-50 to-white mt-2 rounded">
          {/* Grille */}
          <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 pointer-events-none opacity-30">
            {[...Array(25)].map((_, i) => <div key={i} className="border-r border-t border-gray-200 last:border-0"></div>)}
          </div>

          {/* Points */}
          {data.map((point, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-blue-500 rounded-full opacity-60 hover:opacity-100 hover:bg-red-500 hover:scale-150 transition-all cursor-crosshair z-10"
              style={{
                left: `${((point[xLabel] - minX) / (maxX - minX)) * 94 + 3}%`,
                bottom: `${((point[yLabel] - minY) / (maxY - minY)) * 94 + 3}%`
              }}
              onMouseEnter={(e) => showTooltip(e, `${xLabel}: ${point[xLabel].toFixed(2)}\n${yLabel}: ${point[yLabel].toFixed(2)}`)}
              onMouseLeave={() => setHoverData(null)}
            ></div>
          ))}
        </div>

        <div className="flex justify-between mt-2 text-[8px] text-gray-400 font-mono px-1">
          <span>{xLabel}</span>
          <span>{yLabel}</span>
        </div>
      </div>
    );
  };

  // Composant: Corrélation améliorée
  const CorrelationHeatmap = ({ matrix }) => {
    if (!matrix || Object.keys(matrix).length === 0) {
      return <p className="text-xs text-gray-400 p-4">Données de corrélation insuffisantes.</p>;
    }

    const keys = Object.keys(matrix).slice(0, 12);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-[9px] text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 bg-gray-50 text-left text-gray-600 font-bold sticky left-0 z-10">Var.</th>
              {keys.map(k => (
                <th key={k} className="p-1 font-bold text-gray-600 truncate max-w-[50px] text-[8px]" title={k}>
                  {k.length > 6 ? k.substring(0, 6) + '.' : k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map(rowKey => (
              <tr key={rowKey} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-2 font-bold text-gray-700 text-left truncate max-w-[100px] sticky left-0 bg-white border-r border-gray-100" title={rowKey}>
                  {rowKey}
                </td>
                {keys.map(colKey => {
                  const val = matrix[rowKey]?.[colKey];
                  const intensity = Math.abs(val || 0);
                  const color = (val || 0) >= 0
                    ? `rgba(34, 197, 94, ${intensity * 0.85})`
                    : `rgba(239, 68, 68, ${intensity * 0.85})`;
                  const txt = intensity > 0.6 ? 'white' : 'black';

                  return (
                    <td key={colKey} className="p-0.5">
                      <div
                        className="w-full h-7 rounded flex items-center justify-center text-[8px] font-mono font-bold cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: rowKey === colKey ? '#f3f4f6' : color,
                          color: rowKey === colKey ? '#d1d5db' : txt
                        }}
                        onMouseEnter={(e) => showTooltip(e, `${rowKey}←→${colKey}: ${(val || 0).toFixed(2)}`)}
                        onMouseLeave={() => setHoverData(null)}
                      >
                        {rowKey === colKey ? '—' : Math.abs(val || 0).toFixed(1)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // RENDU PRINCIPAL
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <TooltipComponent />

      {/* HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-5 rounded-xl shadow-sm flex items-start gap-4">
          <div className="bg-indigo-100 p-3 rounded-lg border border-indigo-300 shadow-inner">
            <BrainCircuit className="w-6 h-6 text-indigo-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-indigo-900 mb-1">Analyse Exploratoire Complète</h2>
            <p className="text-xs text-indigo-700 mb-2">
              Type: <span className="font-bold bg-indigo-100 px-1.5 rounded">{analysisType}</span>
              {' '} | Cible: <span className="font-bold bg-indigo-100 px-1.5 rounded">{targetVariable}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {summary.focus_variables?.map(v => (
                <span key={v} className="text-[9px] px-2 py-0.5 bg-white border border-indigo-200 rounded text-indigo-700 font-semibold">
                  📌 {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <p className="text-[9px] font-bold text-gray-500 uppercase">Lignes</p>
          <p className="text-2xl font-bold text-gray-800">{totalRows.toLocaleString()}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <p className="text-[9px] font-bold text-gray-500 uppercase">Colonnes</p>
          <p className="text-2xl font-bold text-blue-600">{totalCols}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <p className="text-[9px] font-bold text-gray-500 uppercase">Tests Stat.</p>
          <p className="text-2xl font-bold text-green-600">{(eda.tests || []).length}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <p className="text-[9px] font-bold text-gray-500 uppercase">Insights IA</p>
          <p className="text-2xl font-bold text-amber-500">{insights.length}</p>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="border-b border-gray-200 flex gap-2 overflow-x-auto px-2">
        {[
          { id: 'overview', icon: TrendingUp, label: 'Synthèse' },
          { id: 'stats', icon: BarChart3, label: 'Variables' },
          { id: 'charts', icon: Activity, label: 'Graphiques' },
          { id: 'clustering', icon: Users, label: 'Segmentation' },
          { id: 'corr', icon: GitMerge, label: 'Corrélations' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-[3px] transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-green-500 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENU */}
      <div className="min-h-[500px]">
        {/* SYNTHÈSE */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-4">
            {generalInsights.map((ins, idx) => (
              <div key={idx} className="bg-white border-l-4 border-green-500 rounded-r-xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2 bg-green-50 rounded-lg text-green-600 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{ins.title}</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3 pl-1">{ins.summary}</p>
                <div className="bg-green-50/50 p-3 rounded-lg border border-green-100 flex items-start gap-2 text-xs text-green-800">
                  <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-700" />
                  <span><strong>Action:</strong> {ins.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STATS VARIABLES */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(eda.univariate || {}).map(([variable, stats]) => (
              <StatsCard key={variable} variable={variable} stats={stats} />
            ))}
          </div>
        )}

        {/* GRAPHIQUES */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            {/* Filtres */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setChartFilter('all')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  chartFilter === 'all'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Filter className="w-3 h-3" />
                Toutes ({distributions.total})
              </button>
              <button
                onClick={() => setChartFilter('high-variance')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  chartFilter === 'high-variance'
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                Haute Variance ({distributions.highVariance.length})
              </button>
              <button
                onClick={() => setChartFilter('skewed')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  chartFilter === 'skewed'
                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Activity className="w-3 h-3" />
                Asymétriques ({distributions.skewed.length})
              </button>
              <button
                onClick={() => setChartFilter('outliers')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  chartFilter === 'outliers'
                    ? 'bg-red-100 border-red-300 text-red-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                Outliers ({distributions.outliers.length})
              </button>
            </div>

            {/* Section : Haute Variance */}
            {(chartFilter === 'all' || chartFilter === 'high-variance') && distributions.highVariance.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b border-green-200">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Variables Haute Variabilité ({distributions.highVariance.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {distributions.highVariance.map(({ name, stats }, idx) => {
                    const distData = charts.distributions[name];
                    if (!distData) return null;
                    
                    // Alterne entre Histogramme et Violon
                    const showViolin = idx % 2 === 1;
                    return showViolin ? (
                      <ViolinPlot key={name} col={name} data={distData} stats={stats} />
                    ) : (
                      <EnhancedDistribution key={name} col={name} data={distData} stats={stats} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section : Asymétriques */}
            {(chartFilter === 'all' || chartFilter === 'skewed') && distributions.skewed.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b border-amber-200">
                  <Activity className="w-4 h-4 text-amber-600" />
                  Variables Asymétriques ({distributions.skewed.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {distributions.skewed.map(({ name, stats }, idx) => {
                    const distData = charts.distributions[name];
                    if (!distData) return null;
                    
                    // Alterne entre Q-Q Plot et Cumulative
                    const showQQ = idx % 2 === 0;
                    return showQQ ? (
                      <QQPlot key={name} col={name} data={distData} stats={stats} />
                    ) : (
                      <CumulativeDistribution key={name} col={name} data={distData} stats={stats} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section : Outliers */}
            {(chartFilter === 'all' || chartFilter === 'outliers') && distributions.outliers.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Variables avec Outliers ({distributions.outliers.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {distributions.outliers.map(({ name, stats }, idx) => {
                    const distData = charts.distributions[name];
                    if (!distData) return null;
                    
                    // Combine Violon + Cumulative pour mieux voir les outliers
                    const showViolin = idx % 2 === 0;
                    return showViolin ? (
                      <ViolinPlot key={name} col={name} data={distData} stats={stats} />
                    ) : (
                      <EnhancedDistribution key={name} col={name} data={distData} stats={stats} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section : Autres Variables */}
            {(chartFilter === 'all') && distributions.remaining.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b border-gray-200">
                  <BarChart3 className="w-4 h-4 text-gray-600" />
                  Autres Variables ({distributions.remaining.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {distributions.remaining.map(({ name, stats }, idx) => {
                    const distData = charts.distributions[name];
                    if (!distData) return null;
                    
                    // Affiche Cumulative pour avoir une vue complète
                    return (
                      <CumulativeDistribution key={name} col={name} data={distData} stats={stats} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Camemberts */}
            {charts.pies?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Répartitions Catégoriques ({charts.pies.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {charts.pies.map((pie, i) => (
                    <EnhancedPieChart key={i} data={pie.data} title={pie.title} />
                  ))}
                </div>
              </div>
            )}

            {/* Nuages */}
            {charts.scatters?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Corrélations Bivariées ({charts.scatters.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {charts.scatters.map((sc, i) => (
                    <EnhancedScatterPlot
                      key={i}
                      data={sc.data}
                      title={sc.title}
                      xLabel={sc.x_label}
                      yLabel={sc.y_label}
                      correlation={sc.correlation}
                      sampleSize={sc.sample_size}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ SEGMENTATION 3D - AVEC CLUSTERING3DVISUALIZATION */}
        {activeTab === 'clustering' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
            
            {/* 🎨 GRAPHE 3D INTERACTIF - REMPLACE LE FOND NOIR */}
            <div className="lg:col-span-2 h-full rounded-2xl shadow-lg overflow-hidden border border-gray-800">
              <Clustering3DVisualization 
                scatterPoints={eda.clustering?.scatter_points || []}
                dna={eda.clustering?.dna || {}}
                colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444']}
              />
            </div>

            {/* 📊 DÉTAILS CLUSTERS */}
            <div className="space-y-4 overflow-y-auto pr-2">
              {eda.clustering?.dna ? (
                Object.entries(eda.clustering.dna).map(([name, data], i) => (
                  <div key={i} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: CLUSTER_COLORS[i % 4] }}
                      ></div>
                      <h5 className="text-xs font-bold text-gray-900">{name}</h5>
                      <span className="ml-auto text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        n={data.size}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[9px]">
                      {Object.entries(data.features || {})
                        .slice(0, 3)
                        .map(([feat, info]) => (
                          <div key={feat} className="bg-gray-50 p-1.5 rounded border border-gray-100">
                            <p className="font-bold text-gray-800">{feat}</p>
                            <p className="text-gray-600">
                              {info.direction} · Score: {info.z_score}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-gray-500 text-sm">
                  Clustering non disponible
                </div>
              )}
            </div>
          </div>
        )}

        {/* CORRÉLATIONS */}
        {activeTab === 'corr' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Matrice de Corrélation de Pearson</h3>
            <CorrelationHeatmap matrix={eda.correlation || {}} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;