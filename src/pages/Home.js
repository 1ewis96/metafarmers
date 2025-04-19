// src/pages/ObjectViewer.js
import React, { useEffect, useRef, useState } from "react";
import { Container, ProgressBar } from "react-bootstrap";
import * as PIXI from "pixi.js";
import Navigation from "./Navigation";

const TILE_SIZE = 64;
const GRID_SIZE = 30;

const ObjectViewer = () => {
  const pixiContainer = useRef(null);
  const [app, setApp] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const textureCache = useRef({});
  const placedSprites = useRef([]);
  const [availableLayers, setAvailableLayers] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // Initialize PIXI App
  useEffect(() => {
    const interval = setInterval(() => {
      if (pixiContainer.current) {
        const pixiApp = new PIXI.Application({
          width: window.innerWidth,
          height: window.innerHeight,
          backgroundColor: 0x222222,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        pixiContainer.current.appendChild(pixiApp.view);
        setApp(pixiApp);

        // Make stage interactive for events
        pixiApp.stage.eventMode = 'static';
        pixiApp.stage.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);

        const handleResize = () => {
          pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
          pixiApp.stage.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        clearInterval(interval);

        return () => {
          window.removeEventListener('resize', handleResize);
          pixiApp.destroy(true, true);
        };
      }
    }, 100);
  }, []);

  // Handle Zoom and Pan
  useEffect(() => {
    if (!app) return;

    const minScale = 0.2; // Minimum zoom level
    const maxScale = 5;   // Maximum zoom level
    const zoomSpeed = 0.1; // Zoom sensitivity
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let stageStart = { x: 0, y: 0 };

    // Handle zooming with mouse wheel
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1; // Scroll direction
      const zoomFactor = 1 + delta * zoomSpeed;

      // Get mouse position relative to canvas
      const rect = pixiContainer.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Current mouse position in world coordinates
      const worldX = (mouseX - app.stage.x) / app.stage.scale.x;
      const worldY = (mouseY - app.stage.y) / app.stage.scale.y;

      // Update scale
      let newScale = app.stage.scale.x * zoomFactor;
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      // Adjust position to zoom towards mouse
      app.stage.scale.set(newScale);
      app.stage.x = mouseX - worldX * newScale;
      app.stage.y = mouseY - worldY * newScale;
    };

    // Handle drag start
    const handlePointerDown = (e) => {
      if (e.target === app.stage) { // Only drag if clicking on stage, not sprites
        isDragging = true;
        dragStart = { x: e.data.global.x, y: e.data.global.y };
        stageStart = { x: app.stage.x, y: app.stage.y };
      }
    };

    // Handle drag move
    const handlePointerMove = (e) => {
      if (isDragging) {
        const current = { x: e.data.global.x, y: e.data.global.y };
        app.stage.x = stageStart.x + (current.x - dragStart.x);
        app.stage.y = stageStart.y + (current.y - dragStart.y);
      }
    };

    // Handle drag end
    const handlePointerUp = () => {
      isDragging = false;
    };

    pixiContainer.current.addEventListener('wheel', handleWheel);
    app.stage.on('pointerdown', handlePointerDown);
    app.stage.on('pointermove', handlePointerMove);
    app.stage.on('pointerup', handlePointerUp);
    app.stage.on('pointerupoutside', handlePointerUp);

    return () => {
      pixiContainer.current.removeEventListener('wheel', handleWheel);
      app.stage.off('pointerdown', handlePointerDown);
      app.stage.off('pointermove', handlePointerMove);
      app.stage.off('pointerup', handlePointerUp);
      app.stage.off('pointerupoutside', handlePointerUp);
    };
  }, [app]);

  // Fetch textures and layers
  useEffect(() => {
    if (!app) return;

    const drawGrid = () => {
      const gridGraphics = new PIXI.Graphics();

      gridGraphics.beginFill(0xf0f0f0);
      gridGraphics.drawRect(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
      gridGraphics.endFill();

      gridGraphics.lineStyle(1, 0x444444, 1);

      for (let i = 0; i <= GRID_SIZE; i++) {
        gridGraphics.moveTo(i * TILE_SIZE, 0);
        gridGraphics.lineTo(i * TILE_SIZE, GRID_SIZE * TILE_SIZE);
        gridGraphics.moveTo(0, i * TILE_SIZE);
        gridGraphics.lineTo(GRID_SIZE * TILE_SIZE, i * TILE_SIZE);
      }

      app.stage.addChild(gridGraphics);
    };

    const fetchTextures = async () => {
      try {
        const listRes = await fetch("https://api.metafarmers.io/list/objects/");
        const listData = await listRes.json();
        const objectIds = listData.objects;
        let loadedCount = 0;
        const totalCount = objectIds.length;

        for (const id of objectIds) {
          const objRes = await fetch(`https://api.metafarmers.io/object/${id}`);
          const objData = await objRes.json();
          const texture = PIXI.Texture.from(objData.spriteSheet.url);

          textureCache.current[objData.id] = {
            texture,
            data: objData,
          };

          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / totalCount) * 100));
        }

        setLoading(false);

        drawGrid();
        fetchLayers();

      } catch (error) {
        console.error("Error loading textures:", error);
      }
    };

    const fetchLayers = async () => {
      try {
        const res = await fetch("https://api.metafarmers.io/list/layers");
        const data = await res.json();
        const layers = (data.layers || []).map((l) => l.layer);
        setAvailableLayers(layers);
        if (layers.length > 0) {
          setCurrentLayer(layers[0]);
          await loadLayer(layers[0]);
        }
      } catch (err) {
        console.error("Error loading layers:", err);
      }
    };

    fetchTextures();
  }, [app]);

  const placeObjectOnGrid = (texture, gridX, gridY, width = 1, height = 1, objectName = null) => {
    const sprite = new PIXI.Sprite(texture);

    sprite.anchor.set(0.5, 0.5);
    sprite.width = width * TILE_SIZE;
    sprite.height = height * TILE_SIZE;
    sprite.x = gridX * TILE_SIZE + sprite.width / 2;
    sprite.y = gridY * TILE_SIZE + sprite.height / 2;

    sprite.metaTileX = gridX;
    sprite.metaTileY = gridY;
    sprite.metaObjectName = objectName;

    app.stage.addChild(sprite);

    return sprite;
  };

  const clearSprites = () => {
    if (!placedSprites.current.length) return;
    placedSprites.current.forEach((sprite) => {
      app.stage.removeChild(sprite);
      sprite.destroy();
    });
    placedSprites.current = [];
  };

  const loadLayer = async (layerName) => {
    if (!layerName) return;
    if (!app) return;

    clearSprites();

    try {
      const res = await fetch("https://api.metafarmers.io/layer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layer: layerName }),
      });

      const data = await res.json();
      const items = data.data || [];

      items.forEach((item) => {
        const objectId = item.object;
        const x = item.x;
        const y = item.y;

        if (textureCache.current[objectId]) {
          const sprite = placeObjectOnGrid(textureCache.current[objectId].texture, x, y, 1, 1, objectId);
          placedSprites.current.push(sprite);
        }
      });
    } catch (err) {
      console.error("Error loading layer:", err);
    }
  };

  // Handle Drag and Drop
  useEffect(() => {
    if (!pixiContainer.current) return;

    const container = pixiContainer.current;

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      const objectName = e.dataTransfer.getData("objectName");
      if (!objectName) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust for stage scale and position
      const worldX = (mouseX - app.stage.x) / app.stage.scale.x;
      const worldY = (mouseY - app.stage.y) / app.stage.scale.y;
      const tileX = Math.floor(worldX / TILE_SIZE);
      const tileY = Math.floor(worldY / TILE_SIZE);

      try {
        const res = await fetch("https://api.metafarmers.io/layer/object/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer: currentLayer,
            object: objectName,
            x: tileX,
            y: tileY,
          }),
        });

        const data = await res.json();
        if (data.message === "success") {
          const sprite = placeObjectOnGrid(textureCache.current[objectName].texture, tileX, tileY, 1, 1, objectName);
          placedSprites.current.push(sprite);
        }
      } catch (err) {
        console.error("Error placing object:", err);
      }
    };

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);

    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
    };
  }, [pixiContainer, currentLayer, app]);

  // Handle clicking on grid
  useEffect(() => {
    if (!app) return;

    const handleClick = (e) => {
      const mouseX = (e.data.global.x - app.stage.x) / app.stage.scale.x;
      const mouseY = (e.data.global.y - app.stage.y) / app.stage.scale.y;

      const tileX = Math.floor(mouseX / TILE_SIZE);
      const tileY = Math.floor(mouseY / TILE_SIZE);

      const foundSprite = placedSprites.current.find((sprite) => {
        const spriteTileX = Math.floor((sprite.x - sprite.width / 2) / TILE_SIZE);
        const spriteTileY = Math.floor((sprite.y - sprite.height / 2) / TILE_SIZE);
        return spriteTileX === tileX && spriteTileY === tileY;
      });

      if (foundSprite) {
        setSelectedCell({ x: tileX, y: tileY, objectName: foundSprite.metaObjectName });
      } else {
        setSelectedCell({ x: tileX, y: tileY, objectName: null });
      }
    };

    app.stage.on('pointerdown', handleClick);

    return () => {
      app.stage.off('pointerdown', handleClick);
    };
  }, [app]);

  const handleEject = async () => {
    if (!selectedCell || !selectedCell.objectName) return;

    const compositeKey = `${selectedCell.objectName}#${selectedCell.x}#${selectedCell.y}`;

    try {
      const res = await fetch("https://api.metafarmers.io/layer/object/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer: currentLayer,
          compositeKey,
        }),
      });

      const data = await res.json();
      if (data.message === "success") {
        const idx = placedSprites.current.findIndex((sprite) =>
          sprite.metaTileX === selectedCell.x &&
          sprite.metaTileY === selectedCell.y &&
          sprite.metaObjectName === selectedCell.objectName
        );
        if (idx !== -1) {
          app.stage.removeChild(placedSprites.current[idx]);
          placedSprites.current[idx].destroy();
          placedSprites.current.splice(idx, 1);
        }
        setSelectedCell(null);
      }
    } catch (err) {
      console.error("Error ejecting object:", err);
    }
  };

  return (
    <>
      <Navigation />
      <Container fluid className="mt-4">

        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <select
            value={currentLayer || ""}
            onChange={async (e) => {
              const selected = e.target.value;
              setCurrentLayer(selected);
              await loadLayer(selected);
            }}
          >
            {availableLayers.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>

          <button
            style={{ marginLeft: "20px" }}
            onClick={() => setShowAddPanel(!showAddPanel)}
          >
            {showAddPanel ? "Close Object Panel" : "Add Object"}
          </button>
        </div>

        {showAddPanel && (
          <div style={{
            position: "absolute",
            top: "80px",
            right: "20px",
            width: "200px",
            background: "#fff",
            border: "1px solid #ccc",
            padding: "10px",
            maxHeight: "70vh",
            overflowY: "auto",
            zIndex: 10,
          }}>
            <h5>Drag Object</h5>
            {Object.keys(textureCache.current).map((key) => (
              <div
                key={key}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("objectName", key);
                }}
                style={{
                  margin: "8px 0",
                  padding: "6px",
                  background: "#eee",
                  border: "1px solid #aaa",
                  cursor: "grab",
                  textAlign: "center",
                }}
              >
                {key}
              </div>
            ))}
          </div>
        )}

        {selectedCell && (
          <div style={{
            position: "absolute",
            top: "100px",
            left: "20px",
            width: "250px",
            background: "#fff",
            border: "1px solid #ccc",
            padding: "10px",
            zIndex: 15,
          }}>
            <h5>Cell Info</h5>
            <p><strong>Tile:</strong> ({selectedCell.x}, {selectedCell.y})</p>
            {selectedCell.objectName ? (
              <>
                <p><strong>Object:</strong> {selectedCell.objectName}</p>
                <button onClick={handleEject}>Eject</button>
              </>
            ) : (
              <p><em>No object placed</em></p>
            )}
          </div>
        )}

        <div
          ref={pixiContainer}
          style={{
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            display: loading ? "none" : "block",
          }}
        />

        {loading && (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h3>Loading Sprites...</h3>
            <ProgressBar
              now={loadingProgress}
              label={`${loadingProgress}%`}
              animated
              striped
            />
          </div>
        )}
      </Container>
    </>
  );
};

export default ObjectViewer;