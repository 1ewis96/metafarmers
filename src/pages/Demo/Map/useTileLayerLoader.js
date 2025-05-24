import { useCallback, useRef } from "react";
import * as PIXI from "pixi.js";
import { TILE_SIZE } from "./constants";

const useTileLayerLoader = ({ tileCache, placedTiles, setSpriteUpdateCounter, currentLayer }) => {
  // Store the app reference when loadTileLayer is called
  const appRef = useRef(null);
  // Track if we're currently loading tiles to prevent duplicate loads
  const isLoadingTiles = useRef(false);

  /**
   * Clear all existing tiles from the stage
   */
  const clearTiles = useCallback(() => {
    console.log("Clearing tiles...");
    try {
      // First empty the placedTiles array to avoid memory leaks
      if (placedTiles.current.length) {
        // Remove each sprite from the stage and destroy it
        placedTiles.current.forEach((sprite) => {
          if (sprite && sprite.parent) {
            sprite.parent.removeChild(sprite);
          }
          if (sprite && sprite.destroy) {
            sprite.destroy({ children: true });
          }
        });
        
        // Clear the array
        placedTiles.current = [];
        
        // Force a render update
        if (appRef.current && appRef.current.renderer) {
          appRef.current.renderer.render(appRef.current.stage);
        }
      }
      
      console.log("All tiles cleared successfully");
    } catch (err) {
      console.error("Error clearing tiles:", err);
    }

    // Update the sprite counter to trigger UI updates
    setSpriteUpdateCounter((prev) => prev + 1);
  }, [placedTiles, setSpriteUpdateCounter]);

  /**
   * Load the tile layer for the specified layer name
   */
  const loadTileLayer = useCallback(
    async (app, layerName) => {
      // Skip if no layer or app provided
      if (!layerName || !app) {
        console.log("Cannot load tile layer: missing layer name or app");
        return;
      }

      // Skip if already loading
      if (isLoadingTiles.current) {
        console.log(`Already loading tiles for ${layerName}, skipping duplicate load`);
        return;
      }

      console.log(`Loading tile layer for ${layerName}...`);
      isLoadingTiles.current = true;

      try {
        // Store app reference
        appRef.current = app;

        // Clear any existing tiles
        clearTiles();

        // Make sure the stage has sortableChildren enabled
        app.stage.sortableChildren = true;

        // Fetch tile data for the layer
        console.log(`Fetching tile data for ${layerName}...`);
        const res = await fetch("https://api.metafarmers.io/tiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layer: layerName }),
        });

        const data = await res.json();
        const items = data.data || [];
        console.log(`Received ${items.length} tiles for layer ${layerName}`);

        // Place each tile
        let placedCount = 0;
        for (const item of items) {
          const tileId = item.tile;
          const x = item.x;
          const y = item.y;
          const rotation = item.rotation || 0;

          if (!tileCache.current[tileId] || !tileCache.current[tileId].texture) {
            console.warn(`Missing texture for tile ${tileId}, skipping`);
            continue;
          }

          try {
            // Create the sprite with the texture
            const sprite = new PIXI.Sprite(tileCache.current[tileId].texture);
            
            // Set basic properties
            sprite.anchor.set(0.5, 0.5);
            sprite.width = TILE_SIZE;
            sprite.height = TILE_SIZE;
            sprite.x = x * TILE_SIZE + sprite.width / 2;
            sprite.y = y * TILE_SIZE + sprite.height / 2;
            sprite.rotation = (rotation * Math.PI) / 180;
            
            // Set metadata
            sprite.metaTileX = x;
            sprite.metaTileY = y;
            sprite.metaTileName = tileId;
            sprite.metaRotation = rotation;
            
            // Set visibility properties - make sure zIndex is lower than objects (which use 10)
            sprite.zIndex = 5;
            sprite.visible = true;
            sprite.alpha = 1;
            
            // Add directly to the stage
            app.stage.addChild(sprite);
            
            // Track the sprite for future reference
            placedTiles.current.push(sprite);
            placedCount++;

            if (placedCount % 20 === 0 || placedCount === items.length) {
              console.log(`Placed ${placedCount}/${items.length} tiles for layer ${layerName}`);
            }
          } catch (tileErr) {
            console.error(`Error placing tile ${tileId}:`, tileErr);
          }
        }
        
        // Force a render to ensure all tiles are visible
        if (app.renderer) {
          app.renderer.render(app.stage);
        }

        console.log(`Successfully loaded ${placedCount} tiles for layer ${layerName}`);
        setSpriteUpdateCounter((prev) => prev + 1);
      } catch (err) {
        console.error(`Error loading tile layer ${layerName}:`, err);
      } finally {
        isLoadingTiles.current = false;
      }
    },
    [clearTiles, placedTiles, setSpriteUpdateCounter, tileCache]
  );

  /**
   * Place a tile on the grid at the specified position
   */
  const placeTileOnGrid = useCallback(
    (app, texture, gridX, gridY, tileName = null, rotation = 0) => {
      if (!app || !texture) {
        console.error(`Cannot place tile: app or texture is missing for ${tileName}`);
        return null;
      }

      try {
        // Create the sprite with the texture
        const sprite = new PIXI.Sprite(texture);
        
        // Set basic properties
        sprite.anchor.set(0.5, 0.5);
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        sprite.x = gridX * TILE_SIZE + sprite.width / 2;
        sprite.y = gridY * TILE_SIZE + sprite.height / 2;
        sprite.rotation = (rotation * Math.PI) / 180;
        
        // Set metadata
        sprite.metaTileX = gridX;
        sprite.metaTileY = gridY;
        sprite.metaTileName = tileName;
        sprite.metaRotation = rotation;
        
        // Set visibility properties - make sure zIndex is lower than objects (which use 10)
        sprite.zIndex = 5;
        sprite.visible = true;
        sprite.alpha = 1;
        
        // Make sure the stage has sortableChildren enabled
        if (!app.stage.sortableChildren) {
          app.stage.sortableChildren = true;
        }
        
        // Add directly to the stage for better visibility
        app.stage.addChild(sprite);
        
        // Force a render update to make sure the sprite is visible
        if (app.renderer) {
          app.renderer.render(app.stage);
        }
        
        console.log(
          `Placed tile: tileName=${tileName}, gridX=${gridX}, gridY=${gridY}, ` +
          `metaTileX=${sprite.metaTileX}, metaTileY=${sprite.metaTileY}, ` +
          `x=${sprite.x}, y=${sprite.y}, visible=${sprite.visible}`
        );
        return sprite;
      } catch (err) {
        console.error(`Error placing tile ${tileName} at (${gridX}, ${gridY}):`, err);
        return null;
      }
    },
    []
  );

  /**
   * Place a single tile on the grid
   */
  const placeSingleTile = useCallback(
    async (app, tileName, gridX, gridY, rotation = 0) => {
      if (!app || !tileName || !currentLayer) return null;

      try {
        // Store app reference
        appRef.current = app;

        // Send request to place tile
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
          if (tileCache.current[tileName] && tileCache.current[tileName].texture) {
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
