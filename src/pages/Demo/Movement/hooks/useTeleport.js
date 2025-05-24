import { useCallback, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { TILE_SIZE } from '../utils/apiConfig';

/**
 * Hook to handle teleportation functionality
 * @param {Object} params - Parameters for the teleport hook
 * @param {Object} params.appRef - Reference to the PIXI application
 * @param {Object} params.worldContainerRef - Reference to the world container
 * @param {Object} params.gridContainerRef - Reference to the grid container
 * @param {Object} params.gridSizeRef - Reference to the grid size
 * @param {Object} params.worldOffsetRef - Reference to the world offset
 * @param {Function} params.calculateCharacterState - Function to calculate character state
 * @param {Function} params.onStateChange - Callback for state changes
 * @param {Object} params.lastDirectionRef - Reference to the last direction
 * @returns {Object} - Teleport functions and state
 */
const useTeleport = ({
  appRef,
  worldContainerRef,
  gridContainerRef,
  gridSizeRef,
  worldOffsetRef,
  calculateCharacterState,
  onStateChange,
  lastDirectionRef
}) => {
  // Add a teleport lock to prevent position updates during teleportation
  const isTeleporting = useRef(false);

  // Add teleport function to move character to specific coordinates
  const teleportToCoordinates = useCallback((x, y) => {
    if (!worldContainerRef.current || !appRef.current) {
      console.error('[Teleport] Cannot teleport: world container or app not initialized');
      return false;
    }
    
    try {
      // Set teleporting flag to prevent animation ticker from overriding position
      isTeleporting.current = true;
      console.log('[Teleport] Setting teleport lock');
      
      // Calculate the screen dimensions
      const screenWidth = appRef.current.screen.width;
      const screenHeight = appRef.current.screen.height;
      
      // Get current grid size
      const gridWidth = gridSizeRef.current.width * TILE_SIZE;
      const gridHeight = gridSizeRef.current.height * TILE_SIZE;
      
      console.log(`[Teleport] Current grid size: ${gridSizeRef.current.width}x${gridSizeRef.current.height} (${gridWidth}x${gridHeight}px)`);
      console.log(`[Teleport] Target coordinates: (${x}, ${y})`);
      
      // Get grid container position for accurate teleporting
      let gridOffsetX = 0;
      let gridOffsetY = 0;
      
      // If we have a grid container, use its position
      if (gridContainerRef.current && gridContainerRef.current.transform) {
        gridOffsetX = gridContainerRef.current.x;
        gridOffsetY = gridContainerRef.current.y;
        console.log(`[Teleport] Using grid container position: (${gridOffsetX}, ${gridOffsetY})`);
      } else {
        // Fallback: Calculate default grid offset based on grid size
        gridOffsetX = -(gridWidth / 2); // Default grid position (centered)
        gridOffsetY = -(gridHeight / 2);
        console.log(`[Teleport] Using calculated grid offset: (${gridOffsetX}, ${gridOffsetY})`);
      }
      
      // Ensure the coordinates are within the valid range for the current grid
      const validX = Math.min(Math.max(0, x), gridSizeRef.current.width - 1);
      const validY = Math.min(Math.max(0, y), gridSizeRef.current.height - 1);
      
      if (validX !== x || validY !== y) {
        console.log(`[Teleport] Adjusted coordinates from (${x}, ${y}) to (${validX}, ${validY}) to fit within grid`);
      }
      
      // Calculate the center position of the target cell in pixels
      // This is the key calculation for accurate positioning
      const cellCenterX = (validX * TILE_SIZE) + (TILE_SIZE / 2);
      const cellCenterY = (validY * TILE_SIZE) + (TILE_SIZE / 2);
      
      // Calculate the world position that would center the view on the target cell
      // This formula ensures we're properly centered on the target cell regardless of grid size
      const worldX = -cellCenterX + (screenWidth / 2) - gridOffsetX;
      const worldY = -cellCenterY + (screenHeight / 2) - gridOffsetY;
      
      console.log(`[Teleport] Grid offset: (${gridOffsetX}, ${gridOffsetY})`);
      console.log(`[Teleport] Cell center in pixels: (${cellCenterX}, ${cellCenterY})`);
      console.log(`[Teleport] Teleporting to grid position (${validX}, ${validY})`);
      console.log(`[Teleport] Setting world position to (${worldX}, ${worldY})`);
      
      // Create a flash effect for teleportation
      const flash = new PIXI.Graphics();
      flash.beginFill(0xFFFFFF);
      flash.drawRect(0, 0, screenWidth, screenHeight);
      flash.endFill();
      flash.alpha = 0;
      appRef.current.stage.addChild(flash);
      
      // Animate the flash
      let fadeIn = true;
      let alpha = 0;
      
      const animate = () => {
        if (fadeIn) {
          alpha += 0.1;
          if (alpha >= 0.7) fadeIn = false;
        } else {
          alpha -= 0.1;
          if (alpha <= 0) {
            appRef.current.stage.removeChild(flash);
            return;
          }
        }
        
        flash.alpha = alpha;
        requestAnimationFrame(animate);
      };
      
      animate();
      
      // Update world position after a short delay for the flash effect
      setTimeout(() => {
        // Make sure the world container is still valid
        if (!worldContainerRef.current || !worldContainerRef.current.transform) {
          console.error('[Teleport] World container is no longer valid');
          isTeleporting.current = false;
          return false;
        }
        
        // Update world position
        worldContainerRef.current.position.x = worldX;
        worldContainerRef.current.position.y = worldY;
        
        // CRITICAL: Update the worldOffsetRef to match the new position
        // This ensures the grid position calculations stay in sync
        worldOffsetRef.current = {
          x: worldX,
          y: worldY
        };
        
        console.log(`[Teleport] Updated worldOffsetRef to match new position: (${worldX}, ${worldY})`);
        
        // Update character state through the onStateChange callback
        if (onStateChange) {
          try {
            const newState = calculateCharacterState(
              appRef.current,
              gridContainerRef.current,
              lastDirectionRef.current,
              false, // not moving after teleport
              false, // not locked
              false  // not sprinting
            );
            
            // Verify the grid position calculation is correct
            console.log(`[Teleport] Calculated grid position: (${newState.x}, ${newState.y})`);
            
            // Verify we're at the expected position
            if (newState.x !== validX || newState.y !== validY) {
              console.warn(`[Teleport] Position mismatch! Expected (${validX}, ${validY}) but got (${newState.x}, ${newState.y})`);
            }
            
            onStateChange(prevState => ({
              ...prevState,
              x: newState.x,
              y: newState.y
            }));
          } catch (error) {
            console.error('[Teleport] Error calculating character state:', error);
          }
        }
        
        console.log(`[Teleport] Teleported successfully to (${validX}, ${validY})`);
        
        // Release teleport lock after a longer delay to ensure position is maintained
        setTimeout(() => {
          isTeleporting.current = false;
          console.log('[Teleport] Released teleport lock');
        }, 1500); // Increased delay for better stability
      }, 300); // Short delay for visual effect
      
      return true;
    } catch (error) {
      console.error('[Teleport] Error during teleportation:', error);
      isTeleporting.current = false; // Make sure to release the lock in case of error
      return false;
    }
  }, [calculateCharacterState, onStateChange]);
  
  // Debug teleport - for direct testing
  const debugTeleport = useCallback(() => {
    console.log(`[Debug] Executing debug teleport`);
    
    // Default to teleporting 5 cells in the current direction
    const direction = lastDirectionRef.current || 'right';
    let offsetX = 0;
    let offsetY = 0;
    
    // Determine offset based on direction
    switch (direction) {
      case 'up':
        offsetY = -5;
        break;
      case 'down':
        offsetY = 5;
        break;
      case 'left':
        offsetX = -5;
        break;
      case 'right':
        offsetX = 5;
        break;
    }
    
    // Get current position
    if (appRef.current && gridContainerRef.current) {
      try {
        const currentState = calculateCharacterState(
          appRef.current,
          gridContainerRef.current,
          direction,
          false,
          false,
          false
        );
        
        // Calculate target position
        const targetX = currentState.x + offsetX;
        const targetY = currentState.y + offsetY;
        
        console.log(`[Debug] Teleporting from (${currentState.x}, ${currentState.y}) to (${targetX}, ${targetY})`);
        
        // Use the main teleport function
        return teleportToCoordinates(targetX, targetY);
      } catch (error) {
        console.error('[Debug] Error during debug teleport:', error);
      }
    }
    
    return false;
  }, [calculateCharacterState, lastDirectionRef, teleportToCoordinates]);

  return {
    teleportToCoordinates,
    debugTeleport,
    isTeleporting
  };
};

export default useTeleport;
