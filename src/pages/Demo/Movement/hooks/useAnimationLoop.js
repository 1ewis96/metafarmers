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
  const lastMovingState = useRef(false);
  const lastSprintingState = useRef(false); // Store the latest speed values in refs to ensure they're always current
  const walkSpeedRef = useRef(walkSpeed);
  const sprintSpeedRef = useRef(sprintSpeed);

  // Update refs when props change to ensure we always use the latest values
  useEffect(() => {
    walkSpeedRef.current = walkSpeed;
    sprintSpeedRef.current = sprintSpeed;
  }, [walkSpeed, sprintSpeed]);

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

        // Simple delta capping for consistent movement speed
        const scaledDelta = Math.min(delta, 1.0) * 0.15;
        
        // Direct, simple speed calculation - no complex formulas
        // Just use the speed values directly from props
        const actualWalkSpeed = walkSpeed * 0.05;
        const actualSprintSpeed = sprintSpeed * 0.05;
        
        const { vx, vy, moving, direction, isLocked, isSprinting } = 
          calculateMovement(actualWalkSpeed, actualSprintSpeed);
        
        // Apply a consistent delta scaling without additional factors
        const scaledVx = vx * scaledDelta;
        const scaledVy = vy * scaledDelta;
        
        // No logging in production to keep console clean

        // Update character direction if provided
        if (direction) {
          lastDirectionRef.current = direction;
        }

        // Simple animation speed calculation
        // Just use a direct multiplier based on whether sprinting or not
        const animationSpeedFactor = isSprinting ? 1.8 : 1.0;
        
        // Update animation with simplified parameters
        const { elapsed: newElapsed, frame } = updateAnimation({
          isMoving: moving,
          isLocked,
          direction: lastDirectionRef.current,
          elapsed,
          delta: scaledDelta,
          fps: animationFps,
          framesPerDirection: framesPerDirection,
          isSprinting: isSprinting,
          speedFactor: animationSpeedFactor // Just pass a simple speed factor
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
        
        // Only proceed with movement if we're actually moving and not teleporting
        if (moving && !isTeleporting.current) {
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
          
          // Only check for collision if the position would actually change and the collision function exists
          if (typeof hasCollision === 'function' && (potentialState.x !== currentState.x || potentialState.y !== currentState.y)) {
            // Log the potential movement for debugging
            if (appRef.current.ticker.lastTime % 1000 === 0) {
              console.log(`[Movement] Checking collision for move from (${currentState.x}, ${currentState.y}) to (${potentialState.x}, ${potentialState.y})`);
            }
            
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
          
          // Only update world position if not colliding and world container is valid
          if (!collisionDetected && worldContainerRef.current && worldContainerRef.current.transform) {
            // Update world position based on scaled movement
            const updatedOffset = updateWorldOffset(
              appRef.current, 
              gridContainerRef.current, 
              scaledVx, // Use scaled velocity
              scaledVy, // Use scaled velocity
              moving, 
              isLocked
            );
            
            // Apply the position update
            worldContainerRef.current.position.set(updatedOffset.x, updatedOffset.y);
            
            // Force the transform update to ensure the position change takes effect immediately
            worldContainerRef.current.updateTransform();
          }
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
            
            // Add state property based on movement
            if (moving) {
              state.state = isSprinting ? 'running' : 'walking';
            } else {
              state.state = 'idle';
            }
            
            // Only update state if grid position or movement state has changed
            if (state.x !== lastGridPosition.current.x || 
                state.y !== lastGridPosition.current.y ||
                state.isMoving !== lastMovingState.current ||
                state.isSprinting !== lastSprintingState.current) {
              
              // Update last grid position and movement state
              const oldX = lastGridPosition.current.x;
              const oldY = lastGridPosition.current.y;
              lastGridPosition.current = { x: state.x, y: state.y };
              lastMovingState.current = state.isMoving;
              lastSprintingState.current = state.isSprinting;
              
              // Check for step-on interactions if position has changed
              if ((state.x !== oldX || state.y !== oldY) && typeof handleStepOn === 'function') {
                try {
                  const stepOnResult = handleStepOn(state.x, state.y);
                  if (stepOnResult && stepOnResult.type === 'teleport' && onTeleport) {
                    console.log(`[Teleport] Triggering teleport to ${stepOnResult.layerId} (${stepOnResult.x}, ${stepOnResult.y})`);
                    onTeleport(stepOnResult.x, stepOnResult.y, stepOnResult.layerId);
                  }
                } catch (error) {
                  console.error('[Animation] Error handling step-on interaction:', error);
                }
              }
              
              // Ensure all position data is included
              const fullState = {
                ...state,
                pixelX: state.pixelX || 0,
                pixelY: state.pixelY || 0,
                cellX: state.cellX || 0,
                cellY: state.cellY || 0,
                direction: lastDirectionRef.current,
                isMoving: moving,
                isSprinting: isSprinting,
                state: state.state || 'idle'
              };
              
              // Call the onStateChange callback with the full state
              onStateChange(fullState);
              
              // Debug log state updates occasionally
              if (appRef.current.ticker.lastTime % 1000 === 0 && moving) {
                console.log('[Animation] Character state update:', fullState);
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
