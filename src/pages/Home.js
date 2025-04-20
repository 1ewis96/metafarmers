import React, { useEffect, useRef, useState } from "react";
import { Container, ProgressBar } from "react-bootstrap";
import * as PIXI from "pixi.js";
import Navigation from "./Navigation";

const TILE_SIZE = 64;
const GRID_SIZE = 30;
const MINIMAP_SIZE = 200;
const MINIMAP_SCALE = 0.15; // Increased for visibility during debugging

const ObjectViewer = () => {
  const pixiContainer = useRef(null);
  const minimapContainer = useRef(null);
  const [app, setApp] = useState(null);
  const [minimapApp, setMinimapApp] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const textureCache = useRef({});
  const placedSprites = useRef([]);
  const [availableLayers, setAvailableLayers] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const hoverBorder = useRef(null);
  const [textureCanvases, setTextureCanvases] = useState({});
  const minimapSprites = useRef([]);
  const [spriteUpdateCounter, setSpriteUpdateCounter] = useState(0); // Force minimap update

  // Initialize Main PIXI App
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

  // Initialize Minimap PIXI App
  useEffect(() => {
    if (!minimapContainer.current || !app) return;

    const minimapApp = new PIXI.Application({
      width: MINIMAP_SIZE,
      height: MINIMAP_SIZE,
      backgroundColor: 0x333333,
      backgroundAlpha: 0.8,
    });

    minimapContainer.current.appendChild(minimapApp.view);
    setMinimapApp(minimapApp);

    minimapApp.stage.eventMode = 'static';
    minimapApp.stage.hitArea = new PIXI.Rectangle(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Draw minimap grid
    const gridGraphics = new PIXI.Graphics();
    gridGraphics.beginFill(0xcccccc);
    gridGraphics.drawRect(0, 0, GRID_SIZE * TILE_SIZE * MINIMAP_SCALE, GRID_SIZE * TILE_SIZE * MINIMAP_SCALE);
    gridGraphics.endFill();
    gridGraphics.lineStyle(1, 0x666666, 1);
    for (let i = 0; i <= GRID_SIZE; i++) {
      gridGraphics.moveTo(i * TILE_SIZE * MINIMAP_SCALE, 0);
      gridGraphics.lineTo(i * TILE_SIZE * MINIMAP_SCALE, GRID_SIZE * TILE_SIZE * MINIMAP_SCALE);
      gridGraphics.moveTo(0, i * TILE_SIZE * MINIMAP_SCALE);
      gridGraphics.lineTo(GRID_SIZE * TILE_SIZE * MINIMAP_SCALE, i * TILE_SIZE * MINIMAP_SCALE);
    }
    minimapApp.stage.addChild(gridGraphics);

    // Add viewport rectangle (sprites will be added before this)
    const viewportRect = new PIXI.Graphics();
    viewportRect.name = 'viewportRect';
    minimapApp.stage.addChild(viewportRect);

    return () => {
      minimapApp.destroy(true, true);
    };
  }, [app]);

  // Handle Zoom and Pan
  useEffect(() => {
    if (!app) return;

    const minScale = 0.2;
    const maxScale = 5;
    const zoomSpeed = 0.1;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let stageStart = { x: 0, y: 0 };

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const zoomFactor = 1 + delta * zoomSpeed;

      const rect = pixiContainer.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - app.stage.x) / app.stage.scale.x;
      const worldY = (mouseY - app.stage.y) / app.stage.scale.y;

      let newScale = app.stage.scale.x * zoomFactor;
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      app.stage.scale.set(newScale);
      app.stage.x = mouseX - worldX * newScale;
      app.stage.y = mouseY - worldY * newScale;
    };

    const handlePointerDown = (e) => {
      if (e.target === app.stage) {
        isDragging = true;
        dragStart = { x: e.data.global.x, y: e.data.global.y };
        stageStart = { x: app.stage.x, y: app.stage.y };
      }
    };

    const handlePointerMove = (e) => {
      if (isDragging) {
        const current = { x: e.data.global.x, y: e.data.global.y };
        app.stage.x = stageStart.x + (current.x - dragStart.x);
        app.stage.y = stageStart.y + (current.y - dragStart.y);
      }
    };

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

  // Handle Hover Border
  useEffect(() => {
    if (!app) return;

    const handlePointerMove = (e) => {
      const mouseX = (e.data.global.x - app.stage.x) / app.stage.scale.x;
      const mouseY = (e.data.global.y - app.stage.y) / app.stage.scale.y;

      const tileX = Math.floor(mouseX / TILE_SIZE);
      const tileY = Math.floor(mouseY / TILE_SIZE);

      if (tileX >= 0 && tileX < GRID_SIZE && tileY >= 0 && tileY < GRID_SIZE) {
        setHoveredCell({ x: tileX, y: tileY });
      } else {
        setHoveredCell(null);
      }
    };

    const handlePointerLeave = () => {
      setHoveredCell(null);
    };

    app.stage.on('pointermove', handlePointerMove);
    pixiContainer.current.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      app.stage.off('pointermove', handlePointerMove);
      pixiContainer.current.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [app]);

  // Draw Yellow Border for Hovered Cell
  useEffect(() => {
    if (!hoverBorder.current) return;

    hoverBorder.current.clear();

    if (hoveredCell) {
      hoverBorder.current.lineStyle(3, 0xffff00, 1);
      hoverBorder.current.drawRect(
        hoveredCell.x * TILE_SIZE - 1,
        hoveredCell.y * TILE_SIZE - 1,
        TILE_SIZE + 2,
        TILE_SIZE + 2
      );
    }
  }, [hoveredCell]);

  // Update Minimap Sprites
  useEffect(() => {
    if (!minimapApp || loading || !currentLayer) return;

    // Clear existing minimap sprites
    minimapSprites.current.forEach((sprite) => {
      minimapApp.stage.removeChild(sprite);
      sprite.destroy();
    });
    minimapSprites.current = [];

    // Add sprites after grid but before viewportRect
    console.log(`Minimap update triggered. placedSprites count: ${placedSprites.current.length}`);
    placedSprites.current.forEach((sprite, index) => {
      console.log(`Processing sprite ${index}: ${sprite.metaObjectName}, texture valid: ${sprite.texture?.valid}`);
      if (!sprite.texture || !sprite.texture.valid) {
        console.warn(`Sprite ${sprite.metaObjectName} has invalid texture`);
        // Fallback: draw a red rectangle
        const fallback = new PIXI.Graphics();
        fallback.beginFill(0xff0000);
        fallback.drawRect(
          (sprite.x - sprite.width / 2) * MINIMAP_SCALE,
          (sprite.y - sprite.height / 2) * MINIMAP_SCALE,
          sprite.width * MINIMAP_SCALE,
          sprite.height * MINIMAP_SCALE
        );
        fallback.endFill();
        minimapApp.stage.addChildAt(fallback, 1); // After grid (index 0)
        minimapSprites.current.push(fallback);
        console.log(`Added fallback rectangle at (${(sprite.x - sprite.width / 2) * MINIMAP_SCALE}, ${(sprite.y - sprite.height / 2) * MINIMAP_SCALE})`);
        return;
      }

      const miniSprite = new PIXI.Sprite(sprite.texture);
      miniSprite.anchor.set(0.5, 0.5);
      miniSprite.width = sprite.width * MINIMAP_SCALE;
      miniSprite.height = sprite.height * MINIMAP_SCALE;
      miniSprite.x = sprite.x * MINIMAP_SCALE;
      miniSprite.y = sprite.y * MINIMAP_SCALE;
      miniSprite.rotation = sprite.rotation;
      miniSprite.alpha = 1;
      minimapApp.stage.addChildAt(miniSprite, 1); // After grid (index 0)
      minimapSprites.current.push(miniSprite);
      console.log(`Added sprite ${sprite.metaObjectName} at (${miniSprite.x}, ${miniSprite.y}), size: (${miniSprite.width}x${miniSprite.height})`);
    });
  }, [minimapApp, loading, currentLayer, spriteUpdateCounter]);

  // Update Minimap Viewport Rectangle
  useEffect(() => {
    if (!minimapApp || !app) return;

    const viewportRect = minimapApp.stage.getChildByName('viewportRect');
    if (!viewportRect) return;

    viewportRect.clear();

    const viewWidth = app.renderer.width / app.stage.scale.x;
    const viewHeight = app.renderer.height / app.stage.scale.y;
    const viewX = -app.stage.x / app.stage.scale.x;
    const viewY = -app.stage.y / app.stage.y;

    const miniViewX = viewX * MINIMAP_SCALE;
    const miniViewY = viewY * MINIMAP_SCALE;
    const miniViewWidth = viewWidth * MINIMAP_SCALE;
    const miniViewHeight = viewHeight * MINIMAP_SCALE;

    viewportRect.lineStyle(2, 0xff0000, 1);
    viewportRect.drawRect(miniViewX, miniViewY, miniViewWidth, miniViewHeight);
  }, [minimapApp, app, app?.stage?.x, app?.stage?.y, app?.stage?.scale?.x]);

  // Handle Minimap Click
  useEffect(() => {
    if (!minimapApp || !app) return;

    const handleClick = (e) => {
      const localPos = e.data.getLocalPosition(minimapApp.stage);
      const worldX = localPos.x / MINIMAP_SCALE;
      const worldY = localPos.y / MINIMAP_SCALE;
      app.stage.x = -worldX * app.stage.scale.x + app.renderer.width / 2;
      app.stage.y = -worldY * app.stage.y + app.renderer.height / 2;
    };

    minimapApp.stage.on('pointerdown', handleClick);

    return () => {
      minimapApp.stage.off('pointerdown', handleClick);
    };
  }, [minimapApp, app]);

  // Generate Canvas for Textures
  useEffect(() => {
    if (!app || Object.keys(textureCache.current).length === 0) return;

    const canvases = {};
    Object.keys(textureCache.current).forEach((key) => {
      const texture = textureCache.current[key].texture;
      const sprite = new PIXI.Sprite(texture);
      sprite.width = 48;
      sprite.height = 48;
      try {
        const canvas = app.renderer.extract.canvas(sprite);
        canvases[key] = canvas;
      } catch (err) {
        console.error(`Error generating canvas for ${key}:`, err);
      }
      sprite.destroy();
    });
    setTextureCanvases(canvases);
  }, [app, loading]);

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

      hoverBorder.current = new PIXI.Graphics();
      app.stage.addChild(hoverBorder.current);
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
          // Wait for texture to load
          await new Promise((resolve) => {
            texture.baseTexture.on('loaded', resolve);
            if (texture.baseTexture.valid) resolve();
          });

          textureCache.current[objData.id] = {
            texture,
            data: objData,
          };
          console.log(`Loaded texture ${objData.id}, valid: ${texture.baseTexture.valid}`);
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

  const placeObjectOnGrid = (texture, gridX, gridY, width = 1, height = 1, objectName = null, rotation = 0) => {
    const sprite = new PIXI.Sprite(texture);

    sprite.anchor.set(0.5, 0.5);
    sprite.width = width * TILE_SIZE;
    sprite.height = height * TILE_SIZE;
    sprite.x = gridX * TILE_SIZE + sprite.width / 2;
    sprite.y = gridY * TILE_SIZE + sprite.height / 2;
    sprite.rotation = (rotation * Math.PI) / 180;

    sprite.metaTileX = gridX;
    sprite.metaTileY = gridY;
    sprite.metaObjectName = objectName;
    sprite.metaRotation = rotation;

    app.stage.addChild(sprite);
    console.log(`Placed sprite ${objectName} at (${gridX}, ${gridY}), texture valid: ${texture.valid}`);
    return sprite;
  };

  const clearSprites = () => {
    if (!placedSprites.current.length) return;
    placedSprites.current.forEach((sprite) => {
      app.stage.removeChild(sprite);
      sprite.destroy();
    });
    placedSprites.current = [];
    setSpriteUpdateCounter((prev) => prev + 1);
    console.log("Cleared sprites, triggered minimap update");
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
        const rotation = item.rotation || 0;

        if (textureCache.current[objectId]) {
          const sprite = placeObjectOnGrid(
            textureCache.current[objectId].texture,
            x,
            y,
            1,
            1,
            objectId,
            rotation
          );
          placedSprites.current.push(sprite);
        }
      });
      setSpriteUpdateCounter((prev) => prev + 1);
      console.log(`Loaded layer ${layerName}, placedSprites count: ${placedSprites.current.length}`);
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
            rotation: 0,
          }),
        });

        const data = await res.json();
        if (data.message === "success") {
          const sprite = placeObjectOnGrid(textureCache.current[objectName].texture, tileX, tileY, 1, 1, objectName, 0);
          placedSprites.current.push(sprite);
          setSpriteUpdateCounter((prev) => prev + 1);
          console.log(`Dropped sprite ${objectName}, placedSprites count: ${placedSprites.current.length}`);
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
      const tileY = Math.floor(mouseY / TILE_SIZE); // Fixed syntax error: removed 'the' and added semicolon

      const foundSprite = placedSprites.current.find((sprite) => {
        const spriteTileX = Math.floor((sprite.x - sprite.width / 2) / TILE_SIZE);
        const spriteTileY = Math.floor((sprite.y - sprite.height / 2) / TILE_SIZE);
        return spriteTileX === tileX && spriteTileY === tileY;
      });

      if (foundSprite) {
        setSelectedCell({
          x: tileX,
          y: tileY,
          objectName: foundSprite.metaObjectName,
          rotation: foundSprite.metaRotation,
        });
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
          setSpriteUpdateCounter((prev) => prev + 1);
          console.log(`Ejected sprite, placedSprites count: ${placedSprites.current.length}`);
        }
        setSelectedCell(null);
      }
    } catch (err) {
      console.error("Error ejecting object:", err);
    }
  };

  const handleRotate = async () => {
    if (!selectedCell || !selectedCell.objectName) return;

    const sprite = placedSprites.current.find(
      (s) =>
        s.metaTileX === selectedCell.x &&
        s.metaTileY === selectedCell.y &&
        s.metaObjectName === selectedCell.objectName
    );
    if (!sprite) return;

    const newRotation = (sprite.metaRotation + 90) % 360;
    sprite.rotation = (newRotation * Math.PI) / 180;
    sprite.metaRotation = newRotation;

    const compositeKey = `${selectedCell.objectName}#${selectedCell.x}#${selectedCell.y}`;

    try {
      const res = await fetch("https://api.metafarmers.io/layer/object/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer: currentLayer,
          compositeKey,
          rotation: newRotation,
        }),
      });

      const data = await res.json();
      if (data.message === "success") {
        setSelectedCell({ ...selectedCell, rotation: newRotation });
        setSpriteUpdateCounter((prev) => prev + 1);
        console.log(`Rotated sprite ${selectedCell.objectName}, new rotation: ${newRotation}`);
      } else {
        sprite.rotation = (sprite.metaRotation * Math.PI) / 180;
        sprite.metaRotation = selectedCell.rotation;
      }
    } catch (err) {
      console.error("Error rotating object:", err);
      sprite.rotation = (sprite.metaRotation * Math.PI) / 180;
      sprite.metaRotation = selectedCell.rotation;
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
          <div
            style={{
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
            }}
          >
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                {textureCanvases[key] ? (
                  <img
                    src={textureCanvases[key].toDataURL()}
                    alt={key}
                    style={{ width: "48px", height: "48px", objectFit: "contain" }}
                  />
                ) : (
                  <span>Loading...</span>
                )}
                <span style={{ marginTop: "4px", fontSize: "12px" }}>{key}</span>
              </div>
            ))}
          </div>
        )}

        {selectedCell && (
          <div
            style={{
              position: "absolute",
              top: "100px",
              left: "20px",
              width: "250px",
              background: "#fff",
              border: "1px solid #ccc",
              padding: "10px",
              zIndex: 15,
            }}
          >
            <h5>Cell Info</h5>
            <p>
              <strong>Tile:</strong> ({selectedCell.x}, {selectedCell.y})
            </p>
            {selectedCell.objectName ? (
              <>
                <p>
                  <strong>Object:</strong> {selectedCell.objectName}
                </p>
                <p>
                  <strong>Rotation:</strong> {selectedCell.rotation || 0}°
                </p>
                <button onClick={handleEject}>Eject</button>
                <button
                  onClick={handleRotate}
                  style={{ marginLeft: "10px" }}
                  disabled={!selectedCell.objectName}
                >
                  Rotate
                </button>
              </>
            ) : (
              <p>
                <em>No object placed</em>
              </p>
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

        <div
          ref={minimapContainer}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: `${MINIMAP_SIZE}px`,
            height: `${MINIMAP_SIZE}px`,
            border: "2px solid #fff",
            zIndex: 10,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
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