// components/PixiMovementDemo.jsx
import React, { useRef, useEffect } from "react";
import * as PIXI from "pixi.js";

const PixiMovementDemo = () => {
  const pixiContainer = useRef(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: 512,
      height: 512,
      backgroundColor: 0x1e1e1e,
    });

    pixiContainer.current.appendChild(app.view);

    // Load sprite or placeholder
    const player = PIXI.Sprite.from("https://i.imgur.com/IaUrttj.png"); // Placeholder sprite
    player.anchor.set(0.5);
    player.x = app.screen.width / 2;
    player.y = app.screen.height / 2;

    app.stage.addChild(player);

    const keys = {};

    // Movement speed
    const speed = 5;

    // Keyboard events
    const handleKeyDown = (e) => {
      keys[e.code] = true;
    };

    const handleKeyUp = (e) => {
      keys[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    app.ticker.add(() => {
      if (keys["KeyW"]) player.y -= speed;
      if (keys["KeyS"]) player.y += speed;
      if (keys["KeyA"]) player.x -= speed;
      if (keys["KeyD"]) player.x += speed;
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      app.destroy(true, true);
    };
  }, []);

  return <div ref={pixiContainer} />;
};

export default PixiMovementDemo;
