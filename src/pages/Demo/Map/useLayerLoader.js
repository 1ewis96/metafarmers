import { useCallback } from "react";
import * as PIXI from "pixi.js";
import { TILE_SIZE } from "./constants";

const useLayerLoader = ({ app, textureCache, placedSprites, setSpriteUpdateCounter }) => {
  const clearSprites = useCallback(() => {
    if (!placedSprites.current.length) return;
    placedSprites.current.forEach((sprite) => {
      app.stage.removeChild(sprite);
      sprite.destroy();
    });
    placedSprites.current = [];
    setSpriteUpdateCounter((prev) => prev + 1);
  }, [app, placedSprites, setSpriteUpdateCounter]);

  const placeObjectOnGrid = useCallback(
    (texture, gridX, gridY, width = 1, height = 1, objectName = null, rotation = 0) => {
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
      sprite.zIndex = 10; // Ensure objects are always on top of tiles
      app.stage.addChild(sprite);
      console.log(
        `Placed sprite: objectName=${objectName}, gridX=${gridX}, gridY=${gridY}, ` +
        `metaTileX=${sprite.metaTileX}, metaTileY=${sprite.metaTileY}, ` +
        `x=${sprite.x}, y=${sprite.y}`
      );
      return sprite;
    },
    [app]
  );

  const loadLayer = useCallback(
    async (layerName) => {
      if (!layerName || !app) return;

      clearSprites();

      try {
        const res = await fetch("https://api.metafarmers.io/objects", {
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
        console.log(`Loaded layer ${layerName}, placedSprites count: ${placedSprites.current.length}`);
        setSpriteUpdateCounter((prev) => prev + 1);
      } catch (err) {
        console.error("Error loading layer:", err);
      }
    },
    [app, textureCache, placedSprites, setSpriteUpdateCounter, clearSprites, placeObjectOnGrid]
  );

  return { loadLayer, clearSprites, placeObjectOnGrid };
};

export default useLayerLoader;