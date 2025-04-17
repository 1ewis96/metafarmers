import React, { useEffect, useRef, useState } from "react";
import { Application, Container as PixiContainer, Graphics, Sprite } from "pixi.js";
import { GridManager } from "./utils/GridManager";
import DragItemPanel from "./components/DragItemPanel";

const PixiMapDemo = () => {
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const gridContainerRef = useRef(null);
  const gridManagerRef = useRef(null);
  const needsRedraw = useRef(false);
  const objectInfoCache = useRef({});

  const tileSize = 64;
  const gridSize = 30;
  const [availableLayers, setAvailableLayers] = useState([]);
  const [availableObjects, setAvailableObjects] = useState([]);
  const [activeLayer, setActiveLayer] = useState("background");

  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const res = await fetch("https://api.metafarmers.io/list/layers");
        const data = await res.json();
        setAvailableLayers(data.layers.map((l) => l.layer));
        if (data.layers.length > 0) setActiveLayer(data.layers[0].layer);
      } catch (err) {
        console.error("Failed to fetch layers:", err);
      }
    };

    const fetchObjects = async () => {
      try {
        const res = await fetch("https://api.metafarmers.io/list/objects");
        const data = await res.json();
        setAvailableObjects(data.objects || []);
      } catch (err) {
        console.error("Failed to fetch objects:", err);
      }
    };

    fetchLayers();
    fetchObjects();
  }, []);

  const fetchObjectInfo = async (objectName) => {
    if (objectInfoCache.current[objectName]) {
      return objectInfoCache.current[objectName];
    }
    const res = await fetch(`https://api.metafarmers.io/object/${objectName}`);
    const data = await res.json();
    objectInfoCache.current[objectName] = data;
    return data;
  };

  useEffect(() => {
    if (!availableLayers.length) return;

    const app = new Application({
      backgroundColor: 0x222222,
      resizeTo: pixiContainer.current,
    });
    appRef.current = app;

    if (pixiContainer.current) {
      pixiContainer.current.innerHTML = "";
      pixiContainer.current.appendChild(app.view);
    }

    const gridContainer = new PixiContainer();
    gridContainerRef.current = gridContainer;
    app.stage.addChild(gridContainer);

    const gridManager = new GridManager(gridSize, availableLayers);
    gridManagerRef.current = gridManager;

    const drawGrid = () => {
      const container = gridContainerRef.current;
      container.removeChildren();

      const gridGraphics = new Graphics();

      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const obj = gridManager.get(x, y, activeLayer);
          gridGraphics.beginFill(obj ? 0xcccccc : 0xf0f0f0);
          gridGraphics.drawRect(x * tileSize, y * tileSize, tileSize, tileSize);
          gridGraphics.endFill();
        }
      }

      gridGraphics.lineStyle(1, 0x444444, 1);
      for (let x = 0; x <= gridSize; x++) {
        gridGraphics.moveTo(x * tileSize, 0);
        gridGraphics.lineTo(x * tileSize, gridSize * tileSize);
      }
      for (let y = 0; y <= gridSize; y++) {
        gridGraphics.moveTo(0, y * tileSize);
        gridGraphics.lineTo(gridSize * tileSize, y * tileSize);
      }

      container.addChild(gridGraphics);

      // Draw sprites
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const obj = gridManager.get(x, y, activeLayer);
          if (obj?.spriteUrl) {
            const sprite = Sprite.from(obj.spriteUrl);
            sprite.anchor.set(obj.anchor?.x || 0.5, obj.anchor?.y || 0.5);
            sprite.scale.set(obj.scale || 1);
            sprite.x = x * tileSize + tileSize / 2;
            sprite.y = y * tileSize + tileSize / 2;
            sprite.width = obj.frameSize?.width || tileSize;
            sprite.height = obj.frameSize?.height || tileSize;
            container.addChild(sprite);
          }
        }
      }
    };

    app.ticker.add(() => {
      if (needsRedraw.current) {
        drawGrid();
        needsRedraw.current = false;
      }
    });

    needsRedraw.current = true;

    pixiContainer.current.addEventListener("dragover", (e) => e.preventDefault());
    pixiContainer.current.addEventListener("drop", async (e) => {
      e.preventDefault();
      const objectName = e.dataTransfer.getData("objectName");
      const rect = pixiContainer.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const tileX = Math.floor((localX - gridContainer.position.x) / tileSize);
      const tileY = Math.floor((localY - gridContainer.position.y) / tileSize);

      if (objectName) {
        const fullInfo = await fetchObjectInfo(objectName);
        gridManager.set(tileX, tileY, activeLayer, {
          name: objectName,
          spriteUrl: fullInfo.spriteSheet.url,
          frameSize: fullInfo.spriteSheet.frameSize,
          scale: fullInfo.render?.scale || 1,
          anchor: fullInfo.render?.anchor || { x: 0.5, y: 0.5 },
        });

        await fetch("https://api.metafarmers.io/layer/object/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer: activeLayer,
            object: objectName,
            x: tileX,
            y: tileY,
          }),
        });

        needsRedraw.current = true;
      }
    });

    return () => {
      app.destroy(true, { children: true });
    };
  }, [availableLayers, activeLayer]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <DragItemPanel items={availableObjects} />
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <select
          value={activeLayer}
          onChange={(e) => {
            setActiveLayer(e.target.value);
            needsRedraw.current = true;
          }}
        >
          {availableLayers.map((layer) => (
            <option key={layer} value={layer}>
              {layer}
            </option>
          ))}
        </select>
      </div>
      <div ref={pixiContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default PixiMapDemo;
