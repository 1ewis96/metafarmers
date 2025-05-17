import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import PixiCanvas from './PixiCanvas';
import SkinSelector from './SkinSelector';
import SpeedControls from './SpeedControls';
import CharacterState from './CharacterState';
import LayerSelector from './LayerSelector';
import LoadingScreen from './LoadingScreen';
import MenuBar from './MenuBar';
import TravelWindow from './TravelWindow';
import useMapLayerLoader from './hooks/useMapLayerLoader';
import useKeyboardControls from './hooks/useKeyboardControls';

const MovementDemo = () => {
  const [consoleLines, setConsoleLines] = useState([]);
  const [command, setCommand] = useState('');
  const [skins, setSkins] = useState([]);
  const [selectedSkin, setSelectedSkin] = useState('');
  
  // State for character movement
  
  const [characterState, setCharacterState] = useState({
    x: 0,
    y: 0,
    direction: 'right',
    isMoving: false,
    isSprinting: false,
  });
  
  // Reference to the teleport function
  const teleportFunctionRef = useRef(null);
  
  // Enhanced teleport function with layer change support
  const teleportToCoordinates = (x, y, targetLayer = null) => {
    console.log(`[MovementDemo] Teleport requested to (${x}, ${y})${targetLayer ? ` on layer ${targetLayer}` : ''}`);
    
    // If a target layer is specified and it's different from the current layer
    if (targetLayer && targetLayer !== currentLayer) {
      console.log(`[MovementDemo] Layer change required before teleport: ${currentLayer} -> ${targetLayer}`);
      
      // Store the target coordinates for use after layer change
      const targetCoordinates = { x, y };
      
      // Find the grid dimensions for both layers to properly scale coordinates
      const currentLayerDim = layerDimensions.find(dim => dim.layer === currentLayer);
      const targetLayerDim = layerDimensions.find(dim => dim.layer === targetLayer);
      
      if (currentLayerDim && targetLayerDim) {
        // Calculate the grid size ratio between layers
        const xRatio = targetLayerDim.width / currentLayerDim.width;
        const yRatio = targetLayerDim.height / currentLayerDim.height;
        
        // Only adjust if grid sizes are different
        if (xRatio !== 1 || yRatio !== 1) {
          // The coordinates are already adjusted in TravelWindow, but we log them here for clarity
          console.log(`[MovementDemo] Grid size ratio: ${xRatio}x${yRatio}`);
          console.log(`[MovementDemo] Using adjusted coordinates: (${x}, ${y})`);
        }
      }
      
      // Mark as user-initiated to prevent layer loading issues
      userChangedLayerRef.current = true;
      
      // Change the layer first
      setCurrentLayer(targetLayer);
      
      // Create a function to check if the layer is fully loaded before teleporting
      const attemptTeleport = (attemptsLeft = 10) => {
        if (attemptsLeft <= 0) {
          console.error('[MovementDemo] Failed to teleport after maximum attempts');
          return;
        }
        
        // Check if the teleport function is available and the layer is loaded
        if (teleportFunctionRef.current && loadedLayer === targetLayer) {
          console.log(`[MovementDemo] Layer ${targetLayer} is loaded, executing teleport to (${x}, ${y})`);
          
          // Make sure the grid size is updated for the new layer
          const layerDim = layerDimensions.find(dim => dim.layer === targetLayer);
          if (layerDim && teleportFunctionRef.current.updateGridSize) {
            // If the teleport function has an updateGridSize method, call it directly
            console.log(`[MovementDemo] Explicitly updating grid size to ${layerDim.width}x${layerDim.height} before teleport`);
            teleportFunctionRef.current.updateGridSize(layerDimensions, targetLayer);
          }
          
          // Execute the teleport with a small delay to ensure grid size is applied
          setTimeout(() => {
            teleportFunctionRef.current(x, y);
          }, 100);
        } else {
          // Layer not loaded yet or teleport function not available, retry after a delay
          console.log(`[MovementDemo] Layer ${targetLayer} not ready yet, waiting... (${attemptsLeft} attempts left)`);
          setTimeout(() => attemptTeleport(attemptsLeft - 1), 300);
        }
      };
      
      // Start the teleport attempt process
      setTimeout(() => attemptTeleport(), 500);
      
      return true; // Return success since we've started the process
    }
    
    // Standard teleport on current layer
    if (teleportFunctionRef.current) {
      return teleportFunctionRef.current(x, y);
    } else {
      console.error('[MovementDemo] Teleport function not available yet');
      return false;
    }
  };
  // Character movement and animation speed settings with consistent controls
  const [speed, setSpeed] = useState({
    walk: 2.0,    // Default walking speed (0.5 = very slow, 5 = very fast)
    sprint: 4.0,  // Default sprinting speed (1 = very slow, 10 = very fast)
    animationFps: 8  // Animation frames per second (5 = slow animation, 20 = fast animation)
  });
  
  // Handle speed changes from the TravelWindow
  const handleSpeedChange = (newSpeedSettings) => {
    console.log('[MovementDemo] Updating speed settings:', newSpeedSettings);
    setSpeed({
      walk: newSpeedSettings.walkSpeed,
      sprint: newSpeedSettings.sprintSpeed,
      animationFps: newSpeedSettings.animationFps
    });
  };
  
  // Window visibility state - all windows closed by default
  const [visibleWindows, setVisibleWindows] = useState({
    layerSelector: false,
    skinSelector: false,
    speedControls: false,
    characterState: false,
    travelWindow: false
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
    loadLayer,
    layerDimensions,
    loadedLayer,
    setLoadedLayer,
    setAvailableLayers
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
  
  // Track user-initiated layer changes vs. accidental ones
  const userChangedLayerRef = useRef(false);
  const lastLayerChangeTimeRef = useRef(0);
  
  // Load the selected layer when it changes or when the world container is ready
  useEffect(() => {
    console.log(`[Movement] Layer effect triggered - currentLayer: ${currentLayer}, worldContainer ready: ${!!worldContainerRef.current}, loadedLayer: ${loadedLayerRef.current}`);
    
    // Prevent accidental layer changes by checking if it was user-initiated
    // or if enough time has passed since the last change (to prevent rapid changes)
    const now = Date.now();
    const timeSinceLastChange = now - lastLayerChangeTimeRef.current;
    const isValidChange = userChangedLayerRef.current || timeSinceLastChange > 1000;
    
    // Only load if the layer has changed or hasn't been loaded yet
    if (currentLayer && worldContainerRef.current && loadedLayerRef.current !== currentLayer && isValidChange) {
      console.log(`[Movement] Loading layer ${currentLayer} (previous: ${loadedLayerRef.current})`);
      loadedLayerRef.current = currentLayer;
      lastLayerChangeTimeRef.current = now;
      userChangedLayerRef.current = false;
      loadLayer(currentLayer, worldContainerRef.current);
    } else if (!isValidChange && currentLayer !== loadedLayerRef.current) {
      // Revert to the previously loaded layer if this was an accidental change
      console.log(`[Movement] Reverting accidental layer change from ${currentLayer} to ${loadedLayerRef.current}`);
      setCurrentLayer(loadedLayerRef.current);
    } else {
      console.log(`[Movement] Skipping layer load - conditions not met`);
    }
  }, [currentLayer, loadLayer, setCurrentLayer]);

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

  // Toggle window visibility
  const toggleWindow = (windowId) => {
    setVisibleWindows(prev => ({
      ...prev,
      [windowId]: !prev[windowId]
    }));
  };
  
  // Handle window close
  const handleWindowClose = (windowId) => {
    setVisibleWindows(prev => ({
      ...prev,
      [windowId]: false
    }));
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
        currentLayer={currentLayer}
        layerDimensions={layerDimensions}
        teleportRef={teleportFunctionRef}
      />
      
      {/* Menu Bar */}
      <MenuBar 
        visibleWindows={visibleWindows} 
        toggleWindow={toggleWindow} 
      />
      
      {/* UI Components as draggable windows */}
      {visibleWindows.layerSelector && (
        <LayerSelector 
          availableLayers={availableLayers}
          currentLayer={currentLayer}
          setCurrentLayer={setCurrentLayer}
          onUserChangeLayer={() => {
            // Mark this as a user-initiated layer change
            userChangedLayerRef.current = true;
            console.log('[Movement] User initiated layer change');
          }}
          onClose={handleWindowClose}
          windowId="layerSelector"
        />
      )}
      
      {visibleWindows.skinSelector && (
        <SkinSelector
          skins={skins}
          selectedSkin={selectedSkin}
          setSelectedSkin={setSelectedSkin}
          onClose={handleWindowClose}
          windowId="skinSelector"
        />
      )}
      
      {visibleWindows.speedControls && (
        <SpeedControls 
          speed={speed} 
          setSpeed={setSpeed} 
          onClose={handleWindowClose}
          windowId="speedControls"
        />
      )}
      
      {visibleWindows.characterState && (
        <CharacterState 
          characterState={characterState} 
          onClose={handleWindowClose}
          windowId="characterState"
        />
      )}
      
      {visibleWindows.travelWindow && (
        <TravelWindow
          onClose={handleWindowClose}
          windowId="travelWindow"
          onTeleport={teleportToCoordinates}
          availableLayers={availableLayers}
          currentLayer={currentLayer}
          onLayerChange={setCurrentLayer}
          layerDimensions={layerDimensions}
          onUserChangeLayer={() => {
            // Mark this as a user-initiated layer change
            userChangedLayerRef.current = true;
            console.log('[Movement] User initiated layer change via Travel Window');
          }}
        />
      )}
      
      {/* Current layer indicator */}
      {currentLayer && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          padding: '5px 10px',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Layer: {currentLayer}
        </div>
      )}
      
      {/* Layer indicator is the only element at the bottom now */}
    </div>
  );
};

export default MovementDemo;