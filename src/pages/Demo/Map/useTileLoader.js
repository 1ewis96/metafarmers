import { useCallback } from "react";
import * as PIXI from "pixi.js";

const useTileLoader = ({
  setLoading,
  setLoadingProgress,
  setTilesLoaded,
  tileCache,
}) => {
  const fetchTiles = useCallback(
    async (pixiApp) => {
      if (!pixiApp) return;

      try {
        const listRes = await fetch("https://api.metafarmers.io/list/tiles/");
        const listData = await listRes.json();
        const tileIds = listData.tiles || [];
        let loadedCount = 0;
        const totalCount = tileIds.length;

        console.log(`Fetching ${totalCount} tiles`);

        for (const id of tileIds) {
          const tileRes = await fetch(`https://api.metafarmers.io/tiles/${id}`);
          const tileData = await tileRes.json();
          const texture = PIXI.Texture.from(tileData.spriteSheet.url);
          await new Promise((resolve) => {
            texture.baseTexture.on("loaded", () => {
              console.log(`Tile texture ${id} loaded, valid: ${texture.baseTexture.valid}`);
              resolve();
            });
            texture.baseTexture.on("error", (err) => {
              console.error(`Error loading tile texture ${id}:`, err);
              resolve();
            });
            if (texture.baseTexture.valid) resolve();
          });

          tileCache.current[id] = { texture, data: tileData };
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / totalCount) * 100));
        }

        console.log("Tile cache populated:", Object.keys(tileCache.current));
        setTilesLoaded(true);
      } catch (error) {
        console.error("Error loading tiles:", error);
        setTilesLoaded(false);
      }
    },
    [setLoadingProgress, setTilesLoaded, tileCache]
  );

  return { fetchTiles };
};

export default useTileLoader;
