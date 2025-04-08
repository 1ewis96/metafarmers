import React, { useEffect, useRef } from "react";
import {
  Application,
  Texture,
  Sprite,
  Rectangle,
  Assets,
  SCALE_MODES
} from "pixi.js";

const PixiMovementDemo = () => {
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
  }); // Tracks the state of keys
  const isShiftPressed = useRef(false); // Track if shift is pressed
  const spriteRef = useRef(null); // To reference the sprite
  const lastDirection = useRef(null); // Track last movement direction
  const lastFrame = useRef(0); // Track the last frame in movement
  const isFocused = useRef(true); // Track whether the canvas is focused

  useEffect(() => {
    const run = async () => {
      const app = new Application({
        width: 512,
        height: 512,
        backgroundColor: 0x222222,
        powerPreference: "high-performance",
      });

      appRef.current = app;

      if (pixiContainer.current) {
        pixiContainer.current.appendChild(app.view);
      }

      // Load the new texture
      const characterTexture = await Assets.load("/assets/character-1.png");

      // Fix the texture filtering to improve scaling sharpness
      characterTexture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      const baseTexture = characterTexture.baseTexture;

      // Define frame size and number of frames per row
      const frameWidth = 32;
      const frameHeight = 32;
      const numFrames = 8; // 8 frames per row

      // Create walking frames for all 4 directions (up, right, left, down)
      const directions = ['up', 'right', 'left', 'down'];
      const frames = {
        up: [],
        right: [],
        left: [],
        down: []
      };

      // Extract frames for each direction from the sprite sheet
      for (let row = 0; row < 4; row++) {
        for (let i = 0; i < numFrames; i++) {
          const rect = new Rectangle(i * frameWidth, row * frameHeight, frameWidth, frameHeight);
          const direction = directions[row];
          frames[direction].push(new Texture(baseTexture, rect));
        }
      }

      // Default sprite (starting with the "right" direction)
      const sprite = new Sprite(frames.right[0]);
      sprite.anchor.set(0.5);
      sprite.x = app.screen.width / 2;
      sprite.y = app.screen.height / 2;
      sprite.scale.set(2); // Uniform scale for visibility

      app.stage.addChild(sprite);

      // Reference the sprite for later use (mouse control)
      spriteRef.current = sprite;

      const baseSpeed = 2; // Normal speed
      const sprintSpeed = 4; // Sprinting speed
      let speed = baseSpeed; // Current speed, defaults to normal speed
      let vx = 0;
      let vy = 0;

      let currentFrame = 0;
      const fps = 10;
      let elapsed = 0;

      // Ticker loop for movement
      animationTicker.current = app.ticker.add((delta) => {
        if (!isFocused.current) {
          // If the canvas is not focused, stop all movement
          vx = vy = 0;
        }

        // Horizontal movement logic (left or right)
        if (keysState.current["ArrowRight"] || keysState.current["d"]) {
          vx = speed;
          lastDirection.current = "right"; // Update last direction
          sprite.texture = frames.right[lastFrame.current % numFrames];
        } else if (keysState.current["ArrowLeft"] || keysState.current["a"]) {
          vx = -speed;
          lastDirection.current = "left"; // Update last direction
          sprite.texture = frames.left[lastFrame.current % numFrames];  // Ensure left uses the third row
        } else {
          vx = 0; // Stop horizontal movement if no key is pressed
        }

        // Vertical movement logic (up or down)
        if (keysState.current["ArrowUp"] || keysState.current["w"]) {
          vy = -speed;
          lastDirection.current = "up"; // Update last direction
          sprite.texture = frames.up[lastFrame.current % numFrames];
        } else if (keysState.current["ArrowDown"] || keysState.current["s"]) {
          vy = speed;
          lastDirection.current = "down"; // Update last direction
          sprite.texture = frames.down[lastFrame.current % numFrames];
        } else {
          vy = 0; // Stop vertical movement if no key is pressed
        }

        // Adjust speed for sprinting based on the Shift key state
        if (isShiftPressed.current) {
          speed = sprintSpeed;
        } else {
          speed = baseSpeed;
        }

        // Normalize diagonal movement to prevent faster movement diagonally
        const length = Math.sqrt(vx * vx + vy * vy);
        if (length > speed) {
          vx = (vx / length) * speed;
          vy = (vy / length) * speed;
        }

        // Update frame for animation if moving
        const isMoving = vx !== 0 || vy !== 0;

        if (isMoving) {
          elapsed += delta;
          if (elapsed >= 60 / fps) {
            elapsed = 0;
            lastFrame.current = (lastFrame.current + 1) % numFrames;
          }
        } else {
          // When idle, use the last frame from the last direction
          if (lastDirection.current) {
            sprite.texture = frames[lastDirection.current][lastFrame.current % numFrames];
          }
        }

        sprite.x += vx;
        sprite.y += vy;

        // Rotate the sprite to face the mouse cursor
        const onMouseMove = (event) => {
          const dx = event.data.global.x - sprite.x;
          const dy = event.data.global.y - sprite.y;
          const angle = Math.atan2(dy, dx); // Calculate the angle to the cursor
          sprite.rotation = angle; // Rotate the sprite to face the cursor
        };

        // Listen to mousemove event
        app.stage.on("mousemove", onMouseMove);
      });

      // Key listeners for movement
      const handleKeyDown = (e) => {
        keysState.current[e.key] = true; // Mark key as pressed

        // Track Shift key specifically
        if (e.key === "Shift") {
          isShiftPressed.current = true; // Set sprint speed when Shift is pressed
        }
      };

      const handleKeyUp = (e) => {
        keysState.current[e.key] = false; // Mark key as released

        // Reset Shift speed when Shift key is released
        if (e.key === "Shift") {
          isShiftPressed.current = false; // Reset speed to baseSpeed
        }
      };

      // Focus handling to stop movement when the canvas is not focused
      const handleFocusIn = () => {
        isFocused.current = true;
      };

      const handleFocusOut = () => {
        isFocused.current = false;
        // Stop movement when focus is lost
        vx = vy = 0;
      };

      // Adding event listeners
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("focusin", handleFocusIn);
      window.addEventListener("focusout", handleFocusOut);

      // Cleanup on component unmount
      return () => {
        app.destroy(true, { children: true });
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("focusin", handleFocusIn);
        window.removeEventListener("focusout", handleFocusOut);
        if (animationTicker.current) {
          animationTicker.current.destroy();
        }
      };
    };

    run().catch(console.error);
  }, []);

  return <div ref={pixiContainer} />;
};

export default PixiMovementDemo;
