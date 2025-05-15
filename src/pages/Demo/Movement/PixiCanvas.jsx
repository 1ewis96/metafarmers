import React, { useEffect, useRef } from 'react';
import { Application, Texture, Sprite, Rectangle, Assets, SCALE_MODES, Graphics, Container } from 'pixi.js';

// Match the tile size used in the Map editor
const TILE_SIZE = 64;

const PixiCanvas = ({ walkSpeed, sprintSpeed, onStateChange, skinId, onWorldContainerReady }) => {
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

      // Create a grid that matches the Map editor's grid
      const gridSize = 20; // Default grid size in tiles (20x20)
      const gridGraphics = new Graphics();
      gridGraphics.name = 'grid';
      
      // Draw the background (white rectangle)
      gridGraphics.beginFill(0xf0f0f0);
      gridGraphics.drawRect(0, 0, gridSize * TILE_SIZE, gridSize * TILE_SIZE);
      gridGraphics.endFill();
      
      // Draw the grid lines
      gridGraphics.lineStyle(1, 0x444444, 1);
      
      // Vertical lines
      for (let i = 0; i <= gridSize; i++) {
        gridGraphics.moveTo(i * TILE_SIZE, 0);
        gridGraphics.lineTo(i * TILE_SIZE, gridSize * TILE_SIZE);
      }
      
      // Horizontal lines
      for (let i = 0; i <= gridSize; i++) {
        gridGraphics.moveTo(0, i * TILE_SIZE);
        gridGraphics.lineTo(gridSize * TILE_SIZE, i * TILE_SIZE);
      }
      
      // Center the grid in the world container
      gridGraphics.x = -(gridSize * TILE_SIZE) / 2;
      gridGraphics.y = -(gridSize * TILE_SIZE) / 2;
      
      // Add the grid at the bottom of the container (z-index 0)
      worldContainer.addChildAt(gridGraphics, 0);
      
      console.log(`[Movement] Grid drawn: ${gridSize}x${gridSize} tiles (${gridSize * TILE_SIZE}x${gridSize * TILE_SIZE}px)`);
      
      // Notify parent that the world container is ready
      if (onWorldContainerReady) {
        console.log(`[Movement] Calling onWorldContainerReady callback`);
        onWorldContainerReady(worldContainer);
      }

      const sprite = new Sprite(frames.right[0]);
      sprite.anchor.set(spriteInfo.render.anchor?.x ?? 0.5, spriteInfo.render.anchor?.y ?? 0.5);
      sprite.scale.set(scale);
      
      // Position character in the top right of the grid
      // Calculate the top-right corner of the grid
      const gridTopRightX = (gridSize * TILE_SIZE) - TILE_SIZE;
      const gridTopRightY = 0;
      
      // Position the character at the top right of the grid
      // We need to account for the grid being centered in the world container
      sprite.x = app.screen.width / 2 + gridTopRightX - (gridSize * TILE_SIZE) / 2;
      sprite.y = app.screen.height / 2 + gridTopRightY - (gridSize * TILE_SIZE) / 2;
      app.stage.addChild(sprite);

      worldContainer.position.set(-app.screen.width / 2, -app.screen.height / 2);
      
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
          worldOffset.current.x -= vx;
          worldOffset.current.y -= vy;
          worldContainer.position.set(worldOffset.current.x, worldOffset.current.y);
        }

        if (onStateChange) {
          onStateChange({
            x: Math.round(-worldOffset.current.x + app.screen.width / 2),
            y: Math.round(-worldOffset.current.y + app.screen.height / 2),
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