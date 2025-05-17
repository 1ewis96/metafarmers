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
  framesPerDirection = 8, // Default to 8 frames per direction based on API response
  hasCollision, // Function to check if a position has collision
  onTeleport // Function to handle teleportation
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
        const scaledDelta = Math.min(delta, 1.0) * 0.2; // Cap delta and reduce speed by 80%
        
        // Use fixed base speeds and multiply by the speed settings
        // This ensures consistent behavior when adjusting speeds
        const baseWalkSpeed = 0.3; // Adjusted for better speed
        const baseSprintSpeed = 0.6; // Adjusted for better speed
        
        // Calculate actual speeds with a balanced multiplier
        const actualWalkSpeed = baseWalkSpeed * (walkSpeed / 3.0);
        const actualSprintSpeed = baseSprintSpeed * (sprintSpeed / 3.0);
        
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

        // Calculate the current grid position before movement
        const currentState = calculateCharacterState(
          appRef.current,
          gridContainerRef.current,
          lastDirectionRef.current,
          moving,
          isLocked,
          isSprinting
        );
        
        // Calculate the potential new position
        const potentialOffset = updateWorldOffset(
          appRef.current, 
          gridContainerRef.current, 
          scaledVx, 
          scaledVy, 
          moving, 
          isLocked,
          true // Just calculate, don't apply
        );
        
        // Calculate what the grid position would be after movement
        const potentialState = calculateCharacterState(
          appRef.current,
          gridContainerRef.current,
          lastDirectionRef.current,
          moving,
          isLocked,
          isSprinting,
          potentialOffset
        );
        
        // Check for collision at the potential position
        let collisionDetected = false;
        
        // Only check for collision if we're actually trying to move and the collision function exists
        if (moving && typeof hasCollision === 'function' && (potentialState.x !== currentState.x || potentialState.y !== currentState.y)) {
          // Log the potential movement for debugging
          console.log(`[Movement] Checking collision for move from (${currentState.x}, ${currentState.y}) to (${potentialState.x}, ${potentialState.y})`);
          
          // Check for collision at the target position
          try {
            collisionDetected = hasCollision(potentialState.x, potentialState.y);
            
            if (collisionDetected) {
              console.log(`[Collision] Blocked movement to (${potentialState.x}, ${potentialState.y})`);
            }
          } catch (error) {
            console.error('[Collision] Error checking for collision:', error);
            collisionDetected = false; // Default to allowing movement if there's an error
          }
        }
        
        // Only update world position if not teleporting, not colliding, and world container is valid
        if (!isTeleporting.current && !collisionDetected && worldContainerRef.current && worldContainerRef.current.transform) {
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
              
              // Check for step-on interactions and handle teleport if needed
              const stepOnResult = handleStepOn(state.x, state.y);
              if (stepOnResult && stepOnResult.type === 'teleport' && onTeleport) {
                console.log(`[Teleport] Triggering teleport to ${stepOnResult.layerId} (${stepOnResult.x}, ${stepOnResult.y})`);
                onTeleport(stepOnResult.x, stepOnResult.y, stepOnResult.layerId);
              }
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
