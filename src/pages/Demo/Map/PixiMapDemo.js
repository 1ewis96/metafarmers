import React, { useEffect, useRef } from "react";
import { Application, Container as PixiContainer } from "pixi.js";
import Cell from "./Cell";
import { drawHazardTape, handleDrag } from "./utils/gridUtils";
import { loadLevel } from "./utils/objectUtils";

const PixiMapDemo = ({
  isBuildMode,
  setIsBuildMode,
  highlightedCell,
  objects,
  setObjects,
  currentLevel,
  onCellClick,
  onCellRightClick,
}) => {
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const gridContainerRef = useRef(null);
  const [worldOffset, setWorldOffset] = React.useState({ x: 0, y: 0 });
  const gridSize = 30;
  const cellSize = 30;

  useEffect(() => {
    const run = async () => {
      console.log("PixiMapDemo running, currentLevel:", currentLevel, "objects:", objects); // Debug log
      const levelData = await loadLevel(currentLevel);
      setObjects(levelData.objects);

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

      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const obj = objects.find(o => o.position.x === x && o.position.y === y);
          const cell = new Cell({
            x,
            y,
            type: obj ? obj.type : "floor",
            object: obj || null,
            isHighlighted: highlightedCell && highlightedCell.x === x && highlightedCell.y === y,
            onClick: onCellClick,
            onRightClick: onCellRightClick,
          }).graphics;
          gridContainer.addChild(cell);
        }
      }

      let isDragging = false;
      let startX, startY;

      app.stage.eventMode = "static";
      app.stage.on("pointerdown", (e) => {
        if (!isBuildMode) {
          isDragging = true;
          startX = e.global.x;
          startY = e.global.y;
          app.stage.cursor = "grabbing";
        }
      });

      app.stage.on("pointermove", (e) => {
        if (isDragging && !isBuildMode) {
          const newX = e.global.x;
          const newY = e.global.y;
          handleDrag(gridContainer, startX, startY, newX, newY, worldOffset, setWorldOffset);
          startX = newX;
          startY = newY;
        }
      });

      app.stage.on("pointerup", () => {
        isDragging = false;
        if (!isBuildMode) app.stage.cursor = "grab";
      });

      const handleKeyDown = (e) => {
        if (e.key === "b") {
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
  }, [currentLevel, isBuildMode, highlightedCell, objects, onCellClick, onCellRightClick, setIsBuildMode, setObjects]);

  return <div ref={pixiContainer} style={{ width: "100%", height: "100%" }} />;
};

export default PixiMapDemo;