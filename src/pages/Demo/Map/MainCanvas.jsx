import React, { useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import usePixiApp from "./usePixiApp";
import useMapInteractions from "./useMapInteractions";
import useLayerLoader from "./useLayerLoader";
import { TILE_SIZE } from "./constants";

const MainCanvas = ({
  pixiContainer,
  textureCache,
  tileCache,
  placedSprites,
  placedTiles,
  currentLayer,
  setSelectedCell,
  setTextureCanvases,
  setTileCanvases, 
  setSpriteUpdateCounter,
  loading,
  texturesLoaded,
  tilesLoaded,
  fetchTexturesAndLayers,
  fetchTiles,
  loadTileLayer,
  placeSingleTile,
  setGridBounds,
  layerDimensions,
  setObjectPropertiesCache,
  setAssetsPlaced,
  setLoadingMessage,
  setLoading
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
      fetchTiles(app);
    }
  }, [app, fetchTexturesAndLayers, fetchTiles]);

  // Track the last layer we fetched properties for to avoid duplicate calls
  const lastFetchedLayer = useRef(null);
  
  // Cache object properties when loading a layer
  const fetchAndCacheObjectProperties = useCallback(async (layerName) => {
    // Skip if we've already fetched properties for this layer
    if (lastFetchedLayer.current === layerName) {
      console.log(`Skipping duplicate property fetch for layer: ${layerName}`);
      return [];
    }
    
    lastFetchedLayer.current = layerName;
    
    try {
      const res = await fetch("https://api.metafarmers.io/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layer: layerName }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      const items = data.data || [];
      
      // Create a cache of object properties indexed by a composite key
      const propertiesCache = {};
      
      items.forEach(item => {
        const compositeKey = `${item.object}#${item.x}#${item.y}`;
        propertiesCache[compositeKey] = item;
      });
      
      // Store the cache
      setObjectPropertiesCache(propertiesCache);
      console.log("Object properties cached for layer:", layerName);
      
      return items;
    } catch (err) {
      if (!handleNetworkError(err, "Error fetching object properties")) {
        // If error wasn't fully handled (not too many retries yet), return empty array
        return [];
      }
      // If error was handled (too many retries), force reset loading state
      resetLoadingState();
      return [];
    }
  }, [setObjectPropertiesCache]);

  // Track if we're currently loading a layer to prevent duplicate loads
  const isLoadingLayer = useRef(false);
  // Track loading attempts to prevent infinite retries
  const loadingAttempts = useRef(0);
  // Track if the layer has been successfully loaded to prevent reloading
  const layerLoadedSuccessfully = useRef(false);
  // Track if tile layer has been loaded to prevent reloading
  const tileLayerLoaded = useRef(false);
  // Track the previous layer to detect changes
  const previousLayer = useRef(null);
  
  // Function to reset loading state in case of errors
  const resetLoadingState = () => {
    isLoadingLayer.current = false;
    loadingAttempts.current = 0;
    layerLoadedSuccessfully.current = false;
    tileLayerLoaded.current = false;
    setLoading(false);
  };
  
  // Function to handle network errors
  const handleNetworkError = (err, errorType) => {
    console.error(`${errorType}:`, err);
    setLoadingMessage(`Error: ${errorType}. Retrying...`);
    
    // Increment attempt counter
    loadingAttempts.current += 1;
    
    // If we've tried too many times, give up
    if (loadingAttempts.current >= 3) {
      setLoadingMessage(`Failed to load after multiple attempts. Please refresh the page.`);
      setTimeout(() => {
        resetLoadingState();
      }, 3000);
      return true; // Error was handled
    }
    return false; // Continue with retries
  };
  
  // Layer loading process
  useEffect(() => {
    const loadLayerData = async () => {
      // Skip if no layer selected or already loading
      if (!currentLayer || isLoadingLayer.current) return;
      
      // If we've switched layers, we need to reload even if previously loaded
      if (previousLayer.current !== currentLayer) {
        layerLoadedSuccessfully.current = false;
      }
      
      // Skip if already successfully loaded the current layer
      if (layerLoadedSuccessfully.current) return;
      
      try {
        console.log(`Starting to load layer: ${currentLayer}`);
        isLoadingLayer.current = true;
        loadingAttempts.current = 0;
        setLoading(true);
        setLoadingMessage(`Loading layer: ${currentLayer}...`);
        
        // Clear any existing objects first
        placedSprites.current = [];
        
        // Then load objects (foreground layer) and cache their properties
        setLoadingMessage(`Fetching object properties for ${currentLayer}...`);
        const items = await fetchAndCacheObjectProperties(currentLayer);
        
        setLoadingMessage(`Placing ${items.length} objects on grid for ${currentLayer}...`);
        await loadLayer(currentLayer);
        
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
        
        // Wait for tile layer to be fully loaded before completing
        setLoadingMessage(`Finalizing map rendering for ${currentLayer}... (${placedSprites.current.length} objects placed)`);
        
        // Use a single setTimeout to give the browser time to render everything
        setTimeout(() => {
          // Set assets as placed
          setAssetsPlaced(true);
          // Mark layer as successfully loaded
          layerLoadedSuccessfully.current = true;
          // Reset loading flag when complete
          isLoadingLayer.current = false;
          // Show success message and hide loading indicator
          setLoadingMessage(`Map loaded successfully! (${placedSprites.current.length} objects, ${placedTiles.current.length} tiles)`);
          // Force loading state to false to ensure loading indicator disappears
          setLoading(false);
          console.log(`Layer ${currentLayer} loaded successfully!`);
          
          // Add an extra check to ensure loading indicator is hidden after a short delay
          setTimeout(() => {
            if (layerLoadedSuccessfully.current) {
              setLoading(false);
            }
          }, 500);
        }, 1000); // Give a second for everything to render
      } catch (error) {
        console.error('Error in layer loading process:', error);
        if (!handleNetworkError(error, "Error loading map data")) {
          // If not too many retries, just reset the loading flags
          isLoadingLayer.current = false;
        } else {
          // If too many retries, fully reset loading state
          resetLoadingState();
        }
      }
    };
    
    loadLayerData();
  }, [currentLayer, app, tilesLoaded, previousLayer]);
  
  // Handle layer changes and reset state appropriately
  useEffect(() => {
    // If the layer has changed (not just initial load)
    if (previousLayer.current !== null && previousLayer.current !== currentLayer) {
      console.log(`Layer changed from ${previousLayer.current} to ${currentLayer}, resetting loading state`);
      
      // Force a complete reload by resetting all loading flags
      isLoadingLayer.current = false;
      layerLoadedSuccessfully.current = false;
      tileLayerLoaded.current = false;
      loadingAttempts.current = 0;
      
      // Reset placed sprites and tiles arrays
      placedSprites.current = [];
      placedTiles.current = [];
      
      // Clear the stage for the new layer
      if (app && app.stage) {
        console.log(`Clearing stage for layer switch from ${previousLayer.current} to ${currentLayer}`);
        
        // Remove all existing sprites and graphics
        while(app.stage.children.length > 0) { 
          const child = app.stage.getChildAt(0);
          app.stage.removeChild(child);
          if (child.destroy) {
            child.destroy({ children: true });
          }
        }
        
        // Reset the stage properties
        app.stage.sortableChildren = true;
        
        // Force a renderer update and ensure stage is properly set up
        if (app.renderer) {
          // Make sure the stage has sortableChildren enabled
          app.stage.sortableChildren = true;
          
          // Force a render to ensure changes are visible
          app.renderer.render(app.stage);
          
          // Add a small delay and render again to ensure everything is visible
          setTimeout(() => {
            if (app && app.renderer) {
              app.renderer.render(app.stage);
            }
          }, 50);
        }
        
        console.log(`Stage cleared successfully for new layer ${currentLayer}`);
        
        // Force loading to true to show the loading indicator
        setLoading(true);
        setLoadingMessage(`Switching to layer: ${currentLayer}...`);
        
        // Force loading to start again for the new layer
        setTimeout(() => {
          console.log(`Triggering immediate load of layer ${currentLayer} after switch`);
          // Reset loading flags to force the layer loading effect to run again
          layerLoadedSuccessfully.current = false;
          tileLayerLoaded.current = false;
          isLoadingLayer.current = false;
          
          // Force a re-render of the app stage
          if (app && app.renderer && app.stage) {
            console.log('Forcing renderer update after layer switch');
            app.renderer.render(app.stage);
            
            // Add a second render after a short delay
            setTimeout(() => {
              if (app && app.renderer && app.stage) {
                console.log('Forcing second renderer update after layer switch');
                app.renderer.render(app.stage);
              }
            }, 200);
          }
        }, 100);
      }
    } else if (!currentLayer && isLoadingLayer.current) {
      // Reset loading flag if no layer is selected
      console.log('No layer selected, resetting loading state');
      isLoadingLayer.current = false;
      layerLoadedSuccessfully.current = false;
      tileLayerLoaded.current = false;
      setLoading(false);
    }
    
    // Update the previous layer reference
    previousLayer.current = currentLayer;
  }, [currentLayer, app]);
  
  // Add a separate effect to reload tile layer when tile canvases are ready
  useEffect(() => {
    // Skip if no layer selected or already loading
    if (!currentLayer || isLoadingLayer.current) return;
    
    // Force tile layer to be reloaded when switching layers
    if (previousLayer.current !== currentLayer) {
      console.log(`Layer changed, forcing tile layer reload for ${currentLayer}`);
      tileLayerLoaded.current = false;
    }
    
    // Skip if tile layer is already loaded for the current layer
    if (tileLayerLoaded.current) {
      console.log(`Tile layer already loaded for ${currentLayer}, skipping reload`);
      return;
    }
    
    console.log(`Attempting to load tile layer for ${currentLayer}`);
    
    // Always attempt to load the tile layer when we have the app
    if (app && app.stage) {
      // Check if we have generated canvases for the tiles
      let tileCanvasesGenerated = true;
      
      // Check each tile texture
      for (const entry of Object.values(tileCache.current)) {
        if (!entry.texture || !entry.texture.baseTexture || !entry.texture.baseTexture.valid) {
          tileCanvasesGenerated = false;
          console.log('Some tile textures are not ready yet, waiting...');
          break;
        }
      }
      
      if (tileCanvasesGenerated) {
        console.log(`Tile canvases are ready, loading tile layer for ${currentLayer}`);
        setLoadingMessage(`Rendering tile layer for ${currentLayer}...`);
        
        try {
          // Ensure the stage is ready for new tiles
          if (app && app.stage) {
            app.stage.sortableChildren = true;
            
            // Force a renderer update before loading tiles
            if (app.renderer) {
              app.renderer.render(app.stage);
            }
          }
          
          // Clear any existing tiles first
          placedTiles.current = [];
          
          // Add a small delay to ensure the stage is ready
          setTimeout(() => {
            // Load the tile layer
            loadTileLayer(app, currentLayer);
            
            // Force another render after loading tiles
            if (app && app.renderer) {
              app.renderer.render(app.stage);
            }
            
            tileLayerLoaded.current = true;
            console.log(`Tile layer for ${currentLayer} loaded successfully`);
          }, 100);
          
          
          // Ensure loading state is updated properly
          if (layerLoadedSuccessfully.current) {
            // If the main layer loading is already complete, make sure loading indicator is hidden
            setTimeout(() => {
              setLoading(false);
            }, 500);
          }
        } catch (error) {
          console.error('Error loading tile layer:', error);
          // Try again later
          tileLayerLoaded.current = false;
        }
      }
    }
  }, [currentLayer, tilesLoaded, app, tileCache]);

  useEffect(() => {
    if (!app || !texturesLoaded || Object.keys(textureCache.current).length === 0) {
      console.log("Object canvas generation skipped: app, texturesLoaded, or textureCache not ready", {
        appExists: !!app,
        texturesLoaded,
        textureCount: Object.keys(textureCache.current).length,
      });
      return;
    }
    
    // Update loading message
    setLoadingMessage(`Generating previews for ${Object.keys(textureCache.current).length} objects...`);
    // Force loading state to be true
    setLoading(true);

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

    const checkTextures = async (attempt = 1, maxAttempts = 5) => {
      const allValid = Object.values(textureCache.current).every(
        (entry) => entry.texture.baseTexture.valid
      );
      if (!allValid) {
        console.log(`Waiting for textures to load (attempt ${attempt}/${maxAttempts})...`);
        if (attempt < maxAttempts) {
          setTimeout(() => checkTextures(attempt + 1, maxAttempts), 500);
        } else {
          console.error("Failed to generate canvases: Textures not loaded after max attempts");
          // Proceed anyway to avoid getting stuck
          generateCanvases();
        }
        return;
      }

      // Always proceed after one attempt to avoid loops
      await generateCanvases();
    };

    checkTextures();
  }, [app, texturesLoaded, textureCache, setTextureCanvases, setLoadingMessage]);

  // Generate tile canvases
  useEffect(() => {
    if (!app || !tilesLoaded || Object.keys(tileCache.current).length === 0) {
      console.log("Tile canvas generation skipped: app, tilesLoaded, or tileCache not ready", {
        appExists: !!app,
        tilesLoaded,
        tileCount: Object.keys(tileCache.current).length,
      });
      return;
    }
    
    // Update loading message
    setLoadingMessage(`Generating previews for ${Object.keys(tileCache.current).length} tiles...`);
    // Force loading state to be true
    setLoading(true);

    console.log("Attempting tile canvas generation, renderer state:", {
      appExists: !!app,
      gl: !!app.renderer.gl,
      contextLost: app.renderer.gl?.isContextLost(),
    });

    const generateTileCanvases = async () => {
      const canvases = {};
      let successCount = 0;

      // Try WebGL-based canvas generation
      let webglSuccess = false;
      if (app.renderer.gl && !app.renderer.gl.isContextLost()) {
        for (const key of Object.keys(tileCache.current)) {
          const texture = tileCache.current[key].texture;
          if (!texture || !texture.baseTexture.valid) {
            console.warn(`Texture for tile ${key} is invalid or not loaded`);
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
              console.log(`Generated WebGL canvas for tile ${key}`);
            } else {
              console.error(`Failed to generate canvas for tile ${key}: Canvas is null`);
            }
          } catch (err) {
            console.error(`Error generating WebGL canvas for tile ${key}:`, err);
          }
        }
      } else {
        console.warn("Cannot generate WebGL canvases for tiles: WebGL context is lost or unavailable");
      }

      // Fallback to HTML5 canvas
      console.log("Attempting HTML5 canvas fallback for remaining tile textures");
      for (const key of Object.keys(tileCache.current)) {
        if (canvases[key]) continue;
        const texture = tileCache.current[key].texture;
        if (!texture || !texture.baseTexture.valid) {
          console.warn(`Texture for tile ${key} is invalid or not loaded`);
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
            img.onerror = () => reject(new Error(`Failed to load image for tile ${key}`));
          });

          ctx.drawImage(img, 0, 0, 48, 48);
          canvases[key] = tempCanvas;
          successCount++;
          console.log(`Generated HTML5 canvas for tile ${key}`);
        } catch (err) {
          console.error(`Error generating HTML5 canvas for tile ${key}:`, err);
        }
      }

      console.log(`Generated ${successCount} canvas previews for ${Object.keys(tileCache.current).length} tile textures`);
      setTileCanvases(canvases);
      return successCount > 0;
    };

    const checkTileTextures = async (attempt = 1, maxAttempts = 5) => {
      const allValid = Object.values(tileCache.current).every(
        (entry) => entry.texture.baseTexture.valid
      );
      if (!allValid) {
        console.log(`Waiting for tile textures to load (attempt ${attempt}/${maxAttempts})...`);
        if (attempt < maxAttempts) {
          setTimeout(() => checkTileTextures(attempt + 1, maxAttempts), 500);
        } else {
          console.error("Failed to generate tile canvases: Textures not loaded after max attempts");
          // Proceed anyway to avoid getting stuck
          generateTileCanvases();
        }
        return;
      }

      // Always proceed after one attempt to avoid loops
      await generateTileCanvases();
    };

    checkTileTextures();
  }, [app, tilesLoaded, tileCache, setTileCanvases, setLoadingMessage]);

  useMapInteractions({
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