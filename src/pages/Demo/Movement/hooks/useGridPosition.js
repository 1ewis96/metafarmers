import { useRef, useCallback } from 'react';
import { TILE_SIZE } from '../utils/apiConfig';

/**
 * Hook for managing grid-based positioning and movement
 * @returns {Object} Grid position utilities
 */
const useGridPosition = () => {
  const gridSizeRef = useRef({ width: 20, height: 20 });
  const worldOffsetRef = useRef({ x: 0, y: 0 });
  
  /**
   * Updates the grid size based on layer dimensions
   * @param {Object} dimensions - The dimensions of the current layer
   * @param {string} currentLayer - The current layer name
   */
  const updateGridSize = useCallback((dimensions, currentLayer) => {
    if (currentLayer && dimensions && dimensions.length > 0) {
      const currentLayerDim = dimensions.find(dim => dim.layer === currentLayer);
      if (currentLayerDim) {
        gridSizeRef.current = {
          width: currentLayerDim.width || 20,
          height: currentLayerDim.height || 20
        };
        console.log(`[Movement] Updated grid size for layer ${currentLayer}: ${gridSizeRef.current.width}x${gridSizeRef.current.height}`);
      }
    }
  }, []);
  
  /**
   * Initializes the world offset to center the character at a specific grid cell
   * @param {Object} app - The PIXI Application instance
   * @param {Object} gridContainer - The grid container
   * @param {number} startGridX - The starting X grid position
   * @param {number} startGridY - The starting Y grid position
   */
  const initializeWorldOffset = useCallback((app, gridContainer) => {
    // Position character at a specific grid cell (default to center of the grid)
    const startGridX = Math.floor(gridSizeRef.current.width / 2);
    const startGridY = Math.floor(gridSizeRef.current.height / 2);
    
    // Get grid dimensions
    const gridWidth = gridSizeRef.current.width * TILE_SIZE;
    const gridHeight = gridSizeRef.current.height * TILE_SIZE;
    
    // Calculate grid position in world container
    let gridOffsetX = -(gridWidth / 2); // Default grid position (centered)
    let gridOffsetY = -(gridHeight / 2);
    
    // If we found the grid container, use its actual position
    if (gridContainer) {
      gridOffsetX = gridContainer.x;
      gridOffsetY = gridContainer.y;
      console.log(`[Movement] Using grid container position: (${gridOffsetX}, ${gridOffsetY})`);
    }
    
    // Initialize world offset to position character at the specified grid cell
    worldOffsetRef.current = {
      // Position character exactly at the center of the specified grid cell
      // Account for grid container position
      x: -((startGridX * TILE_SIZE) - app.screen.width / 2 + TILE_SIZE / 2) - gridOffsetX,
      y: -((startGridY * TILE_SIZE) - app.screen.height / 2 + TILE_SIZE / 2) - gridOffsetY
    };
    
    console.log(`[Movement] Initial world offset: (${worldOffsetRef.current.x}, ${worldOffsetRef.current.y})`);
    console.log(`[Movement] Character starting at grid cell: (${startGridX}, ${startGridY})`);
    console.log(`[Movement] Grid offset: (${gridOffsetX}, ${gridOffsetY})`);
    console.log(`[Movement] Grid dimensions: ${gridWidth}x${gridHeight}px (${gridSizeRef.current.width}x${gridSizeRef.current.height} tiles)`);
    
    return {
      worldOffset: worldOffsetRef.current,
      gridOffsetX,
      gridOffsetY,
      startGridX,
      startGridY
    };
  }, []);
  
  /**
   * Updates the world offset based on character movement
   * @param {Object} app - The PIXI Application instance
   * @param {Object} gridContainer - The grid container
   * @param {number} vx - X velocity
   * @param {number} vy - Y velocity
   * @param {boolean} moving - Whether the character is moving
   * @param {boolean} isLocked - Whether movement is locked
   * @param {boolean} calculateOnly - If true, only calculate the potential offset without applying it
   * @returns {Object} Updated world offset
   */
  const updateWorldOffset = useCallback((app, gridContainer, vx, vy, moving, isLocked, calculateOnly = false) => {
    if (!moving || isLocked) return worldOffsetRef.current;
    
    // Calculate new potential position
    const newOffsetX = worldOffsetRef.current.x - vx;
    const newOffsetY = worldOffsetRef.current.y - vy;
    
    // Get grid dimensions
    const gridWidth = gridSizeRef.current.width * TILE_SIZE;
    const gridHeight = gridSizeRef.current.height * TILE_SIZE;
    
    // Get grid container position
    let gridOffsetX = -(gridWidth / 2); // Default grid position (centered)
    let gridOffsetY = -(gridHeight / 2);
    
    // If we found the grid container, use its actual position
    if (gridContainer) {
      gridOffsetX = gridContainer.x;
      gridOffsetY = gridContainer.y;
    }
    
    // Calculate the position relative to the grid's top-left corner
    // Adjust for the grid container's actual position
    const relativeX = app.screen.width / 2 - newOffsetX - gridOffsetX;
    const relativeY = app.screen.height / 2 - newOffsetY - gridOffsetY;
    
    // Calculate the grid cell the character would be in
    const characterGridX = Math.floor(relativeX / TILE_SIZE);
    const characterGridY = Math.floor(relativeY / TILE_SIZE);
    
    // Check if the new position would be within grid boundaries
    const isWithinBoundsX = characterGridX >= 0 && characterGridX < gridSizeRef.current.width;
    const isWithinBoundsY = characterGridY >= 0 && characterGridY < gridSizeRef.current.height;
    
    // Create a potential offset object
    const potentialOffset = {
      x: isWithinBoundsX ? newOffsetX : worldOffsetRef.current.x,
      y: isWithinBoundsY ? newOffsetY : worldOffsetRef.current.y
    };
    
    // If calculateOnly is true, just return the potential offset without applying it
    if (calculateOnly) {
      return potentialOffset;
    }
    
    // Otherwise, update the actual offset
    if (isWithinBoundsX) worldOffsetRef.current.x = newOffsetX;
    if (isWithinBoundsY) worldOffsetRef.current.y = newOffsetY;
    
    return worldOffsetRef.current;
  }, []);
  
  /**
   * Calculates the character's state (position, direction, etc.)
   * @param {Object} app - The PIXI Application instance
   * @param {Object} gridContainer - The grid container
   * @param {string} direction - The character's current direction
   * @param {boolean} moving - Whether the character is moving
   * @param {boolean} isLocked - Whether movement is locked
   * @param {boolean} isSprinting - Whether the character is sprinting
   * @param {Object} customOffset - Optional custom offset to use instead of worldOffsetRef.current
   * @returns {Object} Character state
   */
  const calculateCharacterState = useCallback((app, gridContainer, direction, moving, isLocked, isSprinting, customOffset) => {
    try {
      // Validate inputs to prevent null reference errors
      if (!app || !app.screen) {
        console.warn('[GridPosition] App or screen is null in calculateCharacterState');
        return {
          x: 0, y: 0, pixelX: 0, pixelY: 0, cellX: 0, cellY: 0,
          direction: direction || 'down',
          isMoving: false, isSprinting: false, isLocked: true
        };
      }
      
      // Get grid dimensions
      const gridWidth = gridSizeRef.current.width * TILE_SIZE;
      const gridHeight = gridSizeRef.current.height * TILE_SIZE;
      
      // Get grid container position
      let gridOffsetX = -(gridWidth / 2); // Default grid position (centered)
      let gridOffsetY = -(gridHeight / 2);
      
      // If we found the grid container and it has a valid transform, use its actual position
      if (gridContainer && gridContainer.transform) {
        gridOffsetX = gridContainer.x;
        gridOffsetY = gridContainer.y;
      }
      
      // Use customOffset if provided, otherwise use worldOffsetRef.current
      const offset = customOffset || worldOffsetRef.current;
      
      // Calculate the position relative to the grid's top-left corner
      // Adjust for the grid container's actual position
      const relativeX = app.screen.width / 2 - offset.x - gridOffsetX;
      const relativeY = app.screen.height / 2 - offset.y - gridOffsetY;
      
      // Calculate grid cell coordinates (integer values)
      const gridX = Math.floor(relativeX / TILE_SIZE);
      const gridY = Math.floor(relativeY / TILE_SIZE);
      
      // Calculate precise position within the grid cell (0-1 range)
      const cellX = (relativeX % TILE_SIZE) / TILE_SIZE;
      const cellY = (relativeY % TILE_SIZE) / TILE_SIZE;
      
      return {
        x: gridX,                // Grid cell X (integer)
        y: gridY,                // Grid cell Y (integer)
        pixelX: Math.round(relativeX),  // Pixel position relative to grid
        pixelY: Math.round(relativeY),  // Pixel position relative to grid
        cellX: parseFloat(cellX.toFixed(2)),  // Position within cell (0-1)
        cellY: parseFloat(cellY.toFixed(2)),  // Position within cell (0-1)
        direction: direction,
        isMoving: moving && !isLocked,
        isSprinting: isSprinting,
        isLocked: isLocked
      };
    } catch (error) {
      console.error('[GridPosition] Error in calculateCharacterState:', error);
      // Return a safe default state
      return {
        x: 0, y: 0, pixelX: 0, pixelY: 0, cellX: 0, cellY: 0,
        direction: direction || 'down',
        isMoving: false, isSprinting: false, isLocked: true
      };
    }
  }, []);
  
  return {
    updateGridSize,
    initializeWorldOffset,
    updateWorldOffset,
    calculateCharacterState,
    gridSizeRef,
    worldOffsetRef
  };
};

export default useGridPosition;
