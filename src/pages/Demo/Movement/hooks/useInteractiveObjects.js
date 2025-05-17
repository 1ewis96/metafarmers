import { useState, useEffect, useCallback, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { TILE_SIZE } from '../utils/apiConfig';

/**
 * Hook to manage interactive objects in the game world
 * @param {Object} options - Configuration options
 * @param {string} options.currentLayer - The current layer ID
 * @returns {Object} Object methods and state
 */
const useInteractiveObjects = ({ currentLayer, worldContainerRef, gridContainerRef, appRef }) => {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collisionMap, setCollisionMap] = useState({});
  const doorSprites = useRef({});
  const doorStates = useRef({});
  const collisionMapRef = useRef({});
  
  // Fetch objects for the current layer
  const fetchObjects = useCallback(async () => {
    if (!currentLayer) return;
    
    setLoading(true);
    try {
      console.log(`[Objects] Fetching objects for layer: ${currentLayer}`);
      
      // Use the correct API endpoint with POST method
      const response = await fetch('https://api.metafarmers.io/objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'metafarmers-default-key'
        },
        body: JSON.stringify({
          layer: currentLayer
        })
      });
      
      const data = await response.json();
      
      if (data.message === 'success' && Array.isArray(data.data)) {
        console.log('[Objects] Loaded', data.data.length, 'objects for layer', currentLayer);
        
        // Debug: Log a few sample objects to see their structure
        if (data.data.length > 0) {
          console.log('[Objects] Sample object:', data.data[0]);
        }
        
        setObjects(data.data);
        
        // Build collision map from objects with collision=true
        const newCollisionMap = {};
        
        // Process collision objects from the data
        data.data.forEach(obj => {
          // Check for collision property - it can be either boolean true or string "true"
          if (obj.collision === true || obj.collision === "true") {
            // Convert coordinates to numbers to ensure proper key generation
            const x = Number(obj.x);
            const y = Number(obj.y);
            const key = `${x},${y}`;
            newCollisionMap[key] = true;
            console.log(`[Collision] Added collision at (${x}, ${y})`);
          }
        });
        
        console.log('[Collision] Final collision map:', newCollisionMap);
        // Update both state and ref to ensure persistence
        collisionMapRef.current = newCollisionMap;
        setCollisionMap(newCollisionMap);
        
        // Create door sprites for objects with door=true
        if (appRef?.current && gridContainerRef?.current) {
          // Clean up existing door sprites
          Object.values(doorSprites.current).forEach(sprite => {
            if (sprite.parent) {
              sprite.parent.removeChild(sprite);
            }
            sprite.destroy();
          });
          doorSprites.current = {};
          doorStates.current = {};
          
          // Create new door sprites
          data.data.forEach(obj => {
            if (obj.door === true) {
              createDoorSprite(obj);
            }
          });
        }
      } else {
        console.error('[Objects] Failed to load objects:', data);
        setObjects([]);
      }
    } catch (error) {
      console.error('[Objects] Error fetching objects:', error);
      setObjects([]);
    } finally {
      setLoading(false);
    }
  }, [currentLayer]);
  
  // Load objects when layer changes
  useEffect(() => {
    fetchObjects();
    
    // Debug: Log objects state after a delay to ensure it's updated
    const timer = setTimeout(() => {
      console.log(`[Objects] Current objects in state for layer ${currentLayer}:`, objects);
      console.log(`[Collision] Current collision map:`, collisionMap);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [currentLayer, fetchObjects, collisionMap]);
  
  // Create a door sprite for a door object
  const createDoorSprite = useCallback((object) => {
    if (!appRef?.current || !gridContainerRef?.current) return;
    
    const x = Number(object.x);
    const y = Number(object.y);
    const key = `${x},${y}`;
    
    // Create a simple door graphic
    const doorGraphic = new PIXI.Graphics();
    doorGraphic.beginFill(0x8B4513); // Brown color for door
    doorGraphic.lineStyle(2, 0x000000);
    doorGraphic.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    doorGraphic.endFill();
    
    // Add a line to represent the hinge side
    doorGraphic.lineStyle(3, 0x000000);
    doorGraphic.moveTo(TILE_SIZE, 0);
    doorGraphic.lineTo(TILE_SIZE, TILE_SIZE);
    
    // Create a texture from the graphic
    const doorTexture = appRef.current.renderer.generateTexture(doorGraphic);
    
    // Create a sprite with the door texture
    const doorSprite = new PIXI.Sprite(doorTexture);
    doorSprite.anchor.set(1, 0.5); // Set pivot to right-middle (100%, 50%)
    doorSprite.x = (x * TILE_SIZE) + TILE_SIZE; // Position at right edge of tile
    doorSprite.y = (y * TILE_SIZE) + (TILE_SIZE / 2); // Position at middle of tile
    doorSprite.rotation = 0; // Closed position
    
    // Add to grid container
    gridContainerRef.current.addChild(doorSprite);
    
    // Store the sprite reference
    doorSprites.current[key] = doorSprite;
    doorStates.current[key] = {
      isOpen: false,
      isAnimating: false,
      cooldown: false
    };
    
    console.log(`[Door] Created door sprite at (${x}, ${y})`);
    
    return doorSprite;
  }, [appRef, gridContainerRef]);
  
  // Animate a door opening or closing
  const animateDoor = useCallback((x, y, open) => {
    const key = `${x},${y}`;
    const doorSprite = doorSprites.current[key];
    const doorState = doorStates.current[key];
    
    if (!doorSprite || !doorState || doorState.isAnimating) return;
    
    doorState.isAnimating = true;
    const targetRotation = open ? Math.PI * 0.75 : 0; // 135 degrees open or 0 degrees closed
    const startRotation = doorSprite.rotation;
    const duration = 500; // ms
    const startTime = Date.now();
    
    // Remove collision temporarily when door is opening
    if (open) {
      const collisionKey = `${x},${y}`;
      // Update both the state and the ref
      setCollisionMap(prev => {
        const newMap = {...prev};
        delete newMap[collisionKey];
        // Update the ref to match the state
        collisionMapRef.current = newMap;
        return newMap;
      });
    }
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease in-out function for smoother animation
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      
      doorSprite.rotation = startRotation + (targetRotation - startRotation) * easeProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        doorSprite.rotation = targetRotation;
        doorState.isOpen = open;
        doorState.isAnimating = false;
        
        // Add collision back when door is closed
        if (!open) {
          const collisionKey = `${x},${y}`;
          setCollisionMap(prev => {
            const newMap = {
              ...prev,
              [collisionKey]: true
            };
            // Update the ref to match the state
            collisionMapRef.current = newMap;
            return newMap;
          });
        }
        
        // Set cooldown to prevent rapid toggling
        doorState.cooldown = true;
        setTimeout(() => {
          if (doorStates.current[key]) {
            doorStates.current[key].cooldown = false;
          }
        }, 1000);
      }
    };
    
    animate();
  }, []);
  
  // Execute the object's action
  const executeAction = useCallback((object) => {
    if (!object.action && !object.door) {
      console.log('[Objects] Object has no action or special properties:', object);
      return false;
    }
    
    // Handle door objects
    if (object.door === true) {
      const x = Number(object.x);
      const y = Number(object.y);
      const key = `${x},${y}`;
      const doorState = doorStates.current[key];
      
      if (doorState && !doorState.cooldown) {
        console.log(`[Door] Toggling door at (${x}, ${y}) to ${!doorState.isOpen ? 'open' : 'closed'}`);
        animateDoor(x, y, !doorState.isOpen);
        return true;
      }
      return false;
    }
    
    // Handle action objects
    if (object.action) {
      console.log('[Objects] Executing action:', object.action);
      
      switch (object.action.type) {
        case 'teleport':
          const destination = object.action.destination || object.action.destionation; // Handle typo in API
          if (destination) {
            console.log(`[Objects] Found teleport object to ${destination.layerId} (${destination.x}, ${destination.y}), facing ${destination.facing}`);
            return {
              type: 'teleport',
              x: Number(destination.x),
              y: Number(destination.y),
              layerId: destination.layerId,
              facing: destination.facing
            };
          } else {
            console.error('[Objects] Teleport action missing destination:', object.action);
          }
          break;
          
        // Add other action types here
        default:
          console.log(`[Objects] Unknown action type: ${object.action.type}`);
      }
    }
    
    return false;
  }, [animateDoor]);
  
  // Check for objects at a specific position
  const getObjectsAt = useCallback((x, y) => {
    // Convert the parameters to numbers to ensure proper comparison
    const gridX = Number(x);
    const gridY = Number(y);
    
    console.log(`[Objects] Searching for objects at (${gridX}, ${gridY}) among ${objects.length} objects`);
    
    // Special case for the teleport tile at (13, 1)
    if (gridX === 13 && gridY === 1) {
      console.log('[Objects] Player is on the teleport tile at (13, 1)!');
      
      // Check if we have a teleport object at this position
      const teleportObject = objects.find(obj => 
        Number(obj.x) === 13 && 
        Number(obj.y) === 1 && 
        obj.action && 
        obj.action.type === 'teleport'
      );
      
      if (teleportObject) {
        console.log('[Objects] Found teleport object at (13, 1):', teleportObject);
        return [teleportObject];
      } else {
        console.log('[Objects] No teleport object found at (13, 1) in objects array, checking for one in the API response');
      }
    }
    
    const foundObjects = objects.filter(obj => {
      // Convert object coordinates to numbers for comparison
      const objX = Number(obj.x);
      const objY = Number(obj.y);
      
      return objX === gridX && objY === gridY;
    });
    
    if (foundObjects.length > 0) {
      console.log(`[Objects] Found ${foundObjects.length} objects at position (${gridX}, ${gridY}):`, foundObjects);
    }
    
    return foundObjects;
  }, [objects]);

  
  // Check if a position has collision
  const hasCollision = useCallback((x, y) => {
    // Convert coordinates to numbers to ensure proper key generation
    const gridX = Number(x);
    const gridY = Number(y);
    const key = `${gridX},${gridY}`;
    
    // Use the persistent reference instead of the state
    // This ensures we always have the latest collision map
    const currentCollisionMap = collisionMapRef.current;
    
    // Log the collision check for debugging
    console.log(`[Collision] Checking for collision at (${gridX}, ${gridY}), key=${key}`);
    
    // Check if the position has collision
    const result = currentCollisionMap[key] === true;
    
    console.log(`[Collision] Result for (${gridX}, ${gridY}): ${result ? 'BLOCKED' : 'allowed'}, collisionMap:`, currentCollisionMap);
    
    return result;
  }, []);
  
  // Handle step-on interactions
  const handleStepOn = useCallback((x, y) => {
    const objectsAtPosition = getObjectsAt(x, y);
    
    if (objectsAtPosition.length === 0) {
      return null;
    }
    
    console.log(`[Objects] Found ${objectsAtPosition.length} objects at position (${x}, ${y})`);
    
    for (const obj of objectsAtPosition) {
      // Check both activationType and action.activationType (API inconsistency)
      const activationType = obj.activationType || (obj.action && obj.action.activationType);
      
      if (obj.action && (activationType === 'step_on' || !activationType)) {
        console.log(`[Objects] Executing step-on action for object at (${obj.x}, ${obj.y}):`, obj);
        const result = executeAction(obj);
        if (result && result.type === 'teleport') {
          return result; // Return teleport info to be handled by the caller
        }
      }
    }
    
    return null;
  }, [getObjectsAt, executeAction]);
  
  // Handle click/interact interactions
  const handleInteract = useCallback((x, y) => {
    const objectsAtPosition = getObjectsAt(x, y);
    let interactionHandled = false;
    
    for (const obj of objectsAtPosition) {
      // Check for door objects first
      if (obj.door === true) {
        console.log(`[Door] Interacting with door at (${x}, ${y})`);
        const result = executeAction(obj);
        if (result === true) {
          interactionHandled = true;
        }
      }
      // Then check for objects with interact activation
      else if (obj.action && obj.activationType === 'interact') {
        const result = executeAction(obj);
        if (result && result.type === 'teleport') {
          return result; // Return teleport info to be handled by the caller
        }
        interactionHandled = true;
      }
    }
    
    return interactionHandled ? true : objectsAtPosition.length > 0;
  }, [getObjectsAt, executeAction]);
  
  /**
   * Check if there is a collision at the specified grid coordinates
   * @param {number} x - The x grid coordinate to check
   * @param {number} y - The y grid coordinate to check
   * @returns {boolean} True if there is a collision, false otherwise
   */
  const hasCollisionAt = useCallback((x, y) => {
    const key = `${x},${y}`;
    return collisionMap[key] === true;
  }, [collisionMap]);

  return {
    objects,
    loading,
    fetchObjects,
    getObjectsAt,
    handleStepOn,
    handleInteract,
    hasCollision,
    collisionMap,
    hasCollisionAt
  };
};

export default useInteractiveObjects;
