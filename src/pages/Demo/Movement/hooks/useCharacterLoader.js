import { useRef, useCallback } from 'react';
import { Texture, Sprite, Rectangle, Assets, SCALE_MODES } from 'pixi.js';

/**
 * Hook for loading and managing character sprites
 * @param {Object} options - Configuration options
 * @returns {Object} Character loading and management functions
 */
const useCharacterLoader = () => {
  const characterRef = useRef(null);
  const framesRef = useRef({});
  const lastDirectionRef = useRef('right');
  const lastFrameRef = useRef(0);
  const lastLoadedSkinIdRef = useRef(null);
  const loadingRef = useRef(false);

  /**
   * Cleans up the current character sprite
   */
  const cleanupCharacter = useCallback(() => {
    if (characterRef.current) {
      // Remove from parent if it has one
      if (characterRef.current.parent) {
        characterRef.current.parent.removeChild(characterRef.current);
      }
      
      // Destroy the sprite and its textures
      characterRef.current.destroy({ children: true, texture: false, baseTexture: false });
      characterRef.current = null;
      
      console.log('[Movement] Cleaned up previous character sprite');
    }
  }, []);

  /**
   * Loads a character sprite from the API
   * @param {string} skinId - The ID of the character skin to load
   * @returns {Promise<Object>} The loaded character data and sprite
   */
  const loadCharacter = useCallback(async (skinId) => {
    // Default to character-1 if no skinId provided
    const effectiveSkinId = skinId || 'character-1';
    
    // Prevent duplicate loading of the same skin
    if (loadingRef.current) {
      console.log(`[Movement] Character loading already in progress, skipping request for ${effectiveSkinId}`);
      return null;
    }
    
    // If we already have this skin loaded, return the current character
    if (lastLoadedSkinIdRef.current === effectiveSkinId && characterRef.current) {
      console.log(`[Movement] Character skin ${effectiveSkinId} already loaded, reusing existing sprite`);
      return { sprite: characterRef.current };
    }
    
    loadingRef.current = true;
    console.log(`[Movement] Fetching character skin: ${effectiveSkinId}`);
    
    try {
      // Clean up any existing character first
      cleanupCharacter();
      
      const spriteInfoResponse = await fetch(`https://api.metafarmers.io/character/${effectiveSkinId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'metafarmers-default-key'
        }
      });
      
      const spriteInfo = await spriteInfoResponse.json();
      console.log(`[Movement] Character data:`, spriteInfo);
    
      // Check if spriteInfo has the required data
      if (!spriteInfo || !spriteInfo.spriteSheet) {
        console.error(`[Movement] Invalid character data for ${effectiveSkinId}:`, spriteInfo);
        throw new Error(`Invalid character data for ${effectiveSkinId}`);
      }
    
      const spriteSheetUrl = spriteInfo.spriteSheet.url;
      const frameWidth = spriteInfo.spriteSheet.frameSize.width;
      const frameHeight = spriteInfo.spriteSheet.frameSize.height;
      const framesPerDirection = spriteInfo.spriteSheet.framesPerDirection;
      const directionMap = spriteInfo.spriteSheet.directionMap;
      const scale = spriteInfo.render?.scale || 2;

      // Load the character texture
      const characterTexture = await Assets.load(spriteSheetUrl);
      characterTexture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      const baseTexture = characterTexture.baseTexture;

      // Create frames for each direction - exactly as defined in the API response
      const frames = {};
      
      // Log the direction map from the API
      console.log(`[Animation] Direction map from API:`, directionMap);
      console.log(`[Animation] Frames per direction: ${framesPerDirection}`);
      
      // Process each direction from the API's directionMap
      for (const [direction, row] of Object.entries(directionMap)) {
        frames[direction] = [];
        
        // Create the correct number of frames for each direction
        for (let i = 0; i < framesPerDirection; i++) {
          // Calculate the correct rectangle for this frame
          const rect = new Rectangle(
            i * frameWidth,           // x position based on frame index
            row * frameHeight,        // y position based on direction row
            frameWidth,               // width of each frame
            frameHeight               // height of each frame
          );
          
          // Create a new texture for this frame
          const texture = new Texture(baseTexture, rect);
          frames[direction].push(texture);
        }
        
        console.log(`[Animation] Loaded ${frames[direction].length} frames for direction: ${direction} (row ${row})`);
      }
      
      // Verify we have frames for all expected directions
      const expectedDirections = ['up', 'down', 'left', 'right'];
      for (const dir of expectedDirections) {
        if (!frames[dir] || frames[dir].length === 0) {
          console.warn(`[Animation] Missing frames for direction: ${dir}`);
        } else {
          console.log(`[Animation] Direction ${dir} has ${frames[dir].length} frames`);
        }
      }
      framesRef.current = frames;

      // Create the character sprite
      const sprite = new Sprite(frames.right[0]);
      sprite.anchor.set(spriteInfo.render.anchor?.x ?? 0.5, spriteInfo.render.anchor?.y ?? 0.5);
      sprite.scale.set(scale);
      characterRef.current = sprite;
      
      // Update the last loaded skin ID
      lastLoadedSkinIdRef.current = effectiveSkinId;
      console.log(`[Movement] Successfully loaded character skin: ${effectiveSkinId}`);

      return {
        sprite,
        frames,
        spriteInfo,
        framesPerDirection
      };
    } catch (error) {
      console.error(`[Movement] Error loading character:`, error);
      throw error;
    } finally {
      loadingRef.current = false;
    }
  }, [cleanupCharacter]);

  /**
   * Updates the character animation frame
   * @param {Object} options - Animation options
   */
  const updateAnimation = useCallback(({ isMoving, isLocked, direction, elapsed, delta, fps, framesPerDirection }) => {
    // Store the current direction
    if (direction) {
      // Only update if direction actually changed
      if (lastDirectionRef.current !== direction) {
        console.log(`[Animation] Direction changed from ${lastDirectionRef.current} to ${direction}`);
        lastDirectionRef.current = direction;
      }
    }
    
    // Animation logic
    if (isMoving && !isLocked) {
      // Calculate new elapsed time
      const newElapsed = elapsed + delta;
      
      // Only update frame when enough time has passed
      if (newElapsed >= 60 / fps) {
        // Increment frame and wrap around when reaching the end
        const newFrame = (lastFrameRef.current + 1) % framesPerDirection;
        lastFrameRef.current = newFrame;
        
        return { 
          elapsed: 0, // Reset elapsed time
          frame: newFrame
        };
      }
      
      // Not enough time has passed, keep current frame
      return { 
        elapsed: newElapsed,
        frame: lastFrameRef.current
      };
    } else {
      // Not moving, reset to standing frame
      lastFrameRef.current = 0;
      return { 
        elapsed: 0,
        frame: 0
      };
    }
  }, []);

  /**
   * Updates the character sprite texture
   * @param {string} direction - The direction the character is facing
   * @param {number} frame - The animation frame to display
   */
  const updateTexture = useCallback((direction, frame) => {
    // Check if we have a character and frames for the direction
    if (!characterRef.current) {
      console.log('[Animation] No character sprite available');
      return;
    }
    
    // Ensure we have frames for this direction
    if (!framesRef.current[direction]) {
      console.log(`[Animation] No frames available for direction: ${direction}`);
      // Fall back to 'right' direction if the requested direction doesn't exist
      if (framesRef.current['right']) {
        console.log('[Animation] Falling back to right direction');
        direction = 'right';
      } else {
        // No fallback available
        return;
      }
    }
    
    // Make sure the frame index is valid
    const frames = framesRef.current[direction];
    const validFrame = Math.min(Math.max(0, frame), frames.length - 1);
    
    // Only update if the texture would actually change
    if (characterRef.current.texture !== frames[validFrame]) {
      characterRef.current.texture = frames[validFrame];
    }
  }, []);

  return {
    loadCharacter,
    updateAnimation,
    updateTexture,
    cleanupCharacter,
    characterRef,
    lastDirectionRef,
    lastFrameRef
  };
};

export default useCharacterLoader;
