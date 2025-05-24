import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { TILE_SIZE } from "./constants";
import useLayerLoader from "./useLayerLoader";

const useMapInteractions = ({
  app,
  pixiContainer,
  hoverBorder,
  placedSprites,
  placedTiles,
  currentLayer,
  textureCache,
  tileCache,
  setSelectedCell,
  setSpriteUpdateCounter,
  placeSingleTile,
}) => {
  const { placeObjectOnGrid } = useLayerLoader({
    app,
    textureCache,
    placedSprites,
    setSpriteUpdateCounter,
  });

  useEffect(() => {
    if (!app || !pixiContainer.current) return;

    const minScale = 0.2;
    const maxScale = 5;
    const zoomSpeed = 0.1;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let stageStart = { x: 0, y: 0 };

    const updateHitArea = () => {
      const canvasWidth = app.renderer.width;
      const canvasHeight = app.renderer.height;
      const stageX = app.stage.x;
      const stageY = app.stage.y;
      const scale = app.stage.scale.x;

      const worldLeft = -stageX / scale;
      const worldTop = -stageY / scale;
      const worldRight = (canvasWidth - stageX) / scale;
      const worldBottom = (canvasHeight - stageY) / scale;

      app.stage.hitArea = new PIXI.Rectangle(
        worldLeft,
        worldTop,
        worldRight - worldLeft,
        worldBottom - worldTop
      );

    };
    updateHitArea();

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
      updateHitArea();
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
      updateHitArea();
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    pixiContainer.current.addEventListener("wheel", handleWheel);
    app.stage.on("pointerdown", handlePointerDown);
    app.stage.on("pointermove", handlePointerMove);
    app.stage.on("pointerup", handlePointerUp);
    app.stage.on("pointerupoutside", handlePointerUp);

    return () => {
      if (pixiContainer.current) {
        pixiContainer.current.removeEventListener("wheel", handleWheel);
      }
      app.stage.off("pointerdown", handlePointerDown);
      app.stage.off("pointermove", handlePointerMove);
      app.stage.off("pointerup", handlePointerUp);
      app.stage.off("pointerupoutside", handlePointerUp);
    };
  }, [app, pixiContainer]);

  useEffect(() => {
    if (!app || !pixiContainer.current) return;

    const handlePointerMove = (e) => {
      // Skip if app or stage is not available
      if (!app || !app.stage) return;
      
      // Skip if hoverBorder is not properly initialized
      if (!hoverBorder.current || !hoverBorder.current.geometry) {
        // Recreate the graphics object if it's missing or invalid
        hoverBorder.current = new PIXI.Graphics();
        app.stage.addChild(hoverBorder.current);
      }
      
      try {
        const mouseX = (e.data.global.x - app.stage.x) / app.stage.scale.x;
        const mouseY = (e.data.global.y - app.stage.y) / app.stage.scale.y;
        const tileX = Math.floor(mouseX / TILE_SIZE);
        const tileY = Math.floor(mouseY / TILE_SIZE);
        
        // Safely clear and redraw the hover border
        if (hoverBorder.current && hoverBorder.current.clear) {
          hoverBorder.current.clear();
          hoverBorder.current.lineStyle(3, 0xffff00, 1);
          hoverBorder.current.drawRect(
            tileX * TILE_SIZE - 1,
            tileY * TILE_SIZE - 1,
            TILE_SIZE + 2,
            TILE_SIZE + 2
          );
        }
      } catch (err) {
        console.error('Error in handlePointerMove:', err);
      }
    };

    // Safe mouseleave handler that checks if hoverBorder is valid before clearing
    const handleMouseLeave = () => {
      if (hoverBorder.current && hoverBorder.current.clear) {
        try {
          hoverBorder.current.clear();
        } catch (err) {
          console.error('Error clearing hover border:', err);
        }
      }
    };
    
    app.stage.on("pointermove", handlePointerMove);
    pixiContainer.current.addEventListener("mouseleave", handleMouseLeave);

    app.stage.interactive = true;
    app.stage.buttonMode = true;

    return () => {
      app.stage.off("pointermove", handlePointerMove);
      if (pixiContainer.current) {
        pixiContainer.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [app, hoverBorder, pixiContainer]);

  useEffect(() => {
    if (!app || !pixiContainer.current) return;

    const updateHitArea = () => {
      const canvasWidth = app.renderer.width;
      const canvasHeight = app.renderer.height;
      const stageX = app.stage.x;
      const stageY = app.stage.y;
      const scale = app.stage.scale.x;

      const worldLeft = -stageX / scale;
      const worldTop = -stageY / scale;
      const worldRight = (canvasWidth - stageX) / scale;
      const worldBottom = (canvasHeight - stageY) / scale;

      app.stage.hitArea = new PIXI.Rectangle(
        worldLeft,
        worldTop,
        worldRight - worldLeft,
        worldBottom - worldTop
      );

    };

    updateHitArea();
    app.stage.on('pointermove', updateHitArea);

    return () => {
      app.stage.off('pointermove', updateHitArea);
    };
  }, [app]);

  useEffect(() => {
    if (!app || !pixiContainer.current) return;

    const handleClick = (e) => {
      const mouseX = (e.data.global.x - app.stage.x) / app.stage.scale.x;
      const mouseY = (e.data.global.y - app.stage.y) / app.stage.scale.y;
      const tileX = Math.floor(mouseX / TILE_SIZE);
      const tileY = Math.floor(mouseY / TILE_SIZE);
      
      // Check for objects first (they're on top)
      const foundSprite = placedSprites.current.find((sprite) => {
        const spriteTileX = Math.floor((sprite.x - sprite.width / 2) / TILE_SIZE);
        const spriteTileY = Math.floor((sprite.y - sprite.height / 2) / TILE_SIZE);
        return spriteTileX === tileX && spriteTileY === tileY;
      });
      
      // If no object found, check for tiles
      const foundTile = !foundSprite && placedTiles.current.find((tile) => {
        const tileTileX = Math.floor((tile.x - tile.width / 2) / TILE_SIZE);
        const tileTileY = Math.floor((tile.y - tile.height / 2) / TILE_SIZE);
        return tileTileX === tileX && tileTileY === tileY;
      });
      
      if (foundSprite) {
        // Object found
        setSelectedCell({
          x: tileX,
          y: tileY,
          type: 'object',
          objectName: foundSprite.metaObjectName,
          rotation: foundSprite.metaRotation,
        });
      } else if (foundTile) {
        // Tile found
        setSelectedCell({
          x: tileX,
          y: tileY,
          type: 'tile',
          tileName: foundTile.metaTileName,
          rotation: foundTile.metaRotation,
        });
      } else {
        // Empty cell
        setSelectedCell({ x: tileX, y: tileY, type: null });
      }
    };

    app.stage.on("pointerdown", handleClick);

    return () => {
      app.stage.off("pointerdown", handleClick);
    };
  }, [app, placedSprites, placedTiles, setSelectedCell]);

  useEffect(() => {
    if (!pixiContainer.current) return;

    const container = pixiContainer.current;

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      const objectName = e.dataTransfer.getData("objectName");
      const tileName = e.dataTransfer.getData("tileName");
      
      if (!objectName && !tileName) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - app.stage.x) / app.stage.scale.x;
      const worldY = (mouseY - app.stage.y) / app.stage.scale.y;
      const tileX = Math.floor(worldX / TILE_SIZE);
      const tileY = Math.floor(worldY / TILE_SIZE);

      if (objectName) {
        // Handle object placement
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
            const sprite = placeObjectOnGrid(
              textureCache.current[objectName].texture,
              tileX,
              tileY,
              1,
              1,
              objectName,
              0
            );
            placedSprites.current.push(sprite);
            setSpriteUpdateCounter((prev) => prev + 1);
          }
        } catch (err) {
          console.error("Error placing object:", err);
        }
      } else if (tileName) {
        // Handle tile placement
        try {
          // Use the placeSingleTile function to place the tile
          const sprite = await placeSingleTile(app, tileName, tileX, tileY, 0);
          if (sprite) {
            console.log(`Placed tile ${tileName} at (${tileX}, ${tileY})`);
          }
        } catch (err) {
          console.error("Error placing tile:", err);
        }
      }
    };

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);

    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
    };
  }, [app, pixiContainer, currentLayer, textureCache, placedSprites, setSpriteUpdateCounter, placeObjectOnGrid]);
};

export default useMapInteractions;