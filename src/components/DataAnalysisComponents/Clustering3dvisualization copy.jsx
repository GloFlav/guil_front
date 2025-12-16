import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Loader, RotateCw, AlertTriangle, Maximize2, Minimize2, ZoomIn, ZoomOut, Info } from 'lucide-react';

// 🎨 PALETTE DE 8 COULEURS DISTINCTES
const CLUSTER_COLORS = [
  '#3b82f6', // Bleu
  '#ef4444', // Rouge
  '#22c55e', // Vert
  '#f59e0b', // Orange
  '#8b5cf6', // Violet
  '#ec4899', // Rose
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

const Clustering3DVisualization = ({ 
  scatterPoints = [], 
  dna = {}, 
  colors = CLUSTER_COLORS, 
  isDispersed = false,
  silhouetteScore = null,
  methodUsed = '',
  quality3D = 0.5
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const requestRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Calcul de la qualité 3D locale
  const calculate3DQuality = (points) => {
    if (!points || points.length === 0) return 0;
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const zs = points.map(p => p.z);
    
    const variance = (arr) => {
      if (arr.length === 0) return 0;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    };
    
    const varX = variance(xs);
    const varY = variance(ys);
    const varZ = variance(zs);
    
    const maxVar = Math.max(varX, varY, varZ);
    const minVar = Math.min(varX, varY, varZ);
    
    return maxVar > 0 ? minVar / maxVar : 0;
  };

  // --- 1. DONNÉES ---
  const pointsToRender = useMemo(() => {
    if (scatterPoints && scatterPoints.length > 0) return scatterPoints;
    
    // Fallback: générer des points à partir du DNA
    if (dna && Object.keys(dna).length > 0) {
      const generated = [];
      let clusterIndex = 0;
      
      Object.entries(dna).forEach(([_, clusterData]) => {
        const size = clusterData.size || 30;
        const pointCount = Math.min(size, 100);
        
        // Positionner les clusters sur une sphère
        const angle = (2 * Math.PI * clusterIndex) / Object.keys(dna).length;
        const radius = 8;
        const centerX = radius * Math.cos(angle);
        const centerY = (clusterIndex % 2 === 0 ? 1 : -1) * 4;
        const centerZ = radius * Math.sin(angle);
        
        for (let i = 0; i < pointCount; i++) {
          generated.push({
            x: centerX + (Math.random() - 0.5) * 6,
            y: centerY + (Math.random() - 0.5) * 6,
            z: centerZ + (Math.random() - 0.5) * 6,
            cluster: clusterIndex
          });
        }
        clusterIndex++;
      });
      return generated;
    }
    
    return [];
  }, [scatterPoints, dna]);

  const localQuality3D = useMemo(() => quality3D || calculate3DQuality(pointsToRender), [pointsToRender, quality3D]);

  // Comptage des clusters
  const clusterStats = useMemo(() => {
    if (!pointsToRender.length) return { count: 0, sizes: {} };
    
    const sizes = {};
    pointsToRender.forEach(p => {
      const c = p.cluster;
      sizes[c] = (sizes[c] || 0) + 1;
    });
    
    return {
      count: Object.keys(sizes).length,
      sizes
    };
  }, [pointsToRender]);

  // --- 2. UTILITAIRES ---
  const createTextLabel = (text, position, color = 'white', size = 28) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${size}px Arial`;
    const textWidth = ctx.measureText(text).width;
    canvas.width = textWidth + 20;
    canvas.height = size + 20;
    
    ctx.font = `bold ${size}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true, 
      opacity: 0.85 
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.position.copy(position);
    sprite.scale.set(5, 2.5, 1);
    return sprite;
  };

  const createAxis = (start, end, color, label) => {
    const group = new THREE.Group();
    
    // Ligne de l'axe
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ 
      color: color, 
      opacity: 0.7, 
      transparent: true, 
      linewidth: 2 
    });
    const line = new THREE.Line(geometry, material);
    group.add(line);

    // Label
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const labelPos = end.clone().add(direction.multiplyScalar(2));
    const labelSprite = createTextLabel(label, labelPos, color);
    group.add(labelSprite);

    return group;
  };

  // --- 3. RENDU 3D ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    if (pointsToRender.length === 0) { 
      setIsLoading(false); 
      return; 
    }

    try {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // SCENE
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111827); // gray-900
      sceneRef.current = scene;

      // CAMERA
      const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
      camera.position.set(35, 25, 45);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // RENDERER
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current, 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      rendererRef.current = renderer;

      // --- LUMIÈRES ---
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambientLight);
      
      const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
      dirLight.position.set(15, 25, 15);
      scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
      fillLight.position.set(-15, 10, -15);
      scene.add(fillLight);

      const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
      backLight.position.set(0, -10, -20);
      scene.add(backLight);

      // AXES
      const axisGroup = new THREE.Group();
      axisGroup.add(createAxis(
        new THREE.Vector3(-25, 0, 0), 
        new THREE.Vector3(25, 0, 0), 
        '#f87171', 
        'X'
      ));
      axisGroup.add(createAxis(
        new THREE.Vector3(0, -25, 0), 
        new THREE.Vector3(0, 25, 0), 
        '#4ade80', 
        'Y'
      ));
      axisGroup.add(createAxis(
        new THREE.Vector3(0, 0, -25), 
        new THREE.Vector3(0, 0, 25), 
        '#60a5fa', 
        'Z'
      ));
      scene.add(axisGroup);

      // Grille
      const grid = new THREE.GridHelper(50, 20, 0x374151, 0x1f2937);
      grid.position.y = -12;
      scene.add(grid);

      // --- POINTS 3D ---
      const sphereGeometry = new THREE.SphereGeometry(0.8, 24, 24);
      
      // Grouper les points par cluster
      const clusterGroups = {};
      const dummy = new THREE.Object3D();

      pointsToRender.forEach(p => {
        const cId = Math.max(0, p.cluster) % colors.length;
        if (!clusterGroups[cId]) clusterGroups[cId] = [];
        
        // Position avec léger scaling
        dummy.position.set(
          p.x * 0.9,
          p.y * 0.9,
          p.z * 0.9
        );
        dummy.updateMatrix();
        clusterGroups[cId].push(dummy.matrix.clone());
      });

      // Créer un InstancedMesh par cluster
      Object.keys(clusterGroups).forEach(cId => {
        const matrices = clusterGroups[cId];
        if (matrices.length === 0) return;
        
        const colorValue = colors[cId] || colors[0];
        const color = new THREE.Color(colorValue);
        
        // Matériau avec émission pour meilleure visibilité
        const material = new THREE.MeshPhysicalMaterial({ 
          color: color,
          emissive: color,
          emissiveIntensity: localQuality3D < 0.2 ? 0.8 : 1.5,
          roughness: 0.2,
          metalness: 0.1,
          clearcoat: 0.8,
          clearcoatRoughness: 0.2
        });
        
        const mesh = new THREE.InstancedMesh(sphereGeometry, material, matrices.length);
        matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        mesh.instanceMatrix.needsUpdate = true;
        
        scene.add(mesh);
      });

      // --- LABELS DES CLUSTERS (optionnel, au centre de chaque groupe) ---
      Object.keys(clusterGroups).forEach(cId => {
        const matrices = clusterGroups[cId];
        if (matrices.length < 5) return;
        
        // Calculer le centre du cluster
        let sumX = 0, sumY = 0, sumZ = 0;
        const tempPos = new THREE.Vector3();
        
        matrices.forEach(m => {
          tempPos.setFromMatrixPosition(m);
          sumX += tempPos.x;
          sumY += tempPos.y;
          sumZ += tempPos.z;
        });
        
        const centerPos = new THREE.Vector3(
          sumX / matrices.length,
          sumY / matrices.length + 3, // Légèrement au-dessus
          sumZ / matrices.length
        );
        
        const label = createTextLabel(
          `G${parseInt(cId) + 1}`, 
          centerPos, 
          colors[cId] || '#ffffff',
          24
        );
        scene.add(label);
      });

      // --- INTERACTION ---
      let isDragging = false;
      let prevPos = { x: 0, y: 0 };
      let autoRotate = true;
      let rotationSpeed = 0.002;

      const onMouseDown = (e) => { 
        isDragging = true; 
        autoRotate = false;
        prevPos = { x: e.clientX, y: e.clientY }; 
      };
      
      const onMouseUp = () => { 
        isDragging = false; 
      };
      
      const onMouseMove = (e) => {
        if (isDragging) {
          const deltaX = e.clientX - prevPos.x;
          const deltaY = e.clientY - prevPos.y;
          scene.rotation.y += deltaX * 0.005;
          scene.rotation.x += deltaY * 0.003;
          // Limiter la rotation X
          scene.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, scene.rotation.x));
          prevPos = { x: e.clientX, y: e.clientY };
        }
      };
      
      const onWheel = (e) => {
        e.preventDefault();
        camera.position.z += e.deltaY * 0.08;
        camera.position.z = Math.max(15, Math.min(150, camera.position.z));
      };

      // Touch events pour mobile
      const onTouchStart = (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          autoRotate = false;
          prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      };
      
      const onTouchMove = (e) => {
        if (isDragging && e.touches.length === 1) {
          const deltaX = e.touches[0].clientX - prevPos.x;
          const deltaY = e.touches[0].clientY - prevPos.y;
          scene.rotation.y += deltaX * 0.005;
          scene.rotation.x += deltaY * 0.003;
          scene.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, scene.rotation.x));
          prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      };
      
      const onTouchEnd = () => {
        isDragging = false;
      };

      const canvas = renderer.domElement;
      canvas.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('wheel', onWheel, { passive: false });
      canvas.addEventListener('touchstart', onTouchStart, { passive: true });
      canvas.addEventListener('touchmove', onTouchMove, { passive: true });
      canvas.addEventListener('touchend', onTouchEnd);

      // Animation
      const animate = () => {
        requestRef.current = requestAnimationFrame(animate);
        
        if (autoRotate && !isDragging) {
          scene.rotation.y += rotationSpeed;
        }
        
        renderer.render(scene, camera);
      };
      animate();
      setIsLoading(false);

      // --- CLEANUP ---
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        
        canvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        
        if (sceneRef.current) {
          sceneRef.current.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          });
        }
      };
    } catch (e) {
      console.error("ThreeJS Error:", e);
      setError(e.message);
      setIsLoading(false);
    }
  }, [pointsToRender, colors, localQuality3D]);

  // --- REDIMENSIONNEMENT ---
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, []);

  // --- BOUTONS ---
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleZoom = (dir) => {
    if (!cameraRef.current) return;
    const delta = dir === 'in' ? -12 : 12;
    cameraRef.current.position.z = Math.max(15, Math.min(150, cameraRef.current.position.z + delta));
  };

  const resetView = () => {
    if (sceneRef.current) {
      sceneRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(35, 25, 45);
    }
  };

  // --- RENDU ERREUR ---
  if (error) {
    return (
      <div className="text-red-400 p-6 bg-red-900/20 rounded-xl border border-red-800 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6" />
        <div>
          <p className="font-medium">Erreur de visualisation 3D</p>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  // --- RENDU PRINCIPAL ---
  return (
    <div 
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900 group ${
        isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full min-h-[400px]'
      }`}
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full cursor-grab active:cursor-grabbing outline-none" 
      />

      {/* Indicateurs d'état */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {isDispersed && (
          <div className="bg-amber-900/80 backdrop-blur-sm text-amber-100 px-3 py-1.5 rounded-full border border-amber-700 text-[11px] shadow-lg flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Données dispersées</span>
          </div>
        )}

        {silhouetteScore !== null && silhouetteScore < 0.2 && (
          <div className="bg-blue-900/80 backdrop-blur-sm text-blue-100 px-3 py-1.5 rounded-full border border-blue-700 text-[11px] shadow-lg">
            ⚠️ Séparation faible ({silhouetteScore.toFixed(2)})
          </div>
        )}

        {localQuality3D < 0.15 && (
          <div className="bg-purple-900/80 backdrop-blur-sm text-purple-100 px-3 py-1.5 rounded-full border border-purple-700 text-[11px] shadow-lg">
            📊 Projection 3D limitée
          </div>
        )}
      </div>

      {/* Chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20">
          <Loader className="w-10 h-10 text-blue-500 animate-spin mb-3" />
          <p className="text-blue-400 text-sm font-medium animate-pulse">
            Construction de l'espace 3D...
          </p>
        </div>
      )}

      {/* Pas de données */}
      {!isLoading && pointsToRender.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
          <AlertTriangle className="w-12 h-12 text-gray-500 mb-3" />
          <p className="text-gray-400 text-sm">Aucune donnée à visualiser</p>
        </div>
      )}

      {/* Contrôles Flottants */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <button 
          onClick={toggleFullscreen} 
          className="p-2.5 bg-white/10 hover:bg-blue-600 text-white rounded-lg backdrop-blur-md shadow-lg border border-white/10 transition-all"
          title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
        </button>
        
        <div className="flex flex-col bg-white/10 rounded-lg backdrop-blur-md border border-white/10 overflow-hidden">
          <button 
            onClick={() => handleZoom('in')} 
            className="p-2.5 hover:bg-blue-600 text-white border-b border-white/10 transition-colors"
            title="Zoom avant"
          >
            <ZoomIn className="w-4 h-4"/>
          </button>
          <button 
            onClick={() => handleZoom('out')} 
            className="p-2.5 hover:bg-blue-600 text-white transition-colors"
            title="Zoom arrière"
          >
            <ZoomOut className="w-4 h-4"/>
          </button>
        </div>
        
        <button 
          onClick={resetView} 
          className="p-2.5 bg-white/10 hover:bg-blue-600 text-white rounded-lg backdrop-blur-md shadow-lg border border-white/10 transition-all"
          title="Réinitialiser la vue"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button 
          onClick={() => setShowInfo(!showInfo)} 
          className="p-2.5 bg-white/10 hover:bg-blue-600 text-white rounded-lg backdrop-blur-md shadow-lg border border-white/10 transition-all"
          title="Informations"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Panel d'information */}
      {showInfo && (
        <div className="absolute top-4 right-16 bg-gray-800/95 backdrop-blur-md text-white p-4 rounded-lg border border-gray-600 shadow-xl max-w-xs z-30">
          <h4 className="font-semibold text-sm mb-2 text-blue-400">Informations</h4>
          <div className="space-y-1.5 text-xs text-gray-300">
            <p><span className="text-gray-400">Points:</span> {pointsToRender.length}</p>
            <p><span className="text-gray-400">Clusters:</span> {clusterStats.count}</p>
            {silhouetteScore !== null && (
              <p><span className="text-gray-400">Silhouette:</span> {silhouetteScore.toFixed(3)}</p>
            )}
            {methodUsed && (
              <p><span className="text-gray-400">Méthode:</span> {methodUsed}</p>
            )}
            <p><span className="text-gray-400">Qualité 3D:</span> {(localQuality3D * 100).toFixed(0)}%</p>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-700">
            <p className="text-[10px] text-gray-500">
              🖱️ Glisser pour tourner | 🔄 Molette pour zoomer
            </p>
          </div>
        </div>
      )}

      {/* Légende des clusters */}
      <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur-md rounded-lg border border-gray-600 p-3 shadow-lg">
        <div className="flex flex-wrap gap-2 max-w-[200px]">
          {Object.entries(clusterStats.sizes).map(([clusterId, count]) => (
            <div 
              key={clusterId} 
              className="flex items-center gap-1.5 text-[10px] text-gray-300"
            >
              <span 
                className="w-3 h-3 rounded-full shadow-inner" 
                style={{ backgroundColor: colors[clusterId % colors.length] }}
              />
              <span>G{parseInt(clusterId) + 1}: {count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Barre d'état */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md text-white/90 px-3 py-2 rounded-lg border border-white/10 text-[11px] shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>{pointsToRender.length} points</span>
          </div>
          <span className="text-gray-500">|</span>
          <span>{clusterStats.count} groupes</span>
          {silhouetteScore !== null && (
            <>
              <span className="text-gray-500">|</span>
              <span className={silhouetteScore > 0.3 ? 'text-green-400' : silhouetteScore > 0.1 ? 'text-yellow-400' : 'text-red-400'}>
                Score: {silhouetteScore.toFixed(2)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clustering3DVisualization;