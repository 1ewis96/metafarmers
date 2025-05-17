import { useCallback } from 'react';

/**
 * Hook to provide debugging tools for the Pixi canvas
 * @param {Object} params - Parameters for the debug tools
 * @param {Object} params.appRef - Reference to the PIXI application
 * @param {Object} params.worldContainerRef - Reference to the world container
 * @param {Object} params.gridContainerRef - Reference to the grid container
 * @param {Function} params.calculateCharacterState - Function to calculate character state
 * @returns {Object} - Debug utility functions
 */
const useDebugTools = ({
  appRef,
  worldContainerRef,
  gridContainerRef,
  calculateCharacterState
}) => {
  // Add a function to log the current grid position
  const logGridPosition = useCallback(() => {
    if (worldContainerRef.current && appRef.current) {
      const { gridX, gridY } = calculateCharacterState(appRef.current, worldContainerRef.current);
      console.log(`[Movement] Current grid position: (${gridX}, ${gridY})`);
      return { x: gridX, y: gridY };
    }
    return null;
  }, [calculateCharacterState, appRef, worldContainerRef]);

  // Function to log the current state of the world container
  const logWorldContainerState = useCallback(() => {
    if (worldContainerRef.current && worldContainerRef.current.transform) {
      const { x, y } = worldContainerRef.current.position;
      console.log(`[Debug] World container position: (${x}, ${y})`);
      return { x, y };
    }
    return null;
  }, [worldContainerRef]);

  // Function to log the current state of the grid container
  const logGridContainerState = useCallback(() => {
    if (gridContainerRef.current && gridContainerRef.current.transform) {
      const { x, y } = gridContainerRef.current.position;
      console.log(`[Debug] Grid container position: (${x}, ${y})`);
      return { x, y };
    }
    return null;
  }, [gridContainerRef]);

  return {
    logGridPosition,
    logWorldContainerState,
    logGridContainerState
  };
};

export default useDebugTools;
