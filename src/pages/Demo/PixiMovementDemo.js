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
    Control: false,
  });

  const isShiftPressed = useRef(false);
  const isLocked = useRef(false);
  const lastDirection = useRef("right");
  const lastFrame = useRef(0);
  const isFocused = useRef(true);
  const worldOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const run = async () => {
      const app = new Application({
        backgroundColor: 0x222222,
        powerPreference: "high-performance",
        resizeTo: pixiContainer.current,
      });

      appRef.current = app;

      if (pixiContainer.current) {
        pixiContainer.current.innerHTML = "";
        pixiContainer.current.appendChild(app.view);
      }

      // Step 1: Fetch character list
      const listRes = await fetch("https://api.metafarmers.io/list/characters");
      const { skins } = await listRes.json();
      const firstCharacterId = skins[0];

      // Step 2: Fetch character data
      const detailRes = await fetch(`https://api.metafarmers.io/character/${firstCharacterId}`);
      const characterData = await detailRes.json();
      const {
        spriteSheet: {
          url,
          frameSize,
          framesPerDirection,
          directionMap,
        },
        render: {
          scale,
          anchor,
        },
      } = characterData;

      // Step 3: Load texture with CORS handling
      Assets.add({
        alias: "characterTexture",
        src: url,
        data: { crossOrigin: "anonymous" },
      });

      const characterTexture = await Assets.load("characterTexture");
      characterTexture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      const baseTexture = characterTexture.baseTexture;

      // Step 4: Build animation frames
      const frames = {};
      const directions = Object.keys(directionMap);

      for (const direction of directions) {
        const row = directionMap[direction];
        frames[direction] = [];

        for (let i = 0; i < framesPerDirection; i++) {
          const rect = new Rectangle(
            i * frameSize.width,
            row * frameSize.height,
            frameSize.width,
            frameSize.height
          );
          frames[direction].push(new Texture(baseTexture, rect));
        }
      }

      // Create world container
      const worldContainer = new Container();
      app.stage.addChild(worldContainer);

      const tileSize = 64;
      const gridSize = 2000;
      const halfGridSize = gridSize / 2;
      const gridGraphics = new Graphics();
      gridGraphics.lineStyle(1, 0x444444, 1);

      for (let x = -halfGridSize; x <= halfGridSize; x += tileSize) {
        gridGraphics.moveTo(x, -halfGridSize);
        gridGraphics.lineTo(x, halfGridSize);
      }

      for (let y = -halfGridSize; y <= halfGridSize; y += tileSize) {
        gridGraphics.moveTo(-halfGridSize, y);
        gridGraphics.lineTo(halfGridSize, y);
      }

      worldContainer.addChild(gridGraphics);

      // Create character sprite
      const sprite = new Sprite(frames.right[0]);
      sprite.anchor.set(anchor.x, anchor.y);
      sprite.scale.set(scale);
      sprite.x = app.screen.width / 2;
      sprite.y = app.screen.height / 2;
      app.stage.addChild(sprite);

      worldContainer.position.set(-app.screen.width / 2, -app.screen.height / 2);

      // Animation ticker
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

      // Input handling
      const handleKeyDown = (e) => {
        keysState.current[e.key] = true;
        if (e.key === "Shift") isShiftPressed.current = true;
        if (e.key === "Control") {
          isLocked.current = !isLocked.current;
          if (isLocked.current) lastFrame.current = 0;
        }
      };

      const handleKeyUp = (e) => {
        keysState.current[e.key] = false;
        if (e.key === "Shift") {
          isShiftPressed.current = false;
          const anyDirectionPressed = Object.keys(keysState.current).some(
            (key) =>
              key !== "Shift" &&
              keysState.current[key] &&
              ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(key)
          );
          if (!anyDirectionPressed && !isLocked.current) {
            lastFrame.current = 0;
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
