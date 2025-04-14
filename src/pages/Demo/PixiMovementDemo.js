import React, { useEffect, useRef } from "react";
import {
  Application,
  Texture,
  Sprite,
  Rectangle,
  Assets,
  SCALE_MODES,
  Graphics,
  Container,
} from "pixi.js";

const PixiMovementDemo = ({ walkSpeed, sprintSpeed, onStateChange }) => {
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const animationTicker = useRef(null);

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
    Control: false, // Add Control key state
  });
  const isShiftPressed = useRef(false);
  const isLocked = useRef(false); // New ref to track lock state
  const lastDirection = useRef("right");
  const lastFrame = useRef(0);
  const isFocused = useRef(true);
  const worldOffset = useRef({ x: 0, y: 0 }); // Track world movement

  useEffect(() => {
    const run = async () => {
      // Create PIXI app with dynamic size
      const app = new Application({
        backgroundColor: 0x222222,
        powerPreference: "high-performance",
        resizeTo: pixiContainer.current, // Automatically resize to container
      });
      appRef.current = app;

      // Add canvas to DOM
      if (pixiContainer.current) {
        pixiContainer.current.innerHTML = "";
        pixiContainer.current.appendChild(app.view);
      }

      // Load character sprite sheet
      const characterTexture = await Assets.load("/assets/character-1.png");
      characterTexture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      const baseTexture = characterTexture.baseTexture;

      // Prepare animation frames
      const frameWidth = 32;
      const frameHeight = 32;
      const numFrames = 8;
      const directions = ["up", "right", "left", "down"];
      const frames = { up: [], right: [], left: [], down: [] };

      for (let row = 0; row < 4; row++) {
        for (let i = 0; i < numFrames; i++) {
          const rect = new Rectangle(i * frameWidth, row * frameHeight, frameWidth, frameHeight);
          frames[directions[row]].push(new Texture(baseTexture, rect));
        }
      }

      // Create a container for the world (grid)
      const worldContainer = new Container();
      app.stage.addChild(worldContainer); // Add world container first

      // Draw fixed 2000x2000 grid
      const tileSize = 64;
      const gridSize = 2000;
      const halfGridSize = gridSize / 2;
      const gridGraphics = new Graphics();
      gridGraphics.lineStyle(1, 0x444444, 1);

      // Draw vertical lines
      for (let x = -halfGridSize; x <= halfGridSize; x += tileSize) {
        gridGraphics.moveTo(x, -halfGridSize);
        gridGraphics.lineTo(x, halfGridSize);
      }

      // Draw horizontal lines
      for (let y = -halfGridSize; y <= halfGridSize; y += tileSize) {
        gridGraphics.moveTo(-halfGridSize, y);
        gridGraphics.lineTo(halfGridSize, y);
      }

      worldContainer.addChild(gridGraphics);

      // Create player sprite
      const sprite = new Sprite(frames.right[0]);
      sprite.anchor.set(0.5);
      sprite.scale.set(2);
      sprite.x = app.screen.width / 2;
      sprite.y = app.screen.height / 2;
      app.stage.addChild(sprite); // Add player sprite after world container

      // Center the grid under the player at start
      worldContainer.position.set(-app.screen.width / 2, -app.screen.height / 2);

      // Animation control
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

        // Only allow movement if not locked
        if (!isLocked.current) {
          // Check for any active movement keys
          if (keys["ArrowRight"] || keys["d"]) {
            vx = speed;
            lastDirection.current = "right";
            moving = true;
          } else if (keys["ArrowLeft"] || keys["a"]) {
            vx = -speed;
            lastDirection.current = "left";
            moving = true;
          }

          if (keys["ArrowUp"] || keys["w"]) {
            vy = -speed;
            lastDirection.current = "up";
            moving = true;
          } else if (keys["ArrowDown"] || keys["s"]) {
            vy = speed;
            lastDirection.current = "down";
            moving = true;
          }

          // Normalize diagonal movement
          const len = Math.sqrt(vx * vx + vy * vy);
          if (len > speed) {
            vx = (vx / len) * speed;
            vy = (vy / len) * speed;
          }
        }

        // Only animate if moving and not locked
        if (moving && !isLocked.current) {
          elapsed += delta;
          if (elapsed >= 60 / fps) {
            elapsed = 0;
            lastFrame.current = (lastFrame.current + 1) % numFrames;
          }
        } else {
          // Reset to first frame when not moving or locked
          lastFrame.current = 0;
        }

        sprite.texture = frames[lastDirection.current][lastFrame.current];

        // Lock player to center
        sprite.x = app.screen.width / 2;
        sprite.y = app.screen.height / 2;

        // Move the world container (grid) only if moving and not locked
        if (moving && !isLocked.current) {
          worldOffset.current.x -= vx;
          worldOffset.current.y -= vy;
          worldContainer.position.set(worldOffset.current.x, worldOffset.current.y);
        }

        // Report player state (world coordinates)
        if (onStateChange) {
          onStateChange({
            x: Math.round(-worldOffset.current.x + app.screen.width / 2), // Adjust for initial offset
            y: Math.round(-worldOffset.current.y + app.screen.height / 2), // Adjust for initial offset
            direction: lastDirection.current,
            isMoving: moving && !isLocked.current,
            isSprinting: shift,
            isLocked: isLocked.current, // Add locked state to callback
          });
        }
      });

      // Input handling
      const handleKeyDown = (e) => {
        keysState.current[e.key] = true;
        if (e.key === "Shift") isShiftPressed.current = true;
        if (e.key === "Control") {
          isLocked.current = !isLocked.current; // Toggle lock state
          if (isLocked.current) {
            // Reset movement when locking
            lastFrame.current = 0;
          }
        }
      };

      const handleKeyUp = (e) => {
        keysState.current[e.key] = false;
        if (e.key === "Shift") {
          isShiftPressed.current = false;
          // Check if no direction keys are pressed after releasing Shift
          const anyDirectionPressed = Object.keys(keysState.current).some(key =>
            key !== "Shift" && keysState.current[key] && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(key)
          );
          if (!anyDirectionPressed && !isLocked.current) {
            // Reset movement
            lastFrame.current = 0; // Reset to idle frame
          }
        }
      };

      const handleFocusIn = () => (isFocused.current = true);
      const handleFocusOut = () => (isFocused.current = false);

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("focusin", handleFocusIn);
      window.addEventListener("focusout", handleFocusOut);

      return () => {
        app.destroy(true, { children: true });
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("focusin", handleFocusIn);
        window.removeEventListener("focusout", handleFocusOut);
        animationTicker.current?.destroy();
      };
    };

    run().catch(console.error);
  }, [walkSpeed, sprintSpeed, onStateChange]);

  return <div ref={pixiContainer} style={{ height: "100%", width: "100%" }} />;
};

export default PixiMovementDemo;