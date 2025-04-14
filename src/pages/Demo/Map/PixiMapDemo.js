import React, { useEffect, useRef } from "react";
import { Application, Container as PixiContainer, Graphics } from "pixi.js";
import { drawHazardTape, handleDrag } from "./utils/gridUtils";

const PixiMapDemo = ({
  isBuildMode,
  setIsBuildMode,
  highlightedCell,
  objects,
  currentLevel,
  onCellClick,
  onCellRightClick,
}) => {
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const gridContainerRef = useRef(null);
  const [worldOffset, setWorldOffset] = React.useState({ x: 0, y: 0 });
  const tileSize = 64;
  const gridSize = 30; // Adjusted for visibility
  const gridPixelSize = gridSize * tileSize;
  const halfGridSize = gridPixelSize / 2;

  useEffect(() => {
    const run = async () => {
      console.log("PixiMapDemo running, objects:", objects);

      const app = new Application({
        backgroundColor: 0x222222,
        resizeTo: pixiContainer.current,
      });
      appRef.current = app;

      if (pixiContainer.current) {
        pixiContainer.current.innerHTML = "";
        pixiContainer.current.appendChild(app.view);
      } else {
        console.error("pixiContainer ref is null");
      }

      const gridContainer = new PixiContainer();
      app.stage.addChild(gridContainer);
      gridContainerRef.current = gridContainer;

      // Draw grid with filled cells
      const gridGraphics = new Graphics();
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          gridGraphics.beginFill(
            objects.find(o => o.position.x === x && o.position.y === y && o.type === "wall")
              ? 0x666666
              : 0xf0f0f0
          );
          gridGraphics.drawRect(x * tileSize, y * tileSize, tileSize, tileSize);
          gridGraphics.endFill();
        }
      }

      // Draw grid lines
      gridGraphics.lineStyle(1, 0x444444, 1);
      for (let x = 0; x <= gridSize; x++) {
        gridGraphics.moveTo(x * tileSize, 0);
        gridGraphics.lineTo(x * tileSize, gridPixelSize);
      }
      for (let y = 0; y <= gridSize; y++) {
        gridGraphics.moveTo(0, y * tileSize);
        gridGraphics.lineTo(gridPixelSize, y * tileSize);
      }
      gridContainer.addChild(gridGraphics);

      // Draw objects
      objects.forEach(obj => {
        const marker = new Graphics();
        marker.beginFill(0xff0000, 0.5);
        marker.drawCircle(
          obj.position.x * tileSize + tileSize / 2,
          obj.position.y * tileSize + tileSize / 2,
          5
        );
        marker.endFill();
        gridContainer.addChild(marker);
      });

      // Highlight square
      const highlightGraphics = new Graphics();
      if (highlightedCell) {
        highlightGraphics.beginFill(0xffff00, 0.6);
        highlightGraphics.drawRect(
          highlightedCell.x * tileSize,
          highlightedCell.y * tileSize,
          tileSize,
          tileSize
        );
        highlightGraphics.endFill();
      }
      gridContainer.addChild(highlightGraphics);

      // Center grid
      gridContainer.position.set(app.screen.width / 2 - halfGridSize, app.screen.height / 2 - halfGridSize);
      setWorldOffset({ x: gridContainer.position.x, y: gridContainer.position.y });

      let isDragging = false;
      let startX, startY;

      app.stage.eventMode = "static";
      app.stage.on("pointerdown", (e) => {
        if (!isBuildMode) {
          isDragging = true;
          startX = e.global.x;
          startY = e.global.y;
          app.stage.cursor = "grabbing";
        } else {
          const global = e.global;
          const localX = global.x - gridContainer.position.x;
          const localY = global.y - gridContainer.position.y;

          const tileX = Math.floor(localX / tileSize);
          const tileY = Math.floor(localY / tileSize);

          if (e.data.button === 2) {
            onCellRightClick(e.data.originalEvent, tileX, tileY);
          } else {
            onCellClick({ x: tileX, y: tileY });
          }
        }
      });

      app.stage.on("pointermove", (e) => {
        if (isDragging && !isBuildMode) {
          const dx = e.global.x - startX;
          const dy = e.global.y - startY;
          const newX = worldOffset.x + dx;
          const newY = worldOffset.y + dy;
          gridContainer.position.set(newX, newY);
          setWorldOffset({ x: newX, y: newY });
          startX = e.global.x;
          startY = e.global.y;
        }
      });

      app.stage.on("pointerup", () => {
        isDragging = false;
        if (!isBuildMode) app.stage.cursor = "grab";
      });

      const handleKeyDown = (e) => {
        if (e.key === "b" || e.key === "B") {
          setIsBuildMode((prev) => !prev);
          drawHazardTape(app.stage, !isBuildMode, app.screen.width, app.screen.height);
          app.stage.cursor = isBuildMode ? "default" : "grab";
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        app.destroy(true, { children: true });
      };
    };

    run().catch(console.error);
  }, [isBuildMode, setIsBuildMode, highlightedCell, objects, currentLevel, onCellClick, onCellRightClick]);

  return <div ref={pixiContainer} style={{ width: "100%", height: "100%" }} />;
};

export default PixiMapDemo;