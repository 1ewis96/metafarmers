import React, { useRef, useEffect } from "react";
import * as PIXI from "pixi.js";

const MINIMAP_SIZE = 250; // Adjusted size for visibility

const Minimap = ({
  minimapContainer,
  mainAppRef,
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
  }, [currentLayer, loading, gridBounds]);

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

    // Draw background (transparent black for map area)
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Calculate scale to fit gridBounds into minimap
    const scale = Math.min(MINIMAP_SIZE / gridBounds.width, MINIMAP_SIZE / gridBounds.height) * 0.9;
    const mapWidth = gridBounds.width * scale;
    const mapHeight = gridBounds.height * scale;
    const offsetX = (MINIMAP_SIZE - mapWidth) / 2;
    const offsetY = (MINIMAP_SIZE - mapHeight) / 2;

    // Draw map outline
    ctx.fillStyle = "rgba(200, 200, 200, 0.6)";
    ctx.fillRect(offsetX, offsetY, mapWidth, mapHeight);
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, mapWidth, mapHeight);

    console.log("Minimap drawn:", { scale, offsetX, offsetY, mapWidth, mapHeight });
  };

  const updateViewport = (mainApp, canvas) => {
    if (!canvas || !mainApp) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw base map
    drawMinimap(canvas);

    // Calculate minimap scale and offsets
    const scale = Math.min(MINIMAP_SIZE / gridBounds.width, MINIMAP_SIZE / gridBounds.height) * 0.9;
    const mapWidth = gridBounds.width * scale;
    const mapHeight = gridBounds.height * scale;
    const offsetX = (MINIMAP_SIZE - mapWidth) / 2;
    const offsetY = (MINIMAP_SIZE - mapHeight) / 2;

    // Calculate the visible area in world coordinates
    const stage = mainApp.stage;
    const renderer = mainApp.renderer;
    // Use the actual world dimensions for fullWidth and fullHeight
    const fullWidth = gridBounds.width * 64; // Assuming each grid unit is 64 pixels
    const fullHeight = gridBounds.height * 64; // Adjust based on actual grid size
    const visibleLeft = -stage.x / stage.scale.x;
    const visibleTop = -stage.y / stage.scale.x;
    const visibleWidth = renderer.width / stage.scale.x;
    const visibleHeight = renderer.height / stage.scale.x;

    // Calculate viewport dimensions on minimap based on visible area
    const viewWidth = Math.max(10, Math.min(50, (visibleWidth / fullWidth) * mapWidth)); // Min 10px, Max 50px
    const viewHeight = Math.max(10, Math.min(50, (visibleHeight / fullHeight) * mapHeight)); // Min 10px, Max 50px
    const viewX = Math.max(offsetX, Math.min(offsetX + mapWidth - viewWidth, ((visibleLeft + visibleWidth / 2) / fullWidth) * mapWidth + offsetX - viewWidth / 2));
    const viewY = Math.max(offsetY, Math.min(offsetY + mapHeight - viewHeight, ((visibleTop + visibleHeight / 2) / fullHeight) * mapHeight + offsetY - viewHeight / 2));

    console.log('Viewport Info:', {
      visibleLeft, visibleTop, visibleWidth, visibleHeight,
      fullWidth, fullHeight,
      viewX, viewY, viewWidth, viewHeight,
      stageX: stage.x, stageY: stage.y, scale: stage.scale.x
    });

    // Draw viewport rectangle
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);
  };

  return (
    <div ref={minimapContainer} style={{ position: "absolute", bottom: "10px", right: "10px", zIndex: 10 }} />
  );
};

export default Minimap;