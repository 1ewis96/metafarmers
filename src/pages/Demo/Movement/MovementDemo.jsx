import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import PixiCanvas from './PixiCanvas';
import SkinSelector from './SkinSelector';
import SpeedControls from './SpeedControls';
import CharacterState from './CharacterState';
import LayerSelector from './LayerSelector';
import LoadingScreen from './LoadingScreen';
import useMapLayerLoader from './hooks/useMapLayerLoader';

const MovementDemo = () => {
  const [consoleLines, setConsoleLines] = useState([]);
  const [command, setCommand] = useState('');
  const [skins, setSkins] = useState([]);
  const [selectedSkin, setSelectedSkin] = useState('');
  const [characterState, setCharacterState] = useState({
    x: 0,
    y: 0,
    direction: 'right',
    isMoving: false,
    isSprinting: false,
  });
  const [speed, setSpeed] = useState({
    walk: 3,
    sprint: 6,
  });
  
  // Map layer related state
  const worldContainerRef = useRef(null);
  const {
    availableLayers,
    currentLayer,
    setCurrentLayer,
    isLoading,
    loadingProgress,
    loadingMessage,
    fetchLayers,
    loadLayer
  } = useMapLayerLoader();

  // Fetch character skins - only once
  const skinsLoadedRef = useRef(false);
  
  useEffect(() => {
    if (skinsLoadedRef.current) return;
    
    const fetchSkins = async () => {
      try {
        console.log('[Movement] Fetching character skins');
        skinsLoadedRef.current = true;
        const res = await fetch('https://api.metafarmers.io/list/characters', {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'metafarmers-default-key'
          }
        });
        const data = await res.json();
        console.log('[Movement] Character skins response:', data);
        
        if (data.skins && data.skins.length > 0) {
          setSkins(data.skins);
          if (data.skins.length > 0) {
            console.log(`[Movement] Setting initial skin to: ${data.skins[0]}`);
            setSelectedSkin(data.skins[0]);
          } else {
            // Default to character-1 if no skins are found
            console.log(`[Movement] No skins found, defaulting to character-1`);
            setSelectedSkin('character-1');
          }
        }
      } catch (error) {
        console.error('[Movement] Failed to fetch skins:', error);
        skinsLoadedRef.current = false; // Allow retry on error
      }
    };
    fetchSkins();
  }, []);

  // Fetch available layers - only once
  const layersLoadedRef = useRef(false);
  
  useEffect(() => {
    if (layersLoadedRef.current) return;
    
    layersLoadedRef.current = true;
    fetchLayers();
    
    // Set a default layer after a short delay to ensure it's set
    setTimeout(() => {
      if (!currentLayer && availableLayers.length > 0) {
        console.log(`[Movement] Setting default layer after delay: ${availableLayers[0]}`);
        setCurrentLayer(availableLayers[0]);
      }
    }, 1000);
  }, [fetchLayers, availableLayers, currentLayer, setCurrentLayer]);

  // Track if we've already loaded the current layer to prevent infinite reloading
  const loadedLayerRef = useRef(null);
  
  // Load the selected layer when it changes or when the world container is ready
  useEffect(() => {
    console.log(`[Movement] Layer effect triggered - currentLayer: ${currentLayer}, worldContainer ready: ${!!worldContainerRef.current}, loadedLayer: ${loadedLayerRef.current}`);
    
    // Only load if the layer has changed or hasn't been loaded yet
    if (currentLayer && worldContainerRef.current && loadedLayerRef.current !== currentLayer) {
      console.log(`[Movement] Loading layer ${currentLayer} (previous: ${loadedLayerRef.current})`);
      loadedLayerRef.current = currentLayer;
      loadLayer(currentLayer, worldContainerRef.current);
    } else {
      console.log(`[Movement] Skipping layer load - conditions not met`);
    }
  }, [currentLayer, loadLayer]);

  const handleCommandSubmit = () => {
    if (command.trim() === '') return;
    setConsoleLines((prev) => [...prev, `> ${command}`]);
    setCommand('');
  };

  const handleWorldContainerReady = (container) => {
    console.log(`[Movement] World container ready callback called`);
    worldContainerRef.current = container;
    
    // If we already have a selected layer, load it
    if (currentLayer && loadedLayerRef.current !== currentLayer) {
      console.log(`[Movement] Container ready, loading layer ${currentLayer}`);
      loadedLayerRef.current = currentLayer;
      loadLayer(currentLayer, container);
    } else {
      console.log(`[Movement] Container ready but not loading layer - currentLayer: ${currentLayer}, loadedLayer: ${loadedLayerRef.current}`);
      
      // If no current layer is set but we have available layers, set the first one
      if (!currentLayer && availableLayers.length > 0) {
        console.log(`[Movement] Setting first available layer: ${availableLayers[0]}`);
        setCurrentLayer(availableLayers[0]);
      }
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {isLoading && (
        <LoadingScreen progress={loadingProgress} message={loadingMessage} />
      )}
      <PixiCanvas
        walkSpeed={speed.walk}
        sprintSpeed={speed.sprint}
        onStateChange={setCharacterState}
        skinId={selectedSkin}
        onWorldContainerReady={handleWorldContainerReady}
      />
      
      {/* UI Components as draggable windows */}
      <LayerSelector 
        availableLayers={availableLayers}
        currentLayer={currentLayer}
        setCurrentLayer={setCurrentLayer}
      />
      
      <SkinSelector
        skins={skins}
        selectedSkin={selectedSkin}
        setSelectedSkin={setSelectedSkin}
      />
      
      <SpeedControls 
        speed={speed} 
        setSpeed={setSpeed} 
      />
      
      <CharacterState 
        characterState={characterState} 
      />
      
      {/* Current layer indicator */}
      {currentLayer && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 5
        }}>
          Current layer: <strong>{currentLayer}</strong>
        </div>
      )}
    </div>
  );
};

export default MovementDemo;