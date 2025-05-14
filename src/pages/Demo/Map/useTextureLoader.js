import { useCallback } from "react";
import * as PIXI from "pixi.js";

const useTextureLoader = ({
  setLoading,
  setLoadingProgress,
  setTexturesLoaded,
  textureCache,
  setAvailableLayers,
  setCurrentLayer,
  setLayerDimensions
}) => {
  const fetchTexturesAndLayers = useCallback(
    async (pixiApp) => {
      if (!pixiApp) return;

      try {
        const listRes = await fetch("https://api.metafarmers.io/list/objects/");
        const listData = await listRes.json();
        const objectIds = listData.objects || [];
        let loadedCount = 0;
        const totalCount = objectIds.length;

        console.log(`Fetching ${totalCount} textures`);

        for (const id of objectIds) {
          const objRes = await fetch(`https://api.metafarmers.io/object/${id}`);
          const objData = await objRes.json();
          const texture = PIXI.Texture.from(objData.spriteSheet.url);
          await new Promise((resolve) => {
            texture.baseTexture.on("loaded", () => {
              console.log(`Texture ${id} loaded, valid: ${texture.baseTexture.valid}`);
              resolve();
            });
            texture.baseTexture.on("error", (err) => {
              console.error(`Error loading texture ${id}:`, err);
              resolve();
            });
            if (texture.baseTexture.valid) resolve();
          });

          textureCache.current[id] = { texture, data: objData };
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / totalCount) * 100));
        }

        console.log("Texture cache populated:", Object.keys(textureCache.current));
        setLoading(false);
        setTexturesLoaded(true);

        const res = await fetch("https://api.metafarmers.io/list/layers");
        const data = await res.json();
        const fullLayers = data.layers || [];
        const layerNames = fullLayers.map((l) => l.layer);
        setAvailableLayers(layerNames);
        setLayerDimensions(fullLayers);
        if (layerNames.length > 0) {
          setCurrentLayer(layerNames[0]);
        }
      } catch (error) {
        console.error("Error loading textures or layers:", error);
        setLoading(false);
        setTexturesLoaded(false);
      }
    },
    [setLoading, setLoadingProgress, setTexturesLoaded, textureCache, setAvailableLayers, setCurrentLayer, setLayerDimensions]
  );

  return { fetchTexturesAndLayers };
};

export default useTextureLoader;