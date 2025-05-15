import React, { useEffect, useRef } from 'react';
import { Application, Texture, Sprite, Rectangle, Assets, SCALE_MODES, Graphics, Container } from 'pixi.js';

// Match the tile size used in the Map editor
const TILE_SIZE = 64;

const PixiCanvas = ({ walkSpeed = 3, sprintSpeed = 6, onStateChange, skinId, onWorldContainerReady, currentLayer, layerDimensions }) => {
  // References to track the current layer dimensions and grid container
  const gridSizeRef = useRef({ width: 20, height: 20 });
  const gridContainerRef = useRef(null);
  
  // Update grid size when layer dimensions change
  useEffect(() => {
    if (currentLayer && layerDimensions && layerDimensions.length > 0) {
      const currentLayerDim = layerDimensions.find(dim => dim.layer === currentLayer);
      if (currentLayerDim) {
        gridSizeRef.current = {
          width: currentLayerDim.width || 20,
          height: currentLayerDim.height || 20
        };
        console.log(`[Movement] Updated grid size for layer ${currentLayer}: ${gridSizeRef.current.width}x${gridSizeRef.current.height}`);
      }
    }
  }, [currentLayer, layerDimensions]);
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const animationTicker = useRef(null);
  const worldContainerRef = useRef(null);

  const keysState = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    Shift: false,
    Control: false,
  });

  const isShiftPressed = useRef(false);
  const isLocked = useRef(false);
  const lastDirection = useRef('right');
  const lastFrame = useRef(0);
  const isFocused = useRef(true);
  const worldOffset = useRef({ x: 0, y: 0 });

  // Track if we've already initialized the canvas
  const canvasInitializedRef = useRef(false);
  
  useEffect(() => {
    // Prevent multiple initializations
    if (canvasInitializedRef.current) return;
    canvasInitializedRef.current = true;
    
    const run = async () => {
      const app = new Application({
        backgroundColor: 0x222222,
        powerPreference: 'high-performance',
        resizeTo: window,
      });
      appRef.current = app;

      if (pixiContainer.current) {
        pixiContainer.current.innerHTML = '';
        pixiContainer.current.appendChild(app.view);
      }

      try {
        // Use the correct character endpoint
        console.log(`[Movement] Fetching character skin: ${skinId}`);
        
        // First check if skinId is provided
        if (!skinId) {
          console.error(`[Movement] No skin ID provided, using default character-1`);
          skinId = 'character-1';
        }
        
        const spriteInfoResponse = await fetch(`https://api.metafarmers.io/character/${skinId}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'metafarmers-default-key'
          }
        });
        const spriteInfo = await spriteInfoResponse.json();
        console.log(`[Movement] Character data:`, spriteInfo);
      
        // Check if spriteInfo has the required data
        if (!spriteInfo || !spriteInfo.spriteSheet) {
          console.error(`[Movement] Invalid character data for ${skinId}:`, spriteInfo);
          throw new Error(`Invalid character data for ${skinId}`);
        }
      
      const spriteSheetUrl = spriteInfo.spriteSheet.url;
      const frameWidth = spriteInfo.spriteSheet.frameSize.width;
      const frameHeight = spriteInfo.spriteSheet.frameSize.height;
      const framesPerDirection = spriteInfo.spriteSheet.framesPerDirection;
      const directionMap = spriteInfo.spriteSheet.directionMap;
      const scale = spriteInfo.render?.scale || 2;

        const characterTexture = await Assets.load(spriteSheetUrl);
      characterTexture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      const baseTexture = characterTexture.baseTexture;

      const frames = {};
      for (const [direction, row] of Object.entries(directionMap)) {
        frames[direction] = [];
        for (let i = 0; i < framesPerDirection; i++) {
          const rect = new Rectangle(i * frameWidth, row * frameHeight, frameWidth, frameHeight);
          frames[direction].push(new Texture(baseTexture, rect));
        }
      }

      // Create world container for map elements
      const worldContainer = new Container();
      worldContainerRef.current = worldContainer;
      app.stage.addChild(worldContainer);

      // We'll use the grid from the map layer instead of creating a duplicate grid here
      console.log(`[Movement] Using grid size: ${gridSizeRef.current.width}x${gridSizeRef.current.height} tiles`);
      
      // Function to find the grid container in the world container
      const findGridContainer = () => {
        if (worldContainer && worldContainer.children) {
          for (let i = 0; i < worldContainer.children.length; i++) {
            const child = worldContainer.children[i];
            if (child.name === 'gridContainer') {
              gridContainerRef.current = child;
              console.log('[Movement] Found grid container in world container');
              return child;
            }
          }
        }
        return null;
      };
      
      // Notify parent that the world container is ready
      if (onWorldContainerReady) {
        console.log(`[Movement] Calling onWorldContainerReady callback`);
        onWorldContainerReady(worldContainer);
      }

      const sprite = new Sprite(frames.right[0]);
      sprite.anchor.set(spriteInfo.render.anchor?.x ?? 0.5, spriteInfo.render.anchor?.y ?? 0.5);
      sprite.scale.set(scale);
      
      // Position character at a specific grid cell (default to center of the grid)
      const startGridX = Math.floor(gridSizeRef.current.width / 2); // Start at the center
      const startGridY = Math.floor(gridSizeRef.current.height / 2); // Start at the center
      
      // Find the grid container to align with it
      const gridContainer = findGridContainer();
      
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
      worldOffset.current = {
        // Position character exactly at the center of the specified grid cell
        // Account for grid container position
        x: -((startGridX * TILE_SIZE) - app.screen.width / 2 + TILE_SIZE / 2) - gridOffsetX,
        y: -((startGridY * TILE_SIZE) - app.screen.height / 2 + TILE_SIZE / 2) - gridOffsetY
      };
      
      console.log(`[Movement] Initial world offset: (${worldOffset.current.x}, ${worldOffset.current.y})`);
      console.log(`[Movement] Character starting at grid cell: (${startGridX}, ${startGridY})`);
      console.log(`[Movement] Grid offset: (${gridOffsetX}, ${gridOffsetY})`);
      console.log(`[Movement] Grid dimensions: ${gridWidth}x${gridHeight}px (${gridSizeRef.current.width}x${gridSizeRef.current.height} tiles)`);
      
      // Position the character in the center of the screen
      sprite.x = app.screen.width / 2;
      sprite.y = app.screen.height / 2;
      app.stage.addChild(sprite);

      // Set the initial world container position
      worldContainer.position.set(worldOffset.current.x, worldOffset.current.y);
      
      const fps = 10;
      let elapsed = 0;

      animationTicker.current = app.ticker.add((delta) => {
        if (!isFocused.current) return;

        const keys = keysState.current;
        const shift = isShiftPressed.current;
        const speed = shift ? sprintSpeed : walkSpeed;

        let vx = 0;
        let vy = 0;
        let moving = false;

        if (!isLocked.current) {
          if (keys['ArrowRight'] || keys['d']) {
            vx = speed;
            lastDirection.current = 'right';
            moving = true;
          } else if (keys['ArrowLeft'] || keys['a']) {
            vx = -speed;
            lastDirection.current = 'left';
            moving = true;
          }

          if (keys['ArrowUp'] || keys['w']) {
            vy = -speed;
            lastDirection.current = 'up';
            moving = true;
          } else if (keys['ArrowDown'] || keys['s']) {
            vy = speed;
            lastDirection.current = 'down';
            moving = true;
          }

          const len = Math.sqrt(vx * vx + vy * vy);
          if (len > speed) {
            vx = (vx / len) * speed;
            vy = (vy / len) * speed;
          }
        }

        if (moving && !isLocked.current) {
          elapsed += delta;
          if (elapsed >= 60 / fps) {
            elapsed = 0;
            lastFrame.current = (lastFrame.current + 1) % framesPerDirection;
          }
        } else {
          lastFrame.current = 0;
        }

        sprite.texture = frames[lastDirection.current][lastFrame.current];

        sprite.x = app.screen.width / 2;
        sprite.y = app.screen.height / 2;

        if (moving && !isLocked.current) {
          // Calculate new potential position
          const newOffsetX = worldOffset.current.x - vx;
          const newOffsetY = worldOffset.current.y - vy;
          
          // Get grid dimensions
          const gridWidth = gridSizeRef.current.width * TILE_SIZE;
          const gridHeight = gridSizeRef.current.height * TILE_SIZE;
          
          // Find the grid container if we haven't already
          if (!gridContainerRef.current) {
            findGridContainer();
          }
          
          // Get grid container position
          let gridOffsetX = -(gridWidth / 2); // Default grid position (centered)
          let gridOffsetY = -(gridHeight / 2);
          
          // If we found the grid container, use its actual position
          if (gridContainerRef.current) {
            gridOffsetX = gridContainerRef.current.x;
            gridOffsetY = gridContainerRef.current.y;
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
          
          // Only update position if within bounds
          if (isWithinBoundsX) worldOffset.current.x = newOffsetX;
          if (isWithinBoundsY) worldOffset.current.y = newOffsetY;
          
          // Update world container position
          worldContainer.position.set(worldOffset.current.x, worldOffset.current.y);
        }

        if (onStateChange) {
          // Get grid dimensions
          const gridWidth = gridSizeRef.current.width * TILE_SIZE;
          const gridHeight = gridSizeRef.current.height * TILE_SIZE;
          
          // Find the grid container if we haven't already
          if (!gridContainerRef.current) {
            findGridContainer();
          }
          
          // Get grid container position
          let gridOffsetX = -(gridWidth / 2); // Default grid position (centered)
          let gridOffsetY = -(gridHeight / 2);
          
          // If we found the grid container, use its actual position
          if (gridContainerRef.current) {
            gridOffsetX = gridContainerRef.current.x;
            gridOffsetY = gridContainerRef.current.y;
          }
          
          // Calculate the position relative to the grid's top-left corner
          // Adjust for the grid container's actual position
          const relativeX = app.screen.width / 2 - worldOffset.current.x - gridOffsetX;
          const relativeY = app.screen.height / 2 - worldOffset.current.y - gridOffsetY;
          
          // Calculate grid cell coordinates (integer values)
          const gridX = Math.floor(relativeX / TILE_SIZE);
          const gridY = Math.floor(relativeY / TILE_SIZE);
          
          // Calculate precise position within the grid cell (0-1 range)
          const cellX = (relativeX % TILE_SIZE) / TILE_SIZE;
          const cellY = (relativeY % TILE_SIZE) / TILE_SIZE;
          
          onStateChange({
            x: gridX,                // Grid cell X (integer)
            y: gridY,                // Grid cell Y (integer)
            pixelX: Math.round(relativeX),  // Pixel position relative to grid
            pixelY: Math.round(relativeY),  // Pixel position relative to grid
            cellX: cellX,            // Position within cell (0-1)
            cellY: cellY,            // Position within cell (0-1)
            direction: lastDirection.current,
            isMoving: moving && !isLocked.current,
            isSprinting: shift,
            isLocked: isLocked.current,
          });
        }
      });



      } catch (error) {
        console.error(`[Movement] Error initializing canvas:`, error);
        canvasInitializedRef.current = false; // Allow retry on error
      }
      
      // Store event handler references so we can properly clean up
      const handleKeyDown = (e) => {
        keysState.current[e.key] = true;
        if (e.key === 'Shift') isShiftPressed.current = true;
        if (e.key === 'Control') {
          isLocked.current = !isLocked.current;
          if (isLocked.current) lastFrame.current = 0;
        }
      };

      const handleKeyUp = (e) => {
        keysState.current[e.key] = false;
        if (e.key === 'Shift') {
          isShiftPressed.current = false;
          const anyDirectionPressed = Object.keys(keysState.current).some(
            (key) =>
              key !== 'Shift' &&
              keysState.current[key] &&
              ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(key)
          );
          if (!anyDirectionPressed && !isLocked.current) {
            lastFrame.current = 0;
          }
        }
      };

      const handleFocusIn = () => (isFocused.current = true);
      const handleFocusOut = () => (isFocused.current = false);
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('focusin', handleFocusIn);
      window.addEventListener('focusout', handleFocusOut);
      
      return () => {
        if (appRef.current) {
          appRef.current.destroy(true, { children: true });
        }
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('focusin', handleFocusIn);
        window.removeEventListener('focusout', handleFocusOut);
        if (animationTicker.current) {
          animationTicker.current.destroy();
          animationTicker.current = null;
        }
        canvasInitializedRef.current = false;
      };
    };

    run().catch((error) => {
      console.error(`[Movement] Error in canvas initialization:`, error);
      canvasInitializedRef.current = false; // Allow retry on error
    });
  }, [walkSpeed, sprintSpeed, onStateChange, skinId, onWorldContainerReady]);

  return <div ref={pixiContainer} style={{ width: '100vw', height: '100vh' }} />;
};

export default PixiCanvas;