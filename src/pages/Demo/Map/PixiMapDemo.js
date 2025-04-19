import React, { useEffect, useRef, useState } from "react";
import { Application, Container as PixiContainer, Graphics, Sprite, Texture } from "pixi.js";
import { GridManager } from "./utils/GridManager";
import DragItemPanel from "./components/DragItemPanel";

const TILE_SIZE = 64;
const GRID_SIZE = 30;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

const PixiMapDemo = () => {
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const gridContainerRef = useRef(null);
  const gridManagerRef = useRef(null);
  const needsRedraw = useRef(false);
  const objectInfoCache = useRef({});

  const [availableLayers, setAvailableLayers] = useState([]);
  const [availableObjects, setAvailableObjects] = useState([]);
  const [activeLayer, setActiveLayer] = useState("background");

  // Fetch layers and objects initially
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [layersRes, objectsRes] = await Promise.all([
          fetch("https://api.metafarmers.io/list/layers"),
          fetch("https://api.metafarmers.io/list/objects"),
        ]);

        const layersData = await layersRes.json();
        const objectsData = await objectsRes.json();

        const layers = layersData.layers.map((l) => l.layer);
        setAvailableLayers(layers);
        if (layers.length > 0) setActiveLayer(layers[0]);

        setAvailableObjects(
          (objectsData.objects || []).map((obj) => ({
            name: obj.name,
            spriteUrl: obj.spriteSheet?.url || "",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };

    fetchInitialData();
  }, []);

  const fetchObjectInfo = async (objectName) => {
    if (objectInfoCache.current[objectName]) {
      return objectInfoCache.current[objectName];
    }
    try {
      const res = await fetch(`https://api.metafarmers.io/object/${objectName}`);
      const data = await res.json();
      objectInfoCache.current[objectName] = data;
      return data;
    } catch (err) {
      console.error(`Failed to fetch object info for ${objectName}:`, err);
      return null;
    }
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

    setupGridInteractions(gridContainer);

    const gridManager = new GridManager(GRID_SIZE, availableLayers);
    gridManagerRef.current = gridManager;

    const drawGrid = async () => {
      const container = gridContainerRef.current;
      container.removeChildren();

      const gridGraphics = new Graphics();

      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const obj = gridManager.get(x, y, activeLayer);
          gridGraphics.beginFill(obj ? 0xcccccc : 0xf0f0f0);
          gridGraphics.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          gridGraphics.endFill();
        }
      }

      gridGraphics.lineStyle(1, 0x444444, 1);
      for (let i = 0; i <= GRID_SIZE; i++) {
        gridGraphics.moveTo(i * TILE_SIZE, 0);
        gridGraphics.lineTo(i * TILE_SIZE, GRID_SIZE * TILE_SIZE);
        gridGraphics.moveTo(0, i * TILE_SIZE);
        gridGraphics.lineTo(GRID_SIZE * TILE_SIZE, i * TILE_SIZE);
      }

      container.addChild(gridGraphics);

      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const obj = gridManager.get(x, y, activeLayer);
          if (obj?.spriteUrl) {
            const texture = await Texture.fromURL(obj.spriteUrl, { crossOrigin: 'anonymous' });
            const sprite = new Sprite(texture);
            sprite.anchor.set(obj.anchor?.x || 0.5, obj.anchor?.y || 0.5);
            sprite.scale.set(obj.scale || 1);
            sprite.x = x * TILE_SIZE + TILE_SIZE / 2;
            sprite.y = y * TILE_SIZE + TILE_SIZE / 2;
            sprite.width = obj.frameSize?.width || TILE_SIZE;
            sprite.height = obj.frameSize?.height || TILE_SIZE;
            container.addChild(sprite);
          }
        }
      }
    };

    app.ticker.add(async () => {
      if (needsRedraw.current) {
        await drawGrid();
        needsRedraw.current = false;
      }
    });

    needsRedraw.current = true;

    setupDropHandlers();

    return () => {
      app.destroy(true, { children: true });
    };
  }, [availableLayers, activeLayer]);

  const setupGridInteractions = (gridContainer) => {
    gridContainer.eventMode = 'static';
    gridContainer.cursor = 'grab';

    let dragging = false;
    let dragStart = { x: 0, y: 0 };
    let gridStart = { x: 0, y: 0 };

    gridContainer.on('pointerdown', (event) => {
      dragging = true;
      dragStart = { x: event.data.global.x, y: event.data.global.y };
      gridStart = { x: gridContainer.position.x, y: gridContainer.position.y };
      gridContainer.cursor = 'grabbing';
    });

    gridContainer.on('pointermove', (event) => {
      if (dragging) {
        const dx = event.data.global.x - dragStart.x;
        const dy = event.data.global.y - dragStart.y;
        gridContainer.position.set(gridStart.x + dx, gridStart.y + dy);
      }
    });

    const stopDragging = () => {
      dragging = false;
      gridContainer.cursor = 'grab';
    };

    gridContainer.on('pointerup', stopDragging);
    gridContainer.on('pointerupoutside', stopDragging);
  };

  const setupDropHandlers = () => {
    if (!pixiContainer.current) return;

    pixiContainer.current.addEventListener("dragover", (e) => e.preventDefault());
    pixiContainer.current.addEventListener("drop", async (e) => {
      e.preventDefault();
      const objectName = e.dataTransfer.getData("objectName");
      if (!objectName) return;

      const rect = pixiContainer.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      const tileX = Math.floor((localX - gridContainerRef.current.position.x) / TILE_SIZE);
      const tileY = Math.floor((localY - gridContainerRef.current.position.y) / TILE_SIZE);

      const fullInfo = await fetchObjectInfo(objectName);
      if (!fullInfo) return;

      gridManagerRef.current.set(tileX, tileY, activeLayer, {
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
    });
  };

  const zoomIn = () => {
    if (gridContainerRef.current) {
      let newScale = gridContainerRef.current.scale.x * 1.1;
      newScale = Math.min(newScale, MAX_SCALE);
      gridContainerRef.current.scale.set(newScale);
    }
  };

  const zoomOut = () => {
    if (gridContainerRef.current) {
      let newScale = gridContainerRef.current.scale.x * 0.9;
      newScale = Math.max(newScale, MIN_SCALE);
      gridContainerRef.current.scale.set(newScale);
    }
  };

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

      <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={zoomIn} style={{ padding: "8px 12px" }}>Zoom In</button>
        <button onClick={zoomOut} style={{ padding: "8px 12px" }}>Zoom Out</button>
      </div>

      <div ref={pixiContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default PixiMapDemo;
