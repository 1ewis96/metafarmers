import React, { useRef } from 'react';

// Import custom hooks and utilities
import useCharacterLoader from './hooks/useCharacterLoader';
import useKeyboardControls from './hooks/useKeyboardControls';
import useGridPosition from './hooks/useGridPosition';
import useInteractiveObjects from './hooks/useInteractiveObjects';
import usePixiApp from './hooks/usePixiApp';
import useTeleport from './hooks/useTeleport';
import useAnimationLoop from './hooks/useAnimationLoop';
import useDebugTools from './hooks/useDebugTools';
import useTeleportRef from './hooks/useTeleportRef';
import { TILE_SIZE } from './utils/apiConfig';

const PixiCanvas = ({ 
  walkSpeed = 3, 
  sprintSpeed = 6, 
  animationFps = 12, // Add animationFps prop with default value
  onStateChange, 
  skinId, 
  onWorldContainerReady, 
  currentLayer, 
  layerDimensions, 
  teleportRef 
}) => {
  // Container reference for the PIXI application
  const pixiContainer = useRef(null);

  // Initialize Pixi app and get references
  const { 
    appRef, 
    worldContainerRef, 
    gridContainerRef, 
    animationTicker 
  } = usePixiApp({
    containerRef: pixiContainer,
    onWorldContainerReady
  });

  // Custom hooks for different functionalities
  const { 
    loadCharacter, 
    updateAnimation, 
    updateTexture, 
    cleanupCharacter,
    characterRef, 
    lastDirectionRef 
  } = useCharacterLoader();
  
  const { 
    calculateMovement, 
    isFocused 
  } = useKeyboardControls();
  
  const { 
    updateGridSize, 
    initializeWorldOffset, 
    updateWorldOffset, 
    calculateCharacterState, 
    gridSizeRef, 
    worldOffsetRef 
  } = useGridPosition();
  
  // Interactive objects hook
  const { 
    objects, 
    handleStepOn 
  } = useInteractiveObjects({
    currentLayer
  });

  // Teleport functionality
  const { 
    teleportToCoordinates, 
    debugTeleport, 
    isTeleporting 
  } = useTeleport({
    appRef,
    worldContainerRef,
    gridContainerRef,
    gridSizeRef,
    worldOffsetRef,
    calculateCharacterState,
    onStateChange,
    lastDirectionRef
  });

  // Debug tools
  const { 
    logGridPosition 
  } = useDebugTools({
    appRef,
    worldContainerRef,
    gridContainerRef,
    calculateCharacterState
  });

  // Animation loop
  useAnimationLoop({
    appRef,
    worldContainerRef,
    gridContainerRef,
    characterRef,
    lastDirectionRef,
    isTeleporting,
    calculateMovement,
    updateAnimation,
    updateTexture,
    updateWorldOffset,
    calculateCharacterState,
    handleStepOn,
    onStateChange,
    isFocused,
    walkSpeed,
    sprintSpeed,
    animationFps, // Pass the animationFps prop to control animation speed
    framesPerDirection: 8 // Use 8 frames per direction as specified in the API response
  });

  // Set up teleport ref
  useTeleportRef({
    teleportRef,
    teleportToCoordinates,
    updateGridSize
  });

  // Update grid size when layer dimensions change
  React.useEffect(() => {
    updateGridSize(layerDimensions, currentLayer);
  }, [currentLayer, layerDimensions, updateGridSize]);

  // Initialize character when app is ready
  React.useEffect(() => {
    if (!appRef.current || !worldContainerRef.current) return;

    // Track if this effect has already run for this specific combination
    const effectId = `${skinId}-${appRef.current ? 'app' : 'noapp'}-${worldContainerRef.current ? 'world' : 'noworld'}`;
    const initializationKey = `character-initialized-${effectId}`;
    
    // Check if we've already initialized for this specific combination
    if (appRef.current[initializationKey]) {
      console.log(`[Movement] Character already initialized for ${effectId}, skipping`);
      return;
    }
    
    // Mark as initialized
    appRef.current[initializationKey] = true;

    const initializeCharacter = async () => {
      try {
        // Load character
        const result = await loadCharacter(skinId);
        
        // If null was returned, it means loading is in progress or we're reusing existing sprite
        if (!result) return;
        
        const { sprite } = result;
        
        // Make sure the sprite isn't already in the stage
        if (sprite.parent === appRef.current.stage) {
          console.log('[Movement] Character sprite already in stage, skipping add');
          return;
        }

        // Find the grid container
        const gridContainer = gridContainerRef.current;

        // Initialize world offset
        initializeWorldOffset(appRef.current, gridContainer);

        // Position the character in the center of the screen
        sprite.x = appRef.current.screen.width / 2;
        sprite.y = appRef.current.screen.height / 2;
        appRef.current.stage.addChild(sprite);

        // Set the initial world container position
        worldContainerRef.current.position.set(
          gridSizeRef.current.worldOffset?.x || 0, 
          gridSizeRef.current.worldOffset?.y || 0
        );

        // Log grid size
        console.log(`[Movement] Using grid size: ${gridSizeRef.current.width}x${gridSizeRef.current.height} tiles`);
      } catch (error) {
        console.error(`[Movement] Error initializing character:`, error);
      }
    };

    initializeCharacter();
    
    // Clean up character when component unmounts or when skinId changes
    return () => {
      if (appRef.current) {
        appRef.current[initializationKey] = false;
      }
      cleanupCharacter();
    };
  }, [appRef.current, worldContainerRef.current, loadCharacter, cleanupCharacter, skinId, initializeWorldOffset]);

  return (
    <div 
      ref={pixiContainer} 
      style={{ width: '100vw', height: '100vh' }} 
      tabIndex={0} // Make the div focusable
    />
  ); 
};

export default PixiCanvas;