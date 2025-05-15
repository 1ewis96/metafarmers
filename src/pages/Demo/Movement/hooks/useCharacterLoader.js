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

  /**
   * Loads a character sprite from the API
   * @param {string} skinId - The ID of the character skin to load
   * @returns {Promise<Object>} The loaded character data and sprite
   */
  const loadCharacter = useCallback(async (skinId) => {
    console.log(`[Movement] Fetching character skin: ${skinId}`);
    
    // Default to character-1 if no skinId provided
    const effectiveSkinId = skinId || 'character-1';
    
    try {
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

      // Create frames for each direction
      const frames = {};
      for (const [direction, row] of Object.entries(directionMap)) {
        frames[direction] = [];
        for (let i = 0; i < framesPerDirection; i++) {
          const rect = new Rectangle(i * frameWidth, row * frameHeight, frameWidth, frameHeight);
          frames[direction].push(new Texture(baseTexture, rect));
        }
      }
      framesRef.current = frames;

      // Create the character sprite
      const sprite = new Sprite(frames.right[0]);
      sprite.anchor.set(spriteInfo.render.anchor?.x ?? 0.5, spriteInfo.render.anchor?.y ?? 0.5);
      sprite.scale.set(scale);
      characterRef.current = sprite;

      return {
        sprite,
        frames,
        spriteInfo,
        framesPerDirection
      };
    } catch (error) {
      console.error(`[Movement] Error loading character:`, error);
      throw error;
    }
  }, []);

  /**
   * Updates the character animation frame
   * @param {Object} options - Animation options
   */
  const updateAnimation = useCallback(({ isMoving, isLocked, direction, elapsed, delta, fps, framesPerDirection }) => {
    if (direction) {
      lastDirectionRef.current = direction;
    }
    
    if (isMoving && !isLocked) {
      const newElapsed = elapsed + delta;
      if (newElapsed >= 60 / fps) {
        lastFrameRef.current = (lastFrameRef.current + 1) % framesPerDirection;
        return { 
          elapsed: 0,
          frame: lastFrameRef.current
        };
      }
      return { 
        elapsed: newElapsed,
        frame: lastFrameRef.current
      };
    } else {
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
    if (!characterRef.current || !framesRef.current[direction]) return;
    
    characterRef.current.texture = framesRef.current[direction][frame];
  }, []);

  return {
    loadCharacter,
    updateAnimation,
    updateTexture,
    characterRef,
    lastDirectionRef,
    lastFrameRef
  };
};

export default useCharacterLoader;
