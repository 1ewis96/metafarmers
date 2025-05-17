import { useEffect, useRef } from 'react';

/**
 * Hook to handle animation loop and character movement
 * @param {Object} params - Parameters for the animation loop
 * @param {Object} params.appRef - Reference to the PIXI application
 * @param {Object} params.worldContainerRef - Reference to the world container
 * @param {Object} params.gridContainerRef - Reference to the grid container
 * @param {Object} params.characterRef - Reference to the character sprite
 * @param {Object} params.lastDirectionRef - Reference to the last direction
 * @param {Object} params.isTeleporting - Reference to teleport state
 * @param {Function} params.calculateMovement - Function to calculate movement
 * @param {Function} params.updateAnimation - Function to update animation
 * @param {Function} params.updateTexture - Function to update texture
 * @param {Function} params.updateWorldOffset - Function to update world offset
 * @param {Function} params.calculateCharacterState - Function to calculate character state
 * @param {Function} params.handleStepOn - Function to handle step-on interactions
 * @param {Function} params.onStateChange - Callback for state changes
 * @param {boolean} params.isFocused - Whether the canvas is focused
 * @param {number} params.walkSpeed - Walking speed
 * @param {number} params.sprintSpeed - Sprinting speed
 * @returns {Object} - Animation ticker reference
 */
const useAnimationLoop = ({
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
  animationFps = 12, // Animation frames per second, can be adjusted on the fly
  framesPerDirection = 8 // Default to 8 frames per direction based on API response
}) => {
  const animationTicker = useRef(null);
  const lastGridPosition = useRef({ x: -1, y: -1 });

  useEffect(() => {
    if (!appRef.current) return;

    // Animation settings - use the animationFps parameter
    let elapsed = 0;
    let animationFrame = 0;
    
    // Store the previous delta to detect large time jumps
    let previousDelta = 0;
    
    console.log(`[Animation] Starting animation loop with ${framesPerDirection} frames per direction and ${animationFps} FPS`);

    animationTicker.current = appRef.current.ticker.add((delta) => {
      try {
        // Skip if not focused or if world container is not available
        if (!isFocused.current || !worldContainerRef.current || !worldContainerRef.current.transform) {
          return;
        }

        // Scale down delta to prevent super-fast movement
        const scaledDelta = Math.min(delta, 1.0); // Cap delta at 1.0 to prevent huge jumps
        
        // Use fixed base speeds and multiply by the speed settings
        // This ensures consistent behavior when adjusting speeds
        const baseWalkSpeed = 1.0;
        const baseSprintSpeed = 2.0;
        
        // Calculate actual speeds - directly proportional to slider values
        const actualWalkSpeed = baseWalkSpeed * (walkSpeed / 2.0);
        const actualSprintSpeed = baseSprintSpeed * (sprintSpeed / 4.0);
        
        const { vx, vy, moving, direction, isLocked, isSprinting } = 
          calculateMovement(actualWalkSpeed, actualSprintSpeed);
        
        // Apply a consistent delta scaling without additional factors
        const scaledVx = vx * scaledDelta;
        const scaledVy = vy * scaledDelta;
        
        // Log speed values when they change
        if (appRef.current.ticker.lastTime % 1000 === 0 && moving) {
          console.log(`[Speed] Walk: ${walkSpeed.toFixed(2)}, Sprint: ${sprintSpeed.toFixed(2)}, Moving: ${moving}, Sprinting: ${isSprinting}`);
        }

        // Update character direction if provided
        if (direction) {
          lastDirectionRef.current = direction;
        }

        // Update animation with properly scaled delta
        const { elapsed: newElapsed, frame } = updateAnimation({
          isMoving: moving,
          isLocked,
          direction: lastDirectionRef.current,
          elapsed,
          delta: scaledDelta, // Use scaled delta for consistent animation speed
          fps: animationFps, // Use the dynamic animationFps parameter
          framesPerDirection: framesPerDirection // Use the parameter value
        });
        
        elapsed = newElapsed;
        animationFrame = frame; // Store the animation frame
        
        // Debug animation frames
        if (moving && appRef.current.ticker.lastTime % 300 === 0) {
          console.log(`[Animation] Direction: ${lastDirectionRef.current}, Frame: ${frame}, Moving: ${moving}`);
        }

        // Update character texture if we have a valid character
        if (characterRef.current) {
          updateTexture(lastDirectionRef.current, animationFrame);
        }

        // Keep character centered
        if (characterRef.current) {
          characterRef.current.x = appRef.current.screen.width / 2;
          characterRef.current.y = appRef.current.screen.height / 2;
        }

        // Only update world position if not teleporting and world container is valid
        if (!isTeleporting.current && worldContainerRef.current && worldContainerRef.current.transform) {
          // Update world position based on scaled movement
          const updatedOffset = updateWorldOffset(
            appRef.current, 
            gridContainerRef.current, 
            scaledVx, // Use scaled velocity
            scaledVy, // Use scaled velocity
            moving, 
            isLocked
          );
          worldContainerRef.current.position.set(updatedOffset.x, updatedOffset.y);
        } else if (isTeleporting.current) {
          // Skip position update during teleportation
          console.log('[Teleport] Position update skipped - teleport in progress');
        }

        // Update character state for parent component
        if (onStateChange && worldContainerRef.current && worldContainerRef.current.transform) {
          try {
            const state = calculateCharacterState(
              appRef.current,
              gridContainerRef.current,
              lastDirectionRef.current,
              moving,
              isLocked,
              isSprinting
            );
            onStateChange(state);
            
            // Check for step-on interactions if position has changed
            if (state.x !== lastGridPosition.current.x || state.y !== lastGridPosition.current.y) {
              console.log(`[Position] Moved to new cell: (${state.x}, ${state.y}) from (${lastGridPosition.current.x}, ${lastGridPosition.current.y})`);
              lastGridPosition.current = { x: state.x, y: state.y };
              
              // Check for step-on interactions
              handleStepOn(state.x, state.y);
            }
          } catch (error) {
            console.error('[Animation] Error updating character state:', error);
          }
        }
      } catch (error) {
        console.error('[Animation] Error in animation ticker:', error);
      }
    });

    // Cleanup function for when the component unmounts or dependencies change
    return () => {
      if (appRef.current && animationTicker.current) {
        console.log('[Animation] Removing animation ticker');
        appRef.current.ticker.remove(animationTicker.current);
        animationTicker.current = null;
      }
    };
  }, [
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
    sprintSpeed
  ]);

  return {
    animationTicker
  };
};

export default useAnimationLoop;
