import { useRef, useState, useCallback, useEffect } from 'react';
import { Texture, Sprite, Rectangle, Assets, SCALE_MODES } from 'pixi.js';

/**
 * Character states enum
 */
const CHARACTER_STATES = {
  IDLE: 'idle',
  WALKING: 'walking',
  RUNNING: 'running',
  INTERACTING: 'interacting'
};

/**
 * Direction enum
 */
const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * Hook for managing character state, movement, and animation
 * This centralizes all character-related logic in one place
 */
const useCharacterController = ({
  appRef,
  worldContainerRef,
  gridContainerRef,
  isFocused,
  walkSpeed = 2.0,
  sprintSpeed = 4.0,
  animationFps = 8,
  onStateChange,
  hasCollision,
  handleStepOn
}) => {
  // Character state
  const [characterState, setCharacterState] = useState({
    x: 0,
    y: 0,
    direction: DIRECTIONS.RIGHT,
    state: CHARACTER_STATES.IDLE,
    isSprinting: false,
    isLocked: false,
    isMoving: false
  });

  // References
  const characterRef = useRef(null);
  const framesRef = useRef({});
  const lastDirectionRef = useRef(DIRECTIONS.RIGHT);
  const lastFrameRef = useRef(0);
  const lastLoadedSkinIdRef = useRef(null);
  const loadingRef = useRef(false);
  const isTeleporting = useRef(false);
  const animationTicker = useRef(null);
  const lastGridPosition = useRef({ x: -1, y: -1 });
  const worldOffsetRef = useRef({ x: 0, y: 0 });
  const gridSizeRef = useRef({ width: 16, height: 16 });

  // Keyboard state
  const keys = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    shift: false,
    leftShift: false,
    rightShift: false
  });

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
      
      console.log('[Character] Cleaned up previous character sprite');
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
      console.log(`[Character] Character loading already in progress, skipping request for ${effectiveSkinId}`);
      return null;
    }
    
    // If we already have this skin loaded, return the current character
    if (lastLoadedSkinIdRef.current === effectiveSkinId && characterRef.current) {
      console.log(`[Character] Character skin ${effectiveSkinId} already loaded, reusing existing sprite`);
      return { sprite: characterRef.current };
    }
    
    loadingRef.current = true;
    console.log(`[Character] Fetching character skin: ${effectiveSkinId}`);
    
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
      console.log(`[Character] Character data:`, spriteInfo);
    
      // Check if spriteInfo has the required data
      if (!spriteInfo || !spriteInfo.spriteSheet) {
        console.error(`[Character] Invalid character data for ${effectiveSkinId}:`, spriteInfo);
        throw new Error(`Invalid character data for ${effectiveSkinId}`);
      }
    
      const spriteSheetUrl = spriteInfo.spriteSheet.url;
      const frameWidth = spriteInfo.spriteSheet.frameSize.width;
      const frameHeight = spriteInfo.spriteSheet.frameSize.height;
      const framesPerDirection = spriteInfo.spriteSheet.framesPerDirection;
      const directionMap = spriteInfo.spriteSheet.directionMap;
      const scale = spriteInfo.render?.scale || 2;

      // Load the character texture with improved settings
      const characterTexture = await Assets.load(spriteSheetUrl);
      
      // Use NEAREST scaling mode for pixel art to ensure crisp pixels
      characterTexture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      
      // Disable texture filtering for pixel-perfect rendering
      characterTexture.baseTexture.mipmap = false;
      
      // Set texture resolution to match display for better quality
      characterTexture.baseTexture.resolution = window.devicePixelRatio || 1;
      
      const baseTexture = characterTexture.baseTexture;

      // Create frames for each direction - exactly as defined in the API response
      const frames = {};
      
      // Log the direction map from the API
      console.log(`[Character] Direction map from API:`, directionMap);
      console.log(`[Character] Frames per direction: ${framesPerDirection}`);
      
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
        
        console.log(`[Character] Loaded ${frames[direction].length} frames for direction: ${direction} (row ${row})`);
      }
      
      // Verify we have frames for all expected directions
      const expectedDirections = ['up', 'down', 'left', 'right'];
      for (const dir of expectedDirections) {
        if (!frames[dir] || frames[dir].length === 0) {
          console.warn(`[Character] Missing frames for direction: ${dir}`);
        } else {
          console.log(`[Character] Direction ${dir} has ${frames[dir].length} frames`);
        }
      }
      framesRef.current = frames;

      // Create the character sprite with improved settings
      const sprite = new Sprite(frames.right[0]);
      
      // Set anchor point to ensure proper centering
      // Default to center-bottom (feet position) if not specified in the API
      const anchorX = spriteInfo.render.anchor?.x ?? 0.5;
      const anchorY = spriteInfo.render.anchor?.y ?? 0.75; // Center-bottom is better for top-down games
      sprite.anchor.set(anchorX, anchorY);
      
      // Apply integer scaling for pixel-perfect rendering
      const integerScale = Math.round(scale);
      sprite.scale.set(integerScale);
      
      // Enable snapping to pixel boundaries for crisp rendering
      sprite.roundPixels = true;
      
      // Store the sprite reference
      characterRef.current = sprite;
      
      // Update the last loaded skin ID
      lastLoadedSkinIdRef.current = effectiveSkinId;
      console.log(`[Character] Successfully loaded character skin: ${effectiveSkinId}`);

      return {
        sprite,
        frames,
        spriteInfo,
        framesPerDirection
      };
    } catch (error) {
      console.error(`[Character] Error loading character:`, error);
      throw error;
    } finally {
      loadingRef.current = false;
    }
  }, [cleanupCharacter]);

  /**
   * Updates the character texture based on direction and frame with improved handling
   */
  const updateTexture = useCallback((direction, frame) => {
    if (!characterRef.current || !framesRef.current[direction]) {
      return;
    }
    
    // Get the frames for the current direction
    const directionFrames = framesRef.current[direction];
    
    // Make sure the frame index is valid
    const validFrame = Math.min(frame, directionFrames.length - 1);
    
    // Only update the texture if it's actually different to avoid unnecessary GPU work
    if (characterRef.current.texture !== directionFrames[validFrame]) {
      // Update the texture
      characterRef.current.texture = directionFrames[validFrame];
      
      // Force texture update to ensure immediate visual feedback
      characterRef.current.texture.update();
    }
  }, []);

  /**
   * Calculate direction based on mouse position
   */
  const calculateMouseDirection = useCallback(() => {
    if (!characterRef.current || !appRef.current || !useMouseDirection.current) {
      return lastDirectionRef.current;
    }
    
    // Get character position in screen space
    const characterWorldPos = characterRef.current.getGlobalPosition();
    const characterScreenX = characterWorldPos.x;
    const characterScreenY = characterWorldPos.y;
    
    // Calculate angle between character and mouse
    const dx = mousePosition.current.x - characterScreenX;
    const dy = mousePosition.current.y - characterScreenY;
    
    // Determine direction based on angle
    // We use 8 directions (N, NE, E, SE, S, SW, W, NW) and map to our 4 directions
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Map angle to direction
    if (angle >= -45 && angle < 45) {
      return DIRECTIONS.RIGHT;
    } else if (angle >= 45 && angle < 135) {
      return DIRECTIONS.DOWN;
    } else if (angle >= -135 && angle < -45) {
      return DIRECTIONS.UP;
    } else {
      return DIRECTIONS.LEFT;
    }
  }, [appRef, characterRef]);

  /**
   * Process keyboard input and calculate movement
   */
  const processInput = useCallback(() => {
    // Don't move if locked or not focused
    if (characterState.isLocked || !isFocused.current) {
      return {
        vx: 0,
        vy: 0,
        moving: false,
        direction: lastDirectionRef.current,
        isLocked: characterState.isLocked,
        isSprinting: false
      };
    }
    
    // Check if any direction key is pressed
    const isMoving = keys.current.up || keys.current.down || keys.current.left || keys.current.right;
    
    // If not moving, return zeros but still calculate mouse direction
    if (!isMoving) {
      // If mouse direction is enabled, update direction even when not moving
      if (useMouseDirection.current) {
        lastDirectionRef.current = calculateMouseDirection();
      }
      
      return {
        vx: 0,
        vy: 0,
        moving: false,
        direction: lastDirectionRef.current,
        isLocked: characterState.isLocked,
        isSprinting: false
      };
    }
    
    // Determine sprint state - use the most current speed values
    // This ensures immediate responsiveness to speed control changes
    const isSprinting = keys.current.shift || keys.current.leftShift || keys.current.rightShift;
    
    // Use the latest speed values from props
    // This is critical for ensuring speed decreases are properly respected
    const speed = isSprinting ? sprintSpeed : walkSpeed;
    
    let vx = 0;
    let vy = 0;
    let direction = lastDirectionRef.current;
    
    // Horizontal movement
    if (keys.current.right) {
      vx = speed;
      if (!useMouseDirection.current) direction = DIRECTIONS.RIGHT;
    } else if (keys.current.left) {
      vx = -speed;
      if (!useMouseDirection.current) direction = DIRECTIONS.LEFT;
    }
    
    // Vertical movement
    if (keys.current.up) {
      vy = -speed;
      // Only change direction if no horizontal movement and mouse direction is off
      if (!keys.current.left && !keys.current.right && !useMouseDirection.current) {
        direction = DIRECTIONS.UP;
      }
    } else if (keys.current.down) {
      vy = speed;
      // Only change direction if no horizontal movement and mouse direction is off
      if (!keys.current.left && !keys.current.right && !useMouseDirection.current) {
        direction = DIRECTIONS.DOWN;
      }
    }
    
    // If mouse direction is enabled, override the direction with mouse position
    if (useMouseDirection.current) {
      direction = calculateMouseDirection();
    }
    
    // Normalize diagonal movement
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0 && len > speed) {
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    }
    
    // Update last direction
    lastDirectionRef.current = direction;
    
    return {
      vx,
      vy,
      moving: true,
      direction,
      isLocked: characterState.isLocked,
      isSprinting
    };
  }, [characterState.isLocked, isFocused, lastDirectionRef, sprintSpeed, walkSpeed]);

  /**
   * Simple animation update function
   */
  const updateAnimation = useCallback(({ isMoving, isSprinting, speedFactor, elapsed, delta, fps, framesPerDirection = 8 }) => {
    // Animation logic
    if (isMoving) {
      // Calculate new elapsed time
      const newElapsed = elapsed + delta;
      
      // Use the provided speed factor or default to sprint/walk values
      const animSpeed = speedFactor || (isSprinting ? 1.8 : 1.0);
      
      // Apply the speed factor to the animation fps
      // Simple, direct calculation with no complex formulas
      const effectiveFps = fps * animSpeed;
      
      // Only update frame when enough time has passed
      if (newElapsed >= 60 / effectiveFps) {
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
      // Always use frame 0 for idle state
      lastFrameRef.current = 0;
      return { 
        elapsed: 0,
        frame: 0
      };
    }
  }, []);

  /**
   * Calculate the character's grid position
   */
  const calculateGridPosition = useCallback(() => {
    if (!appRef.current || !gridContainerRef.current || !worldContainerRef.current) {
      return { x: 0, y: 0 };
    }

    // Get the world position
    const worldX = -worldContainerRef.current.position.x;
    const worldY = -worldContainerRef.current.position.y;
    
    // Calculate the center of the screen
    const centerX = appRef.current.screen.width / 2;
    const centerY = appRef.current.screen.height / 2;
    
    // Calculate the position relative to the grid
    const gridX = Math.floor((worldX + centerX) / gridSizeRef.current.width);
    const gridY = Math.floor((worldY + centerY) / gridSizeRef.current.height);
    
    // Calculate position within the cell (0-1 range)
    const cellX = ((worldX + centerX) % gridSizeRef.current.width) / gridSizeRef.current.width;
    const cellY = ((worldY + centerY) % gridSizeRef.current.height) / gridSizeRef.current.height;
    
    // Calculate pixel position
    const pixelX = worldX + centerX;
    const pixelY = worldY + centerY;
    
    return { 
      x: gridX, 
      y: gridY,
      cellX,
      cellY,
      pixelX,
      pixelY
    };
  }, [appRef, gridContainerRef, worldContainerRef]);

  /**
   * Update the world offset based on character movement
   */
  const updateWorldOffset = useCallback((vx, vy, moving, isLocked, calculateOnly = false) => {
    if (!worldContainerRef.current || !worldContainerRef.current.transform) {
      return worldOffsetRef.current;
    }
    
    // If not moving or locked, don't update offset
    if (!moving || isLocked) {
      return worldOffsetRef.current;
    }
    
    // Calculate new offset
    const newOffsetX = worldContainerRef.current.position.x - vx;
    const newOffsetY = worldContainerRef.current.position.y - vy;
    
    // If just calculating, return the potential new offset
    if (calculateOnly) {
      return { x: newOffsetX, y: newOffsetY };
    }
    
    // Update the world offset reference
    worldOffsetRef.current = { x: newOffsetX, y: newOffsetY };
    
    // IMPORTANT: Actually update the world container position
    worldContainerRef.current.position.set(newOffsetX, newOffsetY);
    
    // Force the transform update to ensure the position change takes effect immediately
    worldContainerRef.current.updateTransform();
    
    return worldOffsetRef.current;
  }, [worldContainerRef]);

  /**
   * Teleport the character to a specific grid position
   */
  const teleportToPosition = useCallback((x, y) => {
    if (!appRef.current || !worldContainerRef.current || !gridContainerRef.current) {
      console.error('[Character] Cannot teleport - missing references');
      return false;
    }
    
    console.log(`[Character] Teleporting to grid position (${x}, ${y})`);
    
    // Mark as teleporting to prevent normal movement updates
    isTeleporting.current = true;
    
    // Calculate the world position from grid coordinates
    // Use TILE_SIZE for accurate positioning
    const worldX = -(x * TILE_SIZE) + (appRef.current.screen.width / 2);
    const worldY = -(y * TILE_SIZE) + (appRef.current.screen.height / 2);
    
    // Update the world container position
    worldContainerRef.current.position.set(worldX, worldY);
    
    // Force the transform update to ensure the position change takes effect immediately
    worldContainerRef.current.updateTransform();
    
    // Update the world offset reference
    worldOffsetRef.current = { x: worldX, y: worldY };
    
    // Calculate the full position information
    const position = calculateGridPosition();
    
    // Update the character state with all position data
    const newState = {
      ...characterState,
      x: position.x,
      y: position.y,
      pixelX: position.pixelX,
      pixelY: position.pixelY,
      cellX: position.cellX,
      cellY: position.cellY,
      direction: lastDirectionRef.current,
      isMoving: false,
      isSprinting: false,
      state: CHARACTER_STATES.IDLE
    };
    
    setCharacterState(newState);
    
    // Update the last grid position
    lastGridPosition.current = { x: position.x, y: position.y };
    
    // Notify parent of state change
    if (onStateChange) {
      onStateChange(newState);
    }
    
    // Handle step-on interactions at the new position
    if (typeof handleStepOn === 'function') {
      try {
        setTimeout(() => {
          handleStepOn(position.x, position.y);
        }, 50); // Small delay to ensure position is updated
      } catch (error) {
        console.error('[Character] Error handling step-on interaction after teleport:', error);
      }
    }
    
    // Reset teleporting flag after a short delay
    setTimeout(() => {
      isTeleporting.current = false;
      console.log('[Character] Teleport complete');
    }, 100);
    
    return true;
  }, [appRef, calculateGridPosition, characterState, gridContainerRef, handleStepOn, lastDirectionRef, onStateChange, worldContainerRef]);

  /**
   * Update grid size based on layer dimensions
   */
  const updateGridSize = useCallback((layerDimensions, currentLayer) => {
    if (!layerDimensions || !currentLayer) return;
    
    const layerDim = layerDimensions.find(dim => dim.layer === currentLayer);
    if (layerDim) {
      console.log(`[Character] Updating grid size to ${layerDim.width}x${layerDim.height} for layer ${currentLayer}`);
      
      // Store the previous grid size for comparison
      const prevGridSize = { ...gridSizeRef.current };
      
      // Update the grid size
      gridSizeRef.current = { width: layerDim.width, height: layerDim.height };
      
      // If the grid size has changed and we have a valid character position,
      // we need to recalculate the world offset to maintain the character's position
      if ((prevGridSize.width !== layerDim.width || prevGridSize.height !== layerDim.height) && 
          worldContainerRef.current && characterState.x !== undefined && characterState.y !== undefined) {
        
        // Calculate the new world position based on the current grid coordinates
        if (appRef.current) {
          const worldX = -(characterState.x * gridSizeRef.current.width - appRef.current.screen.width / 2);
          const worldY = -(characterState.y * gridSizeRef.current.height - appRef.current.screen.height / 2);
          
          // Update the world container position
          worldContainerRef.current.position.set(worldX, worldY);
          
          // Update the world offset reference
          worldOffsetRef.current = { x: worldX, y: worldY };
          
          console.log(`[Character] Adjusted world position for new grid size: (${worldX}, ${worldY})`);
        }
      }
    }
  }, [appRef, characterState.x, characterState.y, worldContainerRef]);

  /**
   * Set up keyboard event listeners
   */
  useEffect(() => {
    const keyDownHandler = (e) => {
      // Prevent default for navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'].includes(e.key)) {
        e.preventDefault();
      }
      
      // Ignore key repeats
      if (e.repeat) {
        return;
      }
      
      // Handle lock toggle
      if (e.key === 'Control') {
        setCharacterState(prev => ({
          ...prev,
          isLocked: !prev.isLocked
        }));
        return;
      }
      
      // If locked, ignore movement input
      if (characterState.isLocked) return;
      
      // Update key state
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.current.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = true;
      
      // Handle shift key with more precision
      if (e.key === 'Shift') {
        keys.current.shift = true;
        
        // Track left/right shift separately
        if (e.location === 1) {
          keys.current.leftShift = true;
        } else if (e.location === 2) {
          keys.current.rightShift = true;
        }
      }
      
      // Also detect shift key from the event property
      if (e.shiftKey) {
        keys.current.shift = true;
      }
    };
    
    const keyUpHandler = (e) => {
      // Update key state
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.current.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = false;
      
      // Handle shift key with more precision
      if (e.key === 'Shift') {
        // Track left/right shift separately
        if (e.location === 1) {
          keys.current.leftShift = false;
        } else if (e.location === 2) {
          keys.current.rightShift = false;
        } else {
          // Generic shift key
          keys.current.leftShift = false;
          keys.current.rightShift = false;
        }
        
        // Update the combined shift flag
        keys.current.shift = keys.current.leftShift || keys.current.rightShift;
      }
    };
    
    const blurHandler = () => {
      // Reset all keys when window loses focus
      keys.current = {
        up: false,
        down: false,
        left: false,
        right: false,
        shift: false,
        leftShift: false,
        rightShift: false
      };
    };
    
    // Add event listeners
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    window.addEventListener('blur', blurHandler);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
      window.removeEventListener('blur', blurHandler);
    };
  }, [characterState.isLocked]);

  /**
   * Track mouse position for character direction
   */
  const mousePosition = useRef({ x: 0, y: 0 });
  const useMouseDirection = useRef(true); // Enable mouse direction control by default
  
  /**
   * Handle mouse movement to update character direction
   */
  const handleMouseMove = useCallback((e) => {
    if (!appRef.current || !characterRef.current) return;
    
    // Get the canvas position and dimensions
    const canvas = appRef.current.view;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to the canvas
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Store the mouse position
    mousePosition.current = { x: mouseX, y: mouseY };
  }, [appRef]);
  
  /**
   * Toggle mouse direction control with M key
   */
  const toggleMouseDirection = useCallback((e) => {
    if (e.key === 'm' || e.key === 'M') {
      useMouseDirection.current = !useMouseDirection.current;
      console.log(`Mouse direction control: ${useMouseDirection.current ? 'ON' : 'OFF'}`);
    }
  }, []);
  
  // Set up mouse tracking
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', toggleMouseDirection);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', toggleMouseDirection);
    };
  }, [handleMouseMove, toggleMouseDirection]);

  /**
   * Set up the animation loop
   */
  useEffect(() => {
    if (!appRef.current) return;

    // Animation settings
    let elapsed = 0;
    let animationFrame = 0;
    
    console.log(`[Character] Starting animation loop with ${8} frames per direction and ${animationFps} FPS`);

    animationTicker.current = appRef.current.ticker.add((delta) => {
      try {
        // Skip if not focused or if world container is not available
        if (!isFocused.current || !worldContainerRef.current || !worldContainerRef.current.transform) {
          return;
        }

        // Scale down delta to prevent super-fast movement
        const scaledDelta = Math.min(delta, 1.0) * 0.2; // Cap delta and reduce speed by 80%
        
        // Use fixed base speeds and multiply by the speed settings
        const baseWalkSpeed = 0.3; // Adjusted for better speed
        const baseSprintSpeed = 0.6; // Adjusted for better speed
        
        // Calculate actual speeds with a balanced multiplier
        const actualWalkSpeed = baseWalkSpeed * (walkSpeed / 3.0);
        const actualSprintSpeed = baseSprintSpeed * (sprintSpeed / 3.0);
        
        // Process input to get movement values
        const { vx, vy, moving, direction, isLocked, isSprinting } = processInput();
        
        // Apply a consistent delta scaling
        const scaledVx = vx * scaledDelta;
        const scaledVy = vy * scaledDelta;
        
        // Update character direction if provided
        if (direction) {
          lastDirectionRef.current = direction;
        }

        // Update animation with properly scaled delta
        const { elapsed: newElapsed, frame } = updateAnimation({
          isMoving: moving,
          elapsed,
          delta: scaledDelta,
          fps: animationFps,
          framesPerDirection: 8 // Default to 8 frames per direction
        });
        
        elapsed = newElapsed;
        animationFrame = frame;
        
        // Update character texture
        if (characterRef.current) {
          updateTexture(lastDirectionRef.current, animationFrame);
        }

        // Keep character centered
        if (characterRef.current) {
          characterRef.current.x = appRef.current.screen.width / 2;
          characterRef.current.y = appRef.current.screen.height / 2;
        }

        // Calculate the current grid position
        const currentPosition = calculateGridPosition();
        
        // Calculate the potential new position
        const potentialOffset = updateWorldOffset(
          scaledVx, 
          scaledVy, 
          moving, 
          isLocked,
          true // Just calculate, don't apply
        );
        
        // Store the current world position
        const currentWorldPos = { ...worldContainerRef.current.position };
        
        // Temporarily apply the potential offset to calculate the new grid position
        worldContainerRef.current.position.set(potentialOffset.x, potentialOffset.y);
        const potentialPosition = calculateGridPosition();
        
        // Restore the original position
        worldContainerRef.current.position.set(currentWorldPos.x, currentWorldPos.y);
        
        // Check for collision at the potential position
        let collisionDetected = false;
        
        // Only check for collision if we're actually trying to move and the collision function exists
        if (moving && typeof hasCollision === 'function' && 
            (potentialPosition.x !== currentPosition.x || potentialPosition.y !== currentPosition.y)) {
          
          // Check for collision at the target position
          try {
            collisionDetected = hasCollision(potentialPosition.x, potentialPosition.y);
            
            if (collisionDetected) {
              console.log(`[Character] Blocked movement to (${potentialPosition.x}, ${potentialPosition.y})`);
            }
          } catch (error) {
            console.error('[Character] Error checking for collision:', error);
            collisionDetected = false; // Default to allowing movement if there's an error
          }
        }
        
        // Only update world position if not teleporting, not colliding, and world container is valid
        if (!isTeleporting.current && !collisionDetected && 
            worldContainerRef.current && worldContainerRef.current.transform && moving) {
          
          // Update world position based on scaled movement - this will actually move the character
          const updatedOffset = updateWorldOffset(
            scaledVx,
            scaledVy,
            moving, 
            isLocked
          );
          worldContainerRef.current.position.set(updatedOffset.x, updatedOffset.y);
          
          // Calculate the new grid position after movement
          const newPosition = calculateGridPosition();
          
          // Check if the grid position has changed
          if (newPosition.x !== lastGridPosition.current.x || 
              newPosition.y !== lastGridPosition.current.y) {
            
            // Update the last grid position
            lastGridPosition.current = newPosition;
            
            // Handle step-on interactions at the new position
            if (typeof handleStepOn === 'function') {
              try {
                handleStepOn(newPosition.x, newPosition.y);
              } catch (error) {
                console.error('[Character] Error handling step-on interaction:', error);
              }
            }
            
            // Update the character state with all position data
            const newState = {
              ...characterState,
              x: newPosition.x,
              y: newPosition.y,
              pixelX: newPosition.pixelX,
              pixelY: newPosition.pixelY,
              cellX: newPosition.cellX,
              cellY: newPosition.cellY,
              direction: lastDirectionRef.current,
              isMoving: moving,
              isSprinting,
              state: moving 
                ? (isSprinting ? CHARACTER_STATES.RUNNING : CHARACTER_STATES.WALKING) 
                : CHARACTER_STATES.IDLE
            };
            
            setCharacterState(newState);
            
            // Notify parent of state change
            if (onStateChange) {
              onStateChange(newState);
            }
          }
        }
      } catch (error) {
        console.error('[Character] Error in animation loop:', error);
      }
    });

    // Clean up the animation ticker
    return () => {
      if (animationTicker.current && appRef.current && appRef.current.ticker) {
        appRef.current.ticker.remove(animationTicker.current);
      }
    };
  }, [
    appRef, 
    animationFps, 
    calculateGridPosition, 
    characterState, 
    hasCollision, 
    handleStepOn,
    isFocused, 
    onStateChange, 
    processInput, 
    sprintSpeed, 
    updateAnimation, 
    updateTexture, 
    updateWorldOffset, 
    walkSpeed, 
    worldContainerRef
  ]);

  return {
    // Character state
    characterState,
    
    // Character references
    characterRef,
    lastDirectionRef,
    
    // Character functions
    loadCharacter,
    cleanupCharacter,
    updateTexture,
    teleportToPosition,
    updateGridSize,
    
    // Animation
    animationTicker,
    
    // Teleport state
    isTeleporting
  };
};

export default useCharacterController;
