import React, { useState, useRef, useEffect } from 'react';
import {
  Users, Volume2, VolumeX, ChevronUp, ChevronDown, Info, Target, Loader,
  AlertCircle, CheckCircle, TrendingUp, Eye, Sparkles
} from 'lucide-react';
import Clustering3DVisualization from './Clustering3DVisualization';

const ClusteringTabSection = ({ eda, activeTab, ttsEngineRef, isSpeaking, setIsSpeaking, ttsEnabled, setTtsEnabled }) => {
  const [activeClusteringTab, setActiveClusteringTab] = useState(null);
  const [expandedExplanation, setExpandedExplanation] = useState(true);
  const [expandedGroupIndex, setExpandedGroupIndex] = useState(null);
  
  const autoTTSRef = useRef(false);
  const ttsTimeoutRef = useRef(null);

  // COULEURS CLUSTERING: 8 couleurs + GRIS pour clusters dispersés
  const CLUSTER_COLORS = [
    '#dc2626', '#2563eb', '#16a34a', '#ea580c',
    '#7c3aed', '#0891b2', '#db2777', '#f59e0b',
    '#9ca3af'  // Gris pour données trop dispersées
  ];

  // 🔧 INIT activeClusteringTab
  useEffect(() => {
    if (activeClusteringTab === null && eda.multi_clustering?.clusterings) {
      const keys = Object.keys(eda.multi_clustering.clusterings);
      if (keys.length > 0) {
        setActiveClusteringTab(keys[0]);
      }
    }
  }, [eda.multi_clustering?.clusterings, activeClusteringTab]);

  // 🎤 AUTO TTS À L'OUVERTURE DE L'ONGLET CLUSTERING
  useEffect(() => {
    if (activeTab === 'clustering' && activeClusteringTab && ttsEnabled && ttsEngineRef.current && !autoTTSRef.current) {
      // Petit délai pour laisser le composant se monter complètement
      ttsTimeoutRef.current = setTimeout(() => {
        const explanation = getActiveClusteringExplanation();
        if (explanation && explanation.tts_text) {
          autoTTSRef.current = true;
          ttsEngineRef.current.speak(explanation.tts_text);
          setIsSpeaking(true);
        }
      }, 800);
    }

    return () => {
      if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
    };
  }, [activeTab, activeClusteringTab, ttsEnabled]);

  // 🔧 RESET autoTTSRef quand on quitte l'onglet
  useEffect(() => {
    if (activeTab !== 'clustering') {
      autoTTSRef.current = false;
    }
  }, [activeTab]);

  const getActiveClusteringExplanation = () => {
    if (activeClusteringTab && eda.multi_clustering?.clusterings?.[activeClusteringTab]?.explanation) {
      return eda.multi_clustering.clusterings[activeClusteringTab].explanation;
    }

    // Fallback
    return {
      title: "Segmentation Intelligente",
      summary: "L'analyse de clustering identifie des groupes naturels dans les données.",
      recommendation: "Explorez la visualisation 3D pour découvrir les patterns.",
      details: {},
      tts_text: "L'analyse de clustering a été complétée. Examinez les groupes identifiés dans la visualisation 3D."
    };
  };

  const detectDataDispersion = () => {
    if (!activeClusteringTab || !eda.multi_clustering?.clusterings?.[activeClusteringTab]) {
      return { isDispersed: false, dispersalScore: 0 };
    }

    const clustering = eda.multi_clustering.clusterings[activeClusteringTab];
    const silhouetteScore = clustering.silhouette_score || 0;
    const validation = clustering.validation || {};
    const balanceRatio = validation.balance_ratio || 0;

    // Score de dispersal: plus silhouette est bas, plus les données sont dispersées
    const dispersalScore = Math.max(0, 1 - silhouetteScore);
    const isDispersed = silhouetteScore < 0.3 || balanceRatio < 0.15;

    return { isDispersed, dispersalScore, silhouetteScore, balanceRatio };
  };

  const generateDetailedExplanation = (clustering, groupIndex, groupData, dispersalInfo) => {
    const explanation = {
      title: `Groupe ${groupIndex + 1} - Profil Détaillé`,
      overview: "",
      characteristics: [],
      interpretation: "",
      recommendation: "",
      size: groupData.size,
      percentage: groupData.percentage,
      distinctiveness: groupData.distinctiveness
    };

    // Vue d'ensemble du groupe
    explanation.overview = `Ce groupe représente ${groupData.percentage}% des données (${groupData.size} points). `;

    if (dispersalInfo.isDispersed) {
      explanation.overview += `⚠️ Les données sont très dispersées dans l'espace, ce qui indique que les groupes ne sont pas très distincts. `;
      explanation.overview += `Ce groupe se concentre sur certaines caractéristiques mais avec un chevauchement significatif avec d'autres groupes.`;
    } else {
      explanation.overview += `Ce groupe est bien défini et clairement séparé des autres groupes.`;
    }

    // Caractéristiques principales
    if (groupData.features) {
      const features = Object.entries(groupData.features);
      explanation.characteristics = features.map(([feat, info]) => ({
        feature: feat,
        value: info.value,
        direction: info.direction,
        zScore: info.z_score,
        interpretation: info.interpretation,
        importance: info.importance
      }));
    }

    // Interprétation détaillée
    const topFeatures = explanation.characteristics.slice(0, 3);
    if (topFeatures.length > 0) {
      explanation.interpretation = `Ce groupe se caractérise principalement par : `;
      explanation.interpretation += topFeatures
        .map(f => `${f.direction} en ${f.feature} (${Math.abs(f.zScore)} écarts-types)`)
        .join(', ');
      explanation.interpretation += ". ";
    }

    // Distance au centroïde global
    if (groupData.centroid_distance) {
      explanation.interpretation += `La distance moyenne au centre global est de ${groupData.centroid_distance} unités. `;
      if (groupData.centroid_distance > 2) {
        explanation.interpretation += "Ce groupe est très distinct du point central.";
      } else {
        explanation.interpretation += "Ce groupe est proche du centre global.";
      }
    }

    // Recommandation
    explanation.recommendation = `Utilisation : Ce groupe peut être utilisé pour `;
    if (groupData.percentage > 40) {
      explanation.recommendation += `la segmentation principale de votre population, `;
    } else if (groupData.percentage < 10) {
      explanation.recommendation += `identifier une niche ou un segment spécifique, `;
    }
    explanation.recommendation += `cibler des actions spécifiques ou développer des stratégies adaptées.`;

    if (dispersalInfo.isDispersed) {
      explanation.recommendation += ` ⚠️ Considérez également d'autres variables ou méthodes de clustering.`;
    }

    return explanation;
  };

  const toggleTTS = () => {
    setTtsEnabled(!ttsEnabled);
    if (ttsEngineRef.current && !ttsEnabled) {
      ttsEngineRef.current.stop();
    }
  };

  const speakClusteringExplanation = () => {
    if (ttsEngineRef.current) {
      const explanation = getActiveClusteringExplanation();
      if (explanation.tts_text) {
        ttsEngineRef.current.speak(explanation.tts_text);
        setIsSpeaking(true);
      } else if (explanation.summary) {
        const text = explanation.summary + " " + explanation.recommendation;
        ttsEngineRef.current.speak(text);
        setIsSpeaking(true);
      }
    }
  };

  const dispersalInfo = detectDataDispersion();
  const clustering = activeClusteringTab && eda.multi_clustering?.clusterings?.[activeClusteringTab];
  const explanation = getActiveClusteringExplanation();

  return (
    <div className="space-y-6">
      {/* 🔧 EN-TÊTE AVEC EXPLICATION */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-900">Segmentation Intelligente</h3>
                <p className="text-xs text-purple-700">
                  {eda.multi_clustering?.n_clustering_types || 0} modèles d'analyse
                </p>
              </div>
            </div>

            {/* Alerte si données dispersées */}
            {dispersalInfo.isDispersed && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-bold">⚠️ Données très dispersées détectées</p>
                    <p className="mt-1">
                      Les groupes identifiés montrent une dispersion significative. 
                      Les couleurs deviennent grises quand la séparation n'est pas nette. 
                      Cela suggère que les données ne forment pas de clusters très distincts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setExpandedExplanation(!expandedExplanation)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-all"
                >
                  {expandedExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expandedExplanation ? "Masquer l'explication" : "Afficher l'explication"}
                </button>

                <button
                  onClick={toggleTTS}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    ttsEnabled
                      ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-50'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {ttsEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  {ttsEnabled ? "Voix ON" : "Voix OFF"}
                </button>

                {ttsEnabled && (
                  <button
                    onClick={speakClusteringExplanation}
                    disabled={isSpeaking}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      isSpeaking
                        ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-50'
                        : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <Loader className="w-3 h-3 animate-spin" />
                        Arrêter
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        Écouter l'explication
                      </>
                    )}
                  </button>
                )}
              </div>

              {expandedExplanation && (
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-purple-100 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <h4 className="text-sm font-bold text-gray-900">{explanation.title}</h4>
                      <p className="text-xs text-gray-700 leading-relaxed">{explanation.summary}</p>
                      <div className="bg-purple-50 p-3 rounded border border-purple-100">
                        <p className="text-xs font-bold text-purple-800 mb-1">🎯 Recommandation :</p>
                        <p className="text-xs text-purple-700 leading-relaxed">{explanation.recommendation}</p>
                      </div>

                      {explanation.details && Object.keys(explanation.details).length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {Object.entries(explanation.details).map(([key, value]) => (
                            <div key={key} className="bg-white p-2 rounded border border-gray-200">
                              <p className="text-[10px] font-bold text-gray-500 uppercase">{key}</p>
                              <p className="text-xs font-semibold text-gray-800">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats rapides */}
          <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm min-w-[140px]">
            <div className="space-y-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {eda.multi_clustering?.n_clustering_types || 0}
                </p>
                <p className="text-[10px] text-purple-800 font-bold">Modèles</p>
              </div>
              <div className="h-px bg-purple-100"></div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">
                  {clustering?.n_clusters || 0}
                </p>
                <p className="text-[10px] text-gray-600 font-bold">Groupes</p>
              </div>
              <div className="h-px bg-purple-100"></div>
              <div className="text-center">
                <p className={`text-sm font-bold ${
                  dispersalInfo.silhouetteScore > 0.5 ? 'text-green-600' :
                  dispersalInfo.silhouetteScore > 0.3 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {dispersalInfo.silhouetteScore?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-[10px] text-gray-600 font-bold">Silhouette</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔧 TABS POUR SÉLECTIONNER LA SEGMENTATION */}
      {eda.multi_clustering?.clusterings && Object.keys(eda.multi_clustering.clusterings).length > 0 ? (
        <>
          <div className="flex gap-2 border-b border-gray-200 pb-3 overflow-x-auto flex-wrap">
            {Object.entries(eda.multi_clustering.clusterings).map(([key, clust]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveClusteringTab(key);
                  autoTTSRef.current = false; // Reset pour relancer auto-TTS
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold whitespace-nowrap rounded-t-lg transition-all border-b-2 ${
                  activeClusteringTab === key
                    ? 'bg-blue-100 text-blue-700 border-blue-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
                }`}
              >
                <Users className="w-4 h-4" />
                {clust.name}
                <span className="text-xs ml-1 opacity-75">(k={clust.n_clusters})</span>
                {clust.silhouette_score && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                    clust.silhouette_score > 0.5
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : clust.silhouette_score > 0.3
                      ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {clust.silhouette_score.toFixed(2)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* VISUALISATION 3D ET PROFILS */}
          {clustering && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* VISUALISATION 3D - 2/3 */}
              <div className="lg:col-span-2 h-[500px] rounded-2xl shadow-lg overflow-hidden border border-gray-800">
                <Clustering3DVisualization
                  scatterPoints={clustering.scatter_points || []}
                  dna={clustering.dna || {}}
                  colors={CLUSTER_COLORS}
                  isDispersed={dispersalInfo.isDispersed}
                />
              </div>

              {/* PROFILS DES GROUPES - 1/3 */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm sticky top-0 z-10">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    Profils Détaillés
                    <span className="text-xs text-gray-500 ml-auto">
                      {clustering.cluster_distribution?.length || 0}
                    </span>
                  </h4>

                  <div className="space-y-2">
                    {clustering.cluster_distribution?.map((dist, i) => {
                      const groupData = clustering.dna?.[`Groupe ${i + 1}`];
                      const isExpanded = expandedGroupIndex === i;

                      return (
                        <div
                          key={i}
                          className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
                        >
                          <button
                            onClick={() => setExpandedGroupIndex(isExpanded ? null : i)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 text-left">
                              <div
                                className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    dispersalInfo.isDispersed && dist.color_index >= 8
                                      ? CLUSTER_COLORS[8]
                                      : CLUSTER_COLORS[dist.color_index % CLUSTER_COLORS.length]
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900">Groupe {i + 1}</p>
                                <p className="text-[10px] text-gray-600">
                                  {dist.percentage}% • {dist.count} points
                                </p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-200 p-3 bg-white space-y-3 text-[10px]">
                              {groupData ? (
                                <>
                                  <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                    <p className="font-bold text-blue-900 mb-1">📊 Vue d'ensemble</p>
                                    <p className="text-blue-700 text-xs leading-relaxed">
                                      {(() => {
                                        const detailedExp = generateDetailedExplanation(
                                          clustering,
                                          i,
                                          groupData,
                                          dispersalInfo
                                        );
                                        return detailedExp.overview;
                                      })()}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="font-bold text-gray-800 mb-1.5">🎯 Caractéristiques principales</p>
                                    {Object.entries(groupData.features || {})
                                      .slice(0, 3)
                                      .map(([feat, info]) => (
                                        <div key={feat} className="bg-white p-2 rounded border border-gray-100 mb-1">
                                          <div className="flex justify-between items-start gap-1 mb-0.5">
                                            <span className="font-bold text-gray-800">{feat}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                              info.z_score > 0
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                              {info.z_score > 0 ? '+' : ''}{info.z_score}σ
                                            </span>
                                          </div>
                                          <p className="text-gray-600 text-[9px]">
                                            Valeur: <span className="font-bold text-gray-800">{info.value}</span>
                                          </p>
                                          <p className="text-gray-600 text-[9px] mt-0.5 leading-tight">
                                            {info.interpretation}
                                          </p>
                                        </div>
                                      ))}
                                  </div>

                                  <div className="bg-purple-50 p-2 rounded border border-purple-100">
                                    <p className="font-bold text-purple-900 mb-1">💡 Interprétation</p>
                                    <p className="text-purple-700 text-[9px] leading-tight">
                                      {(() => {
                                        const detailedExp = generateDetailedExplanation(
                                          clustering,
                                          i,
                                          groupData,
                                          dispersalInfo
                                        );
                                        return detailedExp.interpretation;
                                      })()}
                                    </p>
                                  </div>

                                  <div className="bg-green-50 p-2 rounded border border-green-100">
                                    <p className="font-bold text-green-900 mb-1">🚀 Recommandation</p>
                                    <p className="text-green-700 text-[9px] leading-tight">
                                      {(() => {
                                        const detailedExp = generateDetailedExplanation(
                                          clustering,
                                          i,
                                          groupData,
                                          dispersalInfo
                                        );
                                        return detailedExp.recommendation;
                                      })()}
                                    </p>
                                  </div>

                                  {groupData.distinctiveness && (
                                    <div className="border-t border-gray-200 pt-2">
                                      <div className="flex justify-between text-[9px] mb-1">
                                        <span className="text-gray-600">Distinctivité :</span>
                                        <span className="font-bold text-blue-600">
                                          {groupData.distinctiveness > 0.5
                                            ? 'Élevée'
                                            : groupData.distinctiveness > 0.3
                                            ? 'Moyenne'
                                            : 'Faible'}
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="bg-blue-500 h-1.5 rounded-full"
                                          style={{
                                            width: `${Math.min(groupData.distinctiveness * 100, 100)}%`
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-gray-500 italic">En cours d'analyse...</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Segmentation non disponible</p>
          <p className="text-xs text-gray-500 mt-1">
            Essayez avec plus de variables ou des données mieux structurées.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClusteringTabSection;