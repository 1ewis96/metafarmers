import React, { useRef, useEffect } from "react";
import * as PIXI from "pixi.js";
import { TILE_SIZE } from "./constants";

const MINIMAP_SIZE = 120; // Size of the minimap
const MINIMAP_BORDER = 2; // Border width

const Minimap = ({
  minimapContainer,
  mainAppRef,
  placedSprites,
  placedTiles,
  spriteUpdateCounter,
  loading,
  currentLayer,
  gridBounds
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!minimapContainer.current || loading || !currentLayer) return;

    // Create a canvas element for the minimap
    const canvas = document.createElement("canvas");
    canvas.width = MINIMAP_SIZE;
    canvas.height = MINIMAP_SIZE;
    minimapContainer.current.innerHTML = "";
    minimapContainer.current.appendChild(canvas);
    canvasRef.current = canvas;

    drawMinimap(canvas);
  }, [currentLayer, loading, gridBounds, spriteUpdateCounter]);

  useEffect(() => {
    if (!canvasRef.current || !mainAppRef.current?.__PIXI_APP__) return;
    const mainApp = mainAppRef.current.__PIXI_APP__;
    const ticker = new PIXI.Ticker();
    ticker.add(() => updateViewport(mainApp, canvasRef.current));
    ticker.start();

    return () => {
      ticker.stop();
      ticker.destroy();
    };
  }, []);

  const drawMinimap = (canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Draw background
    ctx.fillStyle = "#222222";
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Always use the full minimap area regardless of grid aspect ratio
    const mapWidth = MINIMAP_SIZE - (MINIMAP_BORDER * 2);
    const mapHeight = MINIMAP_SIZE - (MINIMAP_BORDER * 2);
    const offsetX = MINIMAP_BORDER;
    const offsetY = MINIMAP_BORDER;
    
    // Draw grid background
    ctx.fillStyle = "#444444";
    ctx.fillRect(offsetX, offsetY, mapWidth, mapHeight);
    
    // Find the actual min and max coordinates of all placed items to determine bounds
    let minX = 0;
    let minY = 0;
    let maxX = gridBounds.width;
    let maxY = gridBounds.height;
    
    // Draw grid background
    ctx.fillStyle = "#444444";
    ctx.fillRect(offsetX, offsetY, mapWidth, mapHeight);
    
    // Draw grid lines if not too dense
    if (gridBounds.width <= 50 && gridBounds.height <= 50) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 0.5;
      
      // Vertical grid lines
      for (let i = 0; i <= gridBounds.width; i++) {
        const x = offsetX + (i / gridBounds.width) * mapWidth;
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + mapHeight);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let i = 0; i <= gridBounds.height; i++) {
        const y = offsetY + (i / gridBounds.height) * mapHeight;
        ctx.beginPath();
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX + mapWidth, y);
        ctx.stroke();
      }
    }
    
    // Draw tiles (as small colored squares)
    if (placedTiles && placedTiles.current) {
      ctx.fillStyle = "rgba(100, 149, 237, 0.8)"; // Cornflower blue
      placedTiles.current.forEach(tile => {
        if (typeof tile.metaTileX === 'number' && typeof tile.metaTileY === 'number') {
          // Map grid coordinates to minimap coordinates
          const normalizedX = tile.metaTileX / gridBounds.width;
          const normalizedY = tile.metaTileY / gridBounds.height;
          
          const tileX = offsetX + normalizedX * mapWidth;
          const tileY = offsetY + normalizedY * mapHeight;
          
          const tileSize = Math.max(3, Math.min(mapWidth / gridBounds.width, mapHeight / gridBounds.height));
          
          ctx.fillRect(
            tileX,
            tileY,
            tileSize,
            tileSize
          );
        }
      });
    }
    
    // Draw objects (as small colored squares)
    if (placedSprites && placedSprites.current) {
      ctx.fillStyle = "rgba(255, 99, 71, 0.8)"; // Tomato red
      placedSprites.current.forEach(sprite => {
        if (typeof sprite.metaTileX === 'number' && typeof sprite.metaTileY === 'number') {
          // Map grid coordinates to minimap coordinates
          const normalizedX = sprite.metaTileX / gridBounds.width;
          const normalizedY = sprite.metaTileY / gridBounds.height;
          
          const spriteX = offsetX + normalizedX * mapWidth;
          const spriteY = offsetY + normalizedY * mapHeight;
          
          const spriteSize = Math.max(3, Math.min(mapWidth / gridBounds.width, mapHeight / gridBounds.height));
          
          ctx.fillRect(
            spriteX,
            spriteY,
            spriteSize,
            spriteSize
          );
        }
      });
    }
    
    // Draw border around the grid
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, mapWidth, mapHeight);
    
    return { offsetX, offsetY, mapWidth, mapHeight };
  };

  const updateViewport = (mainApp, canvas) => {
    if (!canvas || !mainApp) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw base map and get dimensions
    drawMinimap(canvas);

    // Get the minimap dimensions
    const mapWidth = MINIMAP_SIZE - (MINIMAP_BORDER * 2);
    const mapHeight = MINIMAP_SIZE - (MINIMAP_BORDER * 2);
    const offsetX = MINIMAP_BORDER;
    const offsetY = MINIMAP_BORDER;

    // Calculate the visible area in world coordinates
    const stage = mainApp.stage;
    const renderer = mainApp.renderer;
    
    // Calculate the actual world dimensions in tiles
    const fullWidthInTiles = gridBounds.width;
    const fullHeightInTiles = gridBounds.height;
    
    // Calculate visible area in world coordinates (in tiles)
    const visibleLeftInPixels = Math.max(0, -stage.x / stage.scale.x);
    const visibleTopInPixels = Math.max(0, -stage.y / stage.scale.y);
    const visibleLeftInTiles = visibleLeftInPixels / TILE_SIZE;
    const visibleTopInTiles = visibleTopInPixels / TILE_SIZE;
    
    const visibleWidthInPixels = Math.min(fullWidthInTiles * TILE_SIZE - visibleLeftInPixels, renderer.width / stage.scale.x);
    const visibleHeightInPixels = Math.min(fullHeightInTiles * TILE_SIZE - visibleTopInPixels, renderer.height / stage.scale.y);
    const visibleWidthInTiles = visibleWidthInPixels / TILE_SIZE;
    const visibleHeightInTiles = visibleHeightInPixels / TILE_SIZE;

    // Calculate viewport rectangle on minimap
    const viewX = offsetX + (visibleLeftInTiles / fullWidthInTiles) * mapWidth;
    const viewY = offsetY + (visibleTopInTiles / fullHeightInTiles) * mapHeight;
    const viewWidth = (visibleWidthInTiles / fullWidthInTiles) * mapWidth;
    const viewHeight = (visibleHeightInTiles / fullHeightInTiles) * mapHeight;

    // Draw viewport rectangle with semi-transparent fill
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(viewX, viewY, viewWidth, viewHeight);
    
    // Draw viewport border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);
  };

  return (
    <div 
      ref={minimapContainer} 
      style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        zIndex: 10,
        width: `${MINIMAP_SIZE}px`,
        height: `${MINIMAP_SIZE}px`,
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "3px",
        overflow: "hidden",
        boxShadow: "0 0 8px rgba(0, 0, 0, 0.5)",
        backgroundColor: "#222222",
        opacity: 0.8
      }}
    />
  );
};

export default Minimap;