import { useEffect } from 'react';

/**
 * Hook to set up teleport reference with functions
 * @param {Object} params - Parameters for the teleport ref
 * @param {Object} params.teleportRef - Reference to expose teleport functionality
 * @param {Function} params.teleportToCoordinates - Function to teleport to coordinates
 * @param {Function} params.updateGridSize - Function to update grid size
 * @returns {void}
 */
const useTeleportRef = ({
  teleportRef,
  teleportToCoordinates,
  updateGridSize
}) => {
  useEffect(() => {
    if (!teleportRef) return;
    
    // Create an enhanced teleport function that includes updateGridSize
    teleportRef.current = teleportToCoordinates;
    
    // Add the updateGridSize function as a property of the teleport function
    teleportRef.current.updateGridSize = updateGridSize;
    
    console.log('[Teleport] Function and updateGridSize exposed via teleportRef');
  }, [teleportRef, teleportToCoordinates, updateGridSize]);
};

export default useTeleportRef;
