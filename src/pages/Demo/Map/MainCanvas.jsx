import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import usePixiApp from "./usePixiApp";
import useMapInteractions from "./useMapInteractions";
import useLayerLoader from "./useLayerLoader";
import { TILE_SIZE } from "./constants";

const MainCanvas = ({
  pixiContainer,
  textureCache,
  placedSprites,
  currentLayer,
  setSelectedCell,
  setTextureCanvases, 
  setSpriteUpdateCounter,
  loading,
  texturesLoaded,
  fetchTexturesAndLayers,
  setGridBounds,
  layerDimensions
}) => {
  const hoverBorder = useRef(null);
  const app = usePixiApp({
    container: pixiContainer,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x222222,
    backgroundAlpha: 1,
  });

  const { loadLayer } = useLayerLoader({
    app,
    textureCache,
    placedSprites,
    setSpriteUpdateCounter,
  });

  const getCurrentLayerDimensions = () => {
    const layerData = layerDimensions.find(layer => layer.layer === currentLayer);
    return layerData ? { width: layerData.width, height: layerData.height } : { width: 30, height: 30 };
  };

  useEffect(() => {
    if (!app) return;

    const drawGrid = () => {
      // Clear any existing grid graphics
      const children = app.stage.children.slice();
      for (const child of children) {
        if (child instanceof PIXI.Graphics && child !== hoverBorder.current) {
          app.stage.removeChild(child);
          child.destroy();
        }
      }

      const { width, height } = getCurrentLayerDimensions();
      const gridGraphics = new PIXI.Graphics();
      gridGraphics.beginFill(0xf0f0f0);
      gridGraphics.drawRect(0, 0, width * TILE_SIZE, height * TILE_SIZE);
      gridGraphics.endFill();
      gridGraphics.lineStyle(1, 0x444444, 1);
      for (let i = 0; i <= width; i++) {
        gridGraphics.moveTo(i * TILE_SIZE, 0);
        gridGraphics.lineTo(i * TILE_SIZE, height * TILE_SIZE);
      }
      for (let i = 0; i <= height; i++) {
        gridGraphics.moveTo(0, i * TILE_SIZE);
        gridGraphics.lineTo(width * TILE_SIZE, i * TILE_SIZE);
      }
      app.stage.addChild(gridGraphics);
      if (!hoverBorder.current) {
        hoverBorder.current = new PIXI.Graphics();
        app.stage.addChild(hoverBorder.current);
      }

      // Center the stage
      const gridWidth = width * TILE_SIZE;
      const gridHeight = height * TILE_SIZE;
      const canvasWidth = app.renderer.width;
      const canvasHeight = app.renderer.height;
      app.stage.x = (canvasWidth - gridWidth) / 2;
      app.stage.y = (canvasHeight - gridHeight) / 2;
      console.log(`Stage centered at x: ${app.stage.x}, y: ${app.stage.y}, canvas: ${canvasWidth}x${canvasHeight}`);
    };

    if (!loading) {
      drawGrid();
    }
  }, [app, loading, currentLayer, layerDimensions]);

  useEffect(() => {
    if (!app || loading) return;

    const centerStage = () => {
      const { width, height } = getCurrentLayerDimensions();
      const gridWidth = width * TILE_SIZE;
      const gridHeight = height * TILE_SIZE;
      const canvasWidth = app.renderer.width;
      const canvasHeight = app.renderer.height;
      
      // Reset zoom to ensure the full grid is visible if possible
      const minDimension = Math.min(canvasWidth / gridWidth, canvasHeight / gridHeight);
      const newScale = Math.min(1, minDimension * 0.9); // Slightly less than full fit to give some margin
      app.stage.scale.set(newScale);
      
      // Center the stage after zoom adjustment
      app.stage.x = (canvasWidth - gridWidth * newScale) / 2;
      app.stage.y = (canvasHeight - gridHeight * newScale) / 2;
      console.log(`Layer load centering at x: ${app.stage.x}, y: ${app.stage.y}, scale: ${newScale}, canvas: ${canvasWidth}x${canvasHeight}`);
    };

    centerStage();
  }, [app, currentLayer, loading, layerDimensions]);

  useEffect(() => {
    if (app) {
      fetchTexturesAndLayers(app);
    }
  }, [app, fetchTexturesAndLayers]);

  useEffect(() => {
    if (currentLayer && !loading) {
      loadLayer(currentLayer).then(() => {
        // Log sprite metadata
        console.log(
          "Placed sprites metadata:",
          placedSprites.current.map((sprite) => ({
            objectName: sprite.metaObjectName,
            metaTileX: sprite.metaTileX,
            metaTileY: sprite.metaTileY,
            x: sprite.x,
            y: sprite.y,
          }))
        );

        // Calculate the actual grid bounds based on placed sprites
        let maxX = 0;
        let maxY = 0;
        placedSprites.current.forEach((sprite) => {
          const tileX = sprite.metaTileX;
          const tileY = sprite.metaTileY;
          if (typeof tileX === "number" && !isNaN(tileX) && tileX >= 0 && tileX >= maxX) {
            maxX = tileX + 1; // Add 1 to account for tile width
          }
          if (typeof tileY === "number" && !isNaN(tileY) && tileY >= 0 && tileY >= maxY) {
            maxY = tileY + 1; // Add 1 to account for tile height
          }
        });

        // Fallback to layer dimensions if no sprites or invalid bounds
        const { width, height } = getCurrentLayerDimensions();
        maxX = maxX > 0 ? Math.min(maxX, width) : width;
        maxY = maxY > 0 ? Math.min(maxY, height) : height;
        setGridBounds({ width: maxX, height: maxY });
        console.log(`Calculated grid bounds: ${maxX}x${maxY}`);
      });
    }
  }, [currentLayer, loading, loadLayer, placedSprites, setGridBounds, layerDimensions]);

  useEffect(() => {
    if (!app || !texturesLoaded || Object.keys(textureCache.current).length === 0) {
      console.log("Canvas generation skipped: app, texturesLoaded, or textureCache not ready", {
        appExists: !!app,
        texturesLoaded,
        textureCount: Object.keys(textureCache.current).length,
      });
      return;
    }

    console.log("Attempting canvas generation, renderer state:", {
      appExists: !!app,
      gl: !!app.renderer.gl,
      contextLost: app.renderer.gl?.isContextLost(),
    });

    const generateCanvases = async () => {
      const canvases = {};
      let successCount = 0;

      // Try WebGL-based canvas generation
      let webglSuccess = false;
      if (app.renderer.gl && !app.renderer.gl.isContextLost()) {
        for (const key of Object.keys(textureCache.current)) {
          const texture = textureCache.current[key].texture;
          if (!texture || !texture.baseTexture.valid) {
            console.warn(`Texture for ${key} is invalid or not loaded`);
            continue;
          }
          try {
            const sprite = new PIXI.Sprite(texture);
            sprite.width = 48;
            sprite.height = 48;
            const canvas = app.renderer.extract.canvas(sprite);
            sprite.destroy();
            if (canvas) {
              canvases[key] = canvas;
              successCount++;
              webglSuccess = true;
              console.log(`Generated WebGL canvas for ${key}`);
            } else {
              console.error(`Failed to generate canvas for ${key}: Canvas is null`);
            }
          } catch (err) {
            console.error(`Error generating WebGL canvas for ${key}:`, err);
          }
        }
      } else {
        console.warn("Cannot generate WebGL canvases: WebGL context is lost or unavailable");
      }

      // Fallback to HTML5 canvas
      console.log("Attempting HTML5 canvas fallback for remaining textures");
      for (const key of Object.keys(textureCache.current)) {
        if (canvases[key]) continue;
        const texture = textureCache.current[key].texture;
        if (!texture || !texture.baseTexture.valid) {
          console.warn(`Texture for ${key} is invalid or not loaded`);
          continue;
        }
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = texture.baseTexture.resource.source.src;
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = 48;
          tempCanvas.height = 48;
          const ctx = tempCanvas.getContext("2d");

          await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image for ${key}`));
          });

          ctx.drawImage(img, 0, 0, 48, 48);
          canvases[key] = tempCanvas;
          successCount++;
          console.log(`Generated HTML5 canvas for ${key}`);
        } catch (err) {
          console.error(`Error generating HTML5 canvas for ${key}:`, err);
        }
      }

      console.log(`Generated ${successCount} canvas previews for ${Object.keys(textureCache.current).length} textures`);
      setTextureCanvases(canvases);
      return successCount > 0;
    };

    const checkTextures = async (attempt = 1, maxAttempts = 10) => {
      const allValid = Object.values(textureCache.current).every(
        (entry) => entry.texture.baseTexture.valid
      );
      if (!allValid) {
        console.log(`Waiting for textures to load (attempt ${attempt}/${maxAttempts})...`);
        if (attempt < maxAttempts) {
          setTimeout(() => checkTextures(attempt + 1, maxAttempts), 500);
        } else {
          console.error("Failed to generate canvases: Textures not loaded after max attempts");
        }
        return;
      }

      if (!(await generateCanvases()) && attempt < maxAttempts) {
        console.log(`Retrying canvas generation (attempt ${attempt}/${maxAttempts})...`);
        setTimeout(() => checkTextures(attempt + 1, maxAttempts), 500);
      }
    };

    checkTextures();
  }, [app, texturesLoaded, textureCache, setTextureCanvases]);

  useMapInteractions({
    app,
    pixiContainer,
    hoverBorder,
    placedSprites,
    currentLayer,
    textureCache,
    setSelectedCell,
    setSpriteUpdateCounter,
  });

  return (
    <div
      ref={pixiContainer}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        display: loading ? "none" : "block",
      }}
    />
  );
};

export default MainCanvas;