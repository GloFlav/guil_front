import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Loader, RotateCw, AlertTriangle, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

const Clustering3DVisualization = ({ scatterPoints = [], dna = {}, colors = [] }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const requestRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. DONNÉES ---
  const pointsToRender = useMemo(() => {
    if (scatterPoints && scatterPoints.length > 0) return scatterPoints;
    if (dna && Object.keys(dna).length > 0) {
      const generated = [];
      let clusterIndex = 0;
      Object.entries(dna).forEach(([_, clusterData]) => {
        for (let i = 0; i < 30; i++) {
          generated.push({
            x: (Math.random() - 0.5) * 12 + (clusterIndex * 6),
            y: (Math.random() - 0.5) * 12,
            z: (Math.random() - 0.5) * 12,
            cluster: clusterIndex
          });
        }
        clusterIndex++;
      });
      return generated;
    }
    return [];
  }, [scatterPoints, dna]);

  // --- 2. UTILITAIRES ---
  const createTextLabel = (text, position, color = 'white', size = 32) => {
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
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.position.copy(position);
    sprite.scale.set(6, 3, 1);
    return sprite;
  };

  const createAxis = (start, end, color, label) => {
    const group = new THREE.Group();
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ color: color, opacity: 0.8, transparent: true, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    group.add(line);

    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const labelPos = end.clone().add(direction.multiplyScalar(3));
    const labelSprite = createTextLabel(label, labelPos, color);
    group.add(labelSprite);

    return group;
  };

  // --- 3. RENDU 3D ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    if (pointsToRender.length === 0) { setIsLoading(false); return; }

    try {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // SCENE
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a202c);
        sceneRef.current = scene;

        // CAMERA
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(30, 20, 50);
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
        renderer.useLegacyLights = false;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        rendererRef.current = renderer;

        // --- LUMIÈRES ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(10, 20, 10);
        scene.add(dirLight);

        // AXES
        const axisGroup = new THREE.Group();
        axisGroup.add(createAxis(new THREE.Vector3(-30, 0, 0), new THREE.Vector3(30, 0, 0), '#f87171', 'Axe X'));
        axisGroup.add(createAxis(new THREE.Vector3(0, -30, 0), new THREE.Vector3(0, 30, 0), '#4ade80', 'Axe Y'));
        axisGroup.add(createAxis(new THREE.Vector3(0, 0, -30), new THREE.Vector3(0, 0, 30), '#ae3bf6ff', 'Axe Z'));
        scene.add(axisGroup);

        // Grille
        const grid = new THREE.GridHelper(60, 20, 0x475569, 0x334155);
        grid.position.y = -15;
        scene.add(grid);

        // --- POINTS LUMINEUX ---
        const geometry = new THREE.SphereGeometry(1.0, 32, 32);
        const material = new THREE.MeshPhysicalMaterial({ 
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });

        const clusterGroups = {};
        const dummy = new THREE.Object3D();

        pointsToRender.forEach(p => {
            const cId = p.cluster % (colors.length || 3);
            if (!clusterGroups[cId]) clusterGroups[cId] = [];
            dummy.position.set(p.x * 4, p.y * 4, p.z * 4);
            dummy.updateMatrix();
            clusterGroups[cId].push(dummy.matrix.clone());
        });

        Object.keys(clusterGroups).forEach(cId => {
            const matrices = clusterGroups[cId];
            const color = new THREE.Color(colors[cId] || '#ae3bf6ff');
            
            const mat = material.clone();
            mat.color = color;
            mat.emissive = color;
            mat.emissiveIntensity = 2;
            
            const mesh = new THREE.InstancedMesh(geometry, mat, matrices.length);
            matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
            scene.add(mesh);
        });

        // --- INTERACTION ---
        let isDragging = false;
        let prevPos = { x: 0, y: 0 };
        let rotationSpeed = { x: 0, y: 0.001 }; 

        const onMouseDown = (e) => { isDragging = true; rotationSpeed = {x:0, y:0}; prevPos = {x:e.clientX, y:e.clientY}; };
        const onMouseUp = () => { isDragging = false; };
        const onMouseMove = (e) => {
            if (isDragging) {
                const deltaX = e.clientX - prevPos.x;
                const deltaY = e.clientY - prevPos.y;
                scene.rotation.y += deltaX * 0.005;
                scene.rotation.x += deltaY * 0.005;
                prevPos = { x: e.clientX, y: e.clientY };
            }
        };
        const onWheel = (e) => {
            e.preventDefault();
            camera.position.z += e.deltaY * 0.1;
            camera.position.z = Math.max(10, Math.min(200, camera.position.z));
        };

        const canvas = renderer.domElement;
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('wheel', onWheel, { passive: false });

        const animate = () => {
            requestRef.current = requestAnimationFrame(animate);
            if (!isDragging) scene.rotation.y += rotationSpeed.y;
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
            
            if (rendererRef.current) rendererRef.current.dispose();
            if (sceneRef.current) {
                sceneRef.current.traverse(o => {
                    if (o.geometry) o.geometry.dispose();
                    if (o.material) {
                        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
                        else o.material.dispose();
                    }
                });
            }
        };
    } catch (e) {
        console.error("ThreeJS Error:", e);
        setError(e.message);
        setIsLoading(false);
    }
  }, [pointsToRender, colors]);

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
        containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
        document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleZoom = (dir) => {
    if (!cameraRef.current) return;
    const delta = dir === 'in' ? -15 : 15;
    cameraRef.current.position.z = Math.max(10, Math.min(200, cameraRef.current.position.z + delta));
  };

  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded">Erreur 3D: {error}</div>;

  return (
    <div 
        ref={containerRef}
        className={`relative rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900 group ${isFullscreen ? 'w-full h-full' : 'w-full h-full'}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-move outline-none" />

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20">
            <Loader className="w-10 h-10 text-blue-500 animate-spin mb-3" />
            <p className="text-blue-400 text-xs font-medium animate-pulse">Construction de l'espace 3D...</p>
        </div>
      )}

      {/* Contrôles Flottants */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <button onClick={toggleFullscreen} className="p-2 bg-white/10 hover:bg-blue-600 text-white rounded-lg backdrop-blur-md shadow-lg border border-white/10 transition-all">
            {isFullscreen ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
        </button>
        <div className="flex flex-col bg-white/10 rounded-lg backdrop-blur-md border border-white/10 overflow-hidden">
            <button onClick={() => handleZoom('in')} className="p-2 hover:bg-blue-600 text-white border-b border-white/10 transition-colors">
                <ZoomIn className="w-4 h-4"/>
            </button>
            <button onClick={() => handleZoom('out')} className="p-2 hover:bg-blue-600 text-white transition-colors">
                <ZoomOut className="w-4 h-4"/>
            </button>
        </div>
        <button onClick={() => { if (sceneRef.current) sceneRef.current.rotation.set(0,0,0); }} className="p-2 bg-white/10 hover:bg-blue-600 text-white rounded-lg backdrop-blur-md shadow-lg border border-white/10 transition-all">
            <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md text-white/80 px-3 py-1.5 rounded-full border border-white/10 text-[10px] shadow-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            {pointsToRender.length} points actifs
        </div>
      </div>
    </div>
  );
};

export default Clustering3DVisualization;