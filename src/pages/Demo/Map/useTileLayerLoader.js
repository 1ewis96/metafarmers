import { useCallback } from "react";
import * as PIXI from "pixi.js";
import { TILE_SIZE } from "./constants";

const useTileLayerLoader = ({ tileCache, placedTiles, setSpriteUpdateCounter, currentLayer }) => {
  // We'll store the app reference when loadTileLayer is called
  let appRef = null;
  const clearTiles = useCallback(() => {
    if (!placedTiles.current.length || !appRef) return;
    placedTiles.current.forEach((sprite) => {
      appRef.stage.removeChild(sprite);
      sprite.destroy();
    });
    placedTiles.current = [];
    setSpriteUpdateCounter((prev) => prev + 1);
  }, [placedTiles, setSpriteUpdateCounter]);

  const placeTileOnGrid = useCallback(
    (app, texture, gridX, gridY, tileName = null, rotation = 0) => {
      if (!app) return null;
      
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5, 0.5);
      sprite.width = TILE_SIZE;
      sprite.height = TILE_SIZE;
      sprite.x = gridX * TILE_SIZE + sprite.width / 2;
      sprite.y = gridY * TILE_SIZE + sprite.height / 2;
      sprite.rotation = (rotation * Math.PI) / 180;
      sprite.metaTileX = gridX;
      sprite.metaTileY = gridY;
      sprite.metaTileName = tileName;
      sprite.metaRotation = rotation;
      sprite.zIndex = 0; // Ensure tiles are always behind objects
      app.stage.addChild(sprite);
      console.log(
        `Placed tile: tileName=${tileName}, gridX=${gridX}, gridY=${gridY}, ` +
        `metaTileX=${sprite.metaTileX}, metaTileY=${sprite.metaTileY}, ` +
        `x=${sprite.x}, y=${sprite.y}`
      );
      return sprite;
    },
    []
  );

  const loadTileLayer = useCallback(
    async (app, layerName) => {
      if (!layerName || !app) return;
      
      // Store the app reference for use in other functions
      appRef = app;

      clearTiles();

      try {
        const res = await fetch("https://api.metafarmers.io/tiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layer: layerName }),
        });

        const data = await res.json();
        const items = data.data || [];

        // Make sure the stage has sortableChildren enabled
        app.stage.sortableChildren = true;

        items.forEach((item) => {
          const tileId = item.tile;
          const x = item.x;
          const y = item.y;
          const rotation = item.rotation || 0;

          if (tileCache.current[tileId]) {
            const sprite = placeTileOnGrid(
              app,
              tileCache.current[tileId].texture,
              x,
              y,
              tileId,
              rotation
            );
            if (sprite) {
              placedTiles.current.push(sprite);
            }
          }
        });
        console.log(`Loaded tile layer ${layerName}, placedTiles count: ${placedTiles.current.length}`);
        setSpriteUpdateCounter((prev) => prev + 1);
      } catch (err) {
        console.error("Error loading tile layer:", err);
      }
    },
    [tileCache, placedTiles, setSpriteUpdateCounter, clearTiles, placeTileOnGrid]
  );

  const placeSingleTile = useCallback(
    async (app, tileName, gridX, gridY, rotation = 0) => {
      if (!app || !tileName || !currentLayer) return null;

      try {
        const res = await fetch("https://api.metafarmers.io/layer/tile/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer: currentLayer,
            tile: tileName,
            x: gridX,
            y: gridY,
            rotation: rotation,
          }),
        });

        const data = await res.json();
        if (data.message === "success") {
          if (tileCache.current[tileName]) {
            const sprite = placeTileOnGrid(
              app,
              tileCache.current[tileName].texture,
              gridX,
              gridY,
              tileName,
              rotation
            );
            if (sprite) {
              placedTiles.current.push(sprite);
              setSpriteUpdateCounter((prev) => prev + 1);
              return sprite;
            }
          }
        }
        return null;
      } catch (err) {
        console.error("Error placing tile:", err);
        return null;
      }
    },
    [currentLayer, tileCache, placedTiles, setSpriteUpdateCounter, placeTileOnGrid]
  );

  return { loadTileLayer, clearTiles, placeTileOnGrid, placeSingleTile };
};

export default useTileLayerLoader;
