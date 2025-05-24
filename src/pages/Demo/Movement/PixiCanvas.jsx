import React, { useRef, useEffect } from 'react';

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
  // Fixed Hotline Miami style speed values - no external controls needed
  onStateChange, 
  skinId, 
  onWorldContainerReady, 
  currentLayer, 
  layerDimensions, 
  teleportRef 
}) => {
  // Hotline Miami style fixed speed values - increased for faster movement
  const walkSpeed = 4.5;
  const sprintSpeed = 9.0;
  const animationFps = 12;
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
    handleStepOn,
    hasCollision,
    interactWithDoor,
    doorObjects
  } = useInteractiveObjects({
    currentLayer,
    worldContainerRef,
    gridContainerRef,
    appRef
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

  // Set up keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space key for debug teleport
      if (e.code === 'Space') {
        debugTeleport();
      }
      
      // E key for interacting with doors
      if (e.code === 'KeyE') {
        // Get current position
        const state = calculateCharacterState(
          appRef.current,
          gridContainerRef.current,
          lastDirectionRef.current,
          false,
          false,
          false
        );
        
        // Try to interact with a door at the current position
        interactWithDoor(state.x, state.y);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugTeleport, calculateCharacterState, interactWithDoor]);

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
    framesPerDirection: 8, // Use 8 frames per direction as specified in the API response
    hasCollision: hasCollision, // Pass the collision detection function
    onTeleport: teleportToCoordinates // Pass the teleport function
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
        // Load character using the character controller
        const result = await loadCharacter(skinId);
        
        // If null was returned, it means loading is in progress or we're reusing existing sprite
        if (!result) return;
        
        const { sprite } = result;
        
        // Make sure the sprite isn't already in the stage
        if (sprite.parent === appRef.current.stage) {
          console.log('[Movement] Character sprite already in stage, skipping add');
          return;
        }
        
        // Add the character to the stage
        appRef.current.stage.addChild(sprite);
        
        // Center the character on the screen
        sprite.x = appRef.current.screen.width / 2;
        sprite.y = appRef.current.screen.height / 2;
        
        console.log('[Movement] Character initialized and added to stage');

        // Find the grid container
        const gridContainer = gridContainerRef.current;

        // Set the initial world container position
        // Character controller will handle updating this position
        if (worldContainerRef.current) {
          worldContainerRef.current.position.set(0, 0);
        }

        // Log initialization success
        console.log(`[Movement] Character successfully initialized with skin: ${skinId}`);
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
  }, [appRef.current, worldContainerRef.current, loadCharacter, cleanupCharacter, skinId]);

  return (
    <div 
      ref={pixiContainer} 
      style={{ width: '100vw', height: '100vh' }} 
      tabIndex={0} // Make the div focusable
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => { isFocused.current = false; }}
    />
  ); 
};

export default PixiCanvas;