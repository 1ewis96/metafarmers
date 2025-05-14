import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import usePixiApp from "./usePixiApp";
import { MINIMAP_SIZE, MINIMAP_SCALE, TILE_SIZE } from "./constants";

const Minimap = ({
  minimapContainer,
  mainAppRef,
  placedSprites,
  spriteUpdateCounter,
  loading,
  currentLayer,
  gridBounds,
  layerDimensions
}) => {
  const minimapSprites = useRef([]);
  const app = usePixiApp({
    container: minimapContainer,
    width: MINIMAP_SIZE,
    height: MINIMAP_SIZE,
    backgroundColor: 0x333333,
    backgroundAlpha: 0.8,
  });

  const getCurrentLayerDimensions = () => {
    const layerData = layerDimensions.find(layer => layer.layer === currentLayer);
    return layerData ? { width: layerData.width, height: layerData.height } : { width: 30, height: 30 };
  };

  useEffect(() => {
    if (!app) return;

    console.log("Minimap app initialized:", app);

    const { width, height } = getCurrentLayerDimensions();
    const gridGraphics = new PIXI.Graphics();
    gridGraphics.beginFill(0xcccccc);
    gridGraphics.drawRect(0, 0, width * TILE_SIZE * MINIMAP_SCALE, height * TILE_SIZE * MINIMAP_SCALE);
    gridGraphics.endFill();
    gridGraphics.lineStyle(1, 0x666666, 1);
    for (let i = 0; i <= width; i++) {
      gridGraphics.moveTo(i * TILE_SIZE * MINIMAP_SCALE, 0);
      gridGraphics.lineTo(i * TILE_SIZE * MINIMAP_SCALE, height * TILE_SIZE * MINIMAP_SCALE);
    }
    for (let i = 0; i <= height; i++) {
      gridGraphics.moveTo(0, i * TILE_SIZE * MINIMAP_SCALE);
      gridGraphics.lineTo(width * TILE_SIZE * MINIMAP_SCALE, i * TILE_SIZE * MINIMAP_SCALE);
    }
    app.stage.addChild(gridGraphics);

    const viewportRect = new PIXI.Graphics();
    viewportRect.name = "viewportRect";
    app.stage.addChild(viewportRect);

    const handleClick = (e) => {
      const mainApp = mainAppRef.current?.__PIXI_APP__;
      if (!mainApp) return;
      const localPos = e.data.getLocalPosition(app.stage);
      const worldX = localPos.x / MINIMAP_SCALE;
      const worldY = localPos.y / MINIMAP_SCALE;
      mainApp.stage.x = -worldX * mainApp.stage.scale.x + mainApp.renderer.width / 2;
      mainApp.stage.y = -worldY * mainApp.stage.scale.y + mainApp.renderer.height / 2;
    };

    app.stage.on("pointerdown", handleClick);

    return () => {
      app.stage.off("pointerdown", handleClick);
    };
  }, [app, mainAppRef, currentLayer, layerDimensions]);

  useEffect(() => {
    if (!app || !mainAppRef.current?.__PIXI_APP__) return;

    const mainApp = mainAppRef.current.__PIXI_APP__;
    const viewportRect = app.stage.getChildByName("viewportRect");
    if (!viewportRect) return;

    const updateViewport = () => {
      console.log("Viewport update triggered");
      viewportRect.clear();
      const viewWidth = mainApp.renderer.width / mainApp.stage.scale.x;
      const viewHeight = mainApp.renderer.height / mainApp.stage.scale.y;
      const viewX = -mainApp.stage.x / mainApp.stage.scale.x;
      const viewY = -mainApp.stage.y / mainApp.stage.scale.y;
      const miniViewX = viewX * MINIMAP_SCALE;
      const miniViewY = viewY * MINIMAP_SCALE;
      const miniViewWidth = viewWidth * MINIMAP_SCALE;
      const miniViewHeight = viewHeight * MINIMAP_SCALE;
      viewportRect.lineStyle(2, 0xff0000, 1);
      viewportRect.drawRect(miniViewX, miniViewY, miniViewWidth, miniViewHeight);
    };

    updateViewport();
    mainApp.ticker.add(updateViewport);

    return () => {
      mainApp.ticker.remove(updateViewport);
    };
  }, [app, mainAppRef]);

  useEffect(() => {
    if (!app || loading || !currentLayer) return;

    console.log("Updating minimap sprites, placedSprites count:", placedSprites.current.length);

    minimapSprites.current.forEach((sprite) => {
      app.stage.removeChild(sprite);
      sprite.destroy();
    });
    minimapSprites.current = [];

    placedSprites.current.forEach((sprite) => {
      if (!sprite.texture || !sprite.texture.valid) {
        const fallback = new PIXI.Graphics();
        fallback.beginFill(0xff0000);
        fallback.drawRect(
          (sprite.x - sprite.width / 2) * MINIMAP_SCALE,
          (sprite.y - sprite.height / 2) * MINIMAP_SCALE,
          sprite.width * MINIMAP_SCALE,
          sprite.height * MINIMAP_SCALE
        );
        fallback.endFill();
        app.stage.addChildAt(fallback, 1);
        minimapSprites.current.push(fallback);
        return;
      }

      const miniSprite = new PIXI.Sprite(sprite.texture);
      miniSprite.anchor.set(0.5, 0.5);
      miniSprite.width = sprite.width * MINIMAP_SCALE;
      miniSprite.height = sprite.height * MINIMAP_SCALE;
      miniSprite.x = sprite.x * MINIMAP_SCALE;
      miniSprite.y = sprite.y * MINIMAP_SCALE;
      miniSprite.rotation = sprite.rotation;
      miniSprite.alpha = 1;
      app.stage.addChildAt(miniSprite, 1);
      minimapSprites.current.push(miniSprite);
    });

    console.log("Minimap sprites updated:", minimapSprites.current.length);
  }, [app, loading, currentLayer, spriteUpdateCounter, placedSprites]);

  return (
    <div
      ref={minimapContainer}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: `${MINIMAP_SIZE}px`,
        height: `${MINIMAP_SIZE}px`,
        border: "2px solid #fff",
        zIndex: 10,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
    />
  );
};

export default Minimap;