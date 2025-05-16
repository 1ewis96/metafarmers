import React, { useEffect, useRef } from 'react';

// Import custom hooks and utilities
import useCharacterLoader from './hooks/useCharacterLoader';
import useKeyboardControls from './hooks/useKeyboardControls';
import useGridPosition from './hooks/useGridPosition';
import { initializePixiApp, findGridContainer, destroyPixiApp } from './utils/pixiUtils';
import { TILE_SIZE } from './utils/apiConfig';

const PixiCanvas = ({ walkSpeed = 3, sprintSpeed = 6, onStateChange, skinId, onWorldContainerReady, currentLayer, layerDimensions }) => {
  // References for the PIXI application
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const animationTicker = useRef(null);
  const worldContainerRef = useRef(null);
  const gridContainerRef = useRef(null);

  // Custom hooks for different functionalities
  const { loadCharacter, updateAnimation, updateTexture, characterRef, lastDirectionRef } = useCharacterLoader();
  const { calculateMovement, isFocused } = useKeyboardControls();
  const { updateGridSize, initializeWorldOffset, updateWorldOffset, calculateCharacterState, gridSizeRef } = useGridPosition();



  // Track if we've already initialized the canvas
  const canvasInitializedRef = useRef(false);

  // Update grid size when layer dimensions change
  useEffect(() => {
    updateGridSize(layerDimensions, currentLayer);
  }, [currentLayer, layerDimensions, updateGridSize]);

  useEffect(() => {
    // Prevent multiple initializations
    if (canvasInitializedRef.current) return;
    canvasInitializedRef.current = true;

    const run = async () => {
      try {
        // Initialize PIXI application
        const { app, worldContainer } = initializePixiApp(pixiContainer.current);
        appRef.current = app;
        worldContainerRef.current = worldContainer;

        // Log grid size
        console.log(`[Movement] Using grid size: ${gridSizeRef.current.width}x${gridSizeRef.current.height} tiles`);

        // Notify parent that the world container is ready
        if (onWorldContainerReady) {
          console.log(`[Movement] Calling onWorldContainerReady callback`);
          onWorldContainerReady(worldContainer);
        }

        // Load character
        const { sprite, frames, framesPerDirection } = await loadCharacter(skinId);

        // Find the grid container
        const gridContainer = findGridContainer(worldContainer);
        gridContainerRef.current = gridContainer;

        // Initialize world offset
        initializeWorldOffset(app, gridContainer);

        // Position the character in the center of the screen
        sprite.x = app.screen.width / 2;
        sprite.y = app.screen.height / 2;
        app.stage.addChild(sprite);

        // Set the initial world container position
        worldContainer.position.set(gridSizeRef.current.worldOffset?.x || 0, gridSizeRef.current.worldOffset?.y || 0);

        const fps = 10;
        let elapsed = 0;

        animationTicker.current = app.ticker.add((delta) => {
          if (!isFocused.current) {
            return;
          }

          const { vx, vy, moving, direction, isLocked, isSprinting } = calculateMovement(walkSpeed, sprintSpeed);

          // Update character direction if provided
          if (direction) {
            lastDirectionRef.current = direction;
          }

          // Update animation
          const { elapsed: newElapsed, frame } = updateAnimation({
            isMoving: moving,
            isLocked,
            direction: lastDirectionRef.current,
            elapsed,
            delta,
            fps,
            framesPerDirection
          });
          elapsed = newElapsed;

          // Update character texture
          updateTexture(lastDirectionRef.current, frame);

          // Keep character centered
          if (characterRef.current) {
            characterRef.current.x = app.screen.width / 2;
            characterRef.current.y = app.screen.height / 2;
          }

          // Update world position based on movement
          const updatedOffset = updateWorldOffset(app, gridContainerRef.current, vx, vy, moving, isLocked);
          worldContainer.position.set(updatedOffset.x, updatedOffset.y);

          // Update character state for parent component
          if (onStateChange) {
            const state = calculateCharacterState(
              app,
              gridContainerRef.current,
              lastDirectionRef.current,
              moving,
              isLocked,
              isSprinting
            );
            onStateChange(state);
          }
        });

      } catch (error) {
        console.error(`[Movement] Error initializing canvas:`, error);
        canvasInitializedRef.current = false; // Allow retry on error
      }

      return () => {
        // Clean up resources
        destroyPixiApp(appRef.current, animationTicker.current);
        canvasInitializedRef.current = false;
      };
    };

    run().catch((error) => {
      console.error(`[Movement] Error in canvas initialization:`, error);
    });
  }, [walkSpeed, sprintSpeed, onStateChange, skinId, onWorldContainerReady]);

  return <div 
    ref={pixiContainer} 
    style={{ width: '100vw', height: '100vh' }} 
    tabIndex={0} // Make the div focusable
  />; 
};

export default PixiCanvas;