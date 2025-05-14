import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { TILE_SIZE, GRID_SIZE } from "./constants";
import useLayerLoader from "./useLayerLoader";

const useMapInteractions = ({
  app,
  pixiContainer,
  hoverBorder,
  placedSprites,
  currentLayer,
  textureCache,
  setSelectedCell,
  setSpriteUpdateCounter,
}) => {
  const { placeObjectOnGrid } = useLayerLoader({
    app,
    textureCache,
    placedSprites,
    setSpriteUpdateCounter,
  });

  useEffect(() => {
    if (!app) return;

    const minScale = 0.2;
    const maxScale = 5;
    const zoomSpeed = 0.1;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let stageStart = { x: 0, y: 0 };

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const zoomFactor = 1 + delta * zoomSpeed;
      const rect = pixiContainer.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - app.stage.x) / app.stage.scale.x;
      const worldY = (mouseY - app.stage.y) / app.stage.scale.y;
      let newScale = app.stage.scale.x * zoomFactor;
      newScale = Math.max(minScale, Math.min(maxScale, newScale));
      app.stage.scale.set(newScale);
      app.stage.x = mouseX - worldX * newScale;
      app.stage.y = mouseY - worldY * newScale;
    };

    const handlePointerDown = (e) => {
      if (e.target === app.stage) {
        isDragging = true;
        dragStart = { x: e.data.global.x, y: e.data.global.y };
        stageStart = { x: app.stage.x, y: app.stage.y };
      }
    };

    const handlePointerMove = (e) => {
      if (isDragging) {
        const current = { x: e.data.global.x, y: e.data.global.y };
        app.stage.x = stageStart.x + (current.x - dragStart.x);
        app.stage.y = stageStart.y + (current.y - dragStart.y);
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    pixiContainer.current.addEventListener("wheel", handleWheel);
    app.stage.on("pointerdown", handlePointerDown);
    app.stage.on("pointermove", handlePointerMove);
    app.stage.on("pointerup", handlePointerUp);
    app.stage.on("pointerupoutside", handlePointerUp);

    return () => {
      pixiContainer.current.removeEventListener("wheel", handleWheel);
      app.stage.off("pointerdown", handlePointerDown);
      app.stage.off("pointermove", handlePointerMove);
      app.stage.off("pointerup", handlePointerUp);
      app.stage.off("pointerupoutside", handlePointerUp);
    };
  }, [app, pixiContainer]);

  useEffect(() => {
    if (!app) return;

    const updateHitArea = () => {
      const canvasWidth = app.renderer.width;
      const canvasHeight = app.renderer.height;
      const stageX = app.stage.x;
      const stageY = app.stage.y;
      const scale = app.stage.scale.x;

      const worldLeft = -stageX / scale;
      const worldTop = -stageY / scale;
      const worldRight = (canvasWidth - stageX) / scale;
      const worldBottom = (canvasHeight - stageY) / scale;

      app.stage.hitArea = new PIXI.Rectangle(
        worldLeft,
        worldTop,
        worldRight - worldLeft,
        worldBottom - worldTop
      );
      console.log('Updated hitArea:', { left: worldLeft, top: worldTop, right: worldRight, bottom: worldBottom });
    };

    updateHitArea();
    app.stage.on('pointermove', updateHitArea);

    return () => {
      app.stage.off('pointermove', updateHitArea);
    };
  }, [app]);

  useEffect(() => {
    if (!app) return;

    const handlePointerMove = (e) => {
      const mouseX = (e.data.global.x - app.stage.x) / app.stage.scale.x;
      const mouseY = (e.data.global.y - app.stage.y) / app.stage.scale.y;
      const tileX = Math.floor(mouseX / TILE_SIZE);
      const tileY = Math.floor(mouseY / TILE_SIZE);
      hoverBorder.current.clear();
      hoverBorder.current.lineStyle(3, 0xffff00, 1);
      hoverBorder.current.drawRect(
        tileX * TILE_SIZE - 1,
        tileY * TILE_SIZE - 1,
        TILE_SIZE + 2,
        TILE_SIZE + 2
      );
    };

    app.stage.on("pointermove", handlePointerMove);
    pixiContainer.current.addEventListener("mouseleave", () => hoverBorder.current.clear());

    return () => {
      app.stage.off("pointermove", handlePointerMove);
      pixiContainer.current.removeEventListener("mouseleave", () => hoverBorder.current.clear());
    };
  }, [app, hoverBorder]);

  useEffect(() => {
    if (!app) return;

    const handleClick = (e) => {
      const mouseX = (e.data.global.x - app.stage.x) / app.stage.scale.x;
      const mouseY = (e.data.global.y - app.stage.y) / app.stage.scale.y;
      const tileX = Math.floor(mouseX / TILE_SIZE);
      const tileY = Math.floor(mouseY / TILE_SIZE);
      const foundSprite = placedSprites.current.find((sprite) => {
        const spriteTileX = Math.floor((sprite.x - sprite.width / 2) / TILE_SIZE);
        const spriteTileY = Math.floor((sprite.y - sprite.height / 2) / TILE_SIZE);
        return spriteTileX === tileX && spriteTileY === tileY;
      });
      setSelectedCell(
        foundSprite
          ? {
              x: tileX,
              y: tileY,
              objectName: foundSprite.metaObjectName,
              rotation: foundSprite.metaRotation,
            }
          : { x: tileX, y: tileY, objectName: null }
      );
    };

    app.stage.on("pointerdown", handleClick);

    return () => {
      app.stage.off("pointerdown", handleClick);
    };
  }, [app, placedSprites, setSelectedCell]);

  useEffect(() => {
    if (!pixiContainer.current) return;

    const container = pixiContainer.current;

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      const objectName = e.dataTransfer.getData("objectName");
      if (!objectName) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - app.stage.x) / app.stage.scale.x;
      const worldY = (mouseY - app.stage.y) / app.stage.scale.y;
      const tileX = Math.floor(worldX / TILE_SIZE);
      const tileY = Math.floor(worldY / TILE_SIZE);

      try {
        const res = await fetch("https://api.metafarmers.io/layer/object/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer: currentLayer,
            object: objectName,
            x: tileX,
            y: tileY,
            rotation: 0,
          }),
        });

        const data = await res.json();
        if (data.message === "success") {
          const sprite = placeObjectOnGrid(
            textureCache.current[objectName].texture,
            tileX,
            tileY,
            1,
            1,
            objectName,
            0
          );
          placedSprites.current.push(sprite);
          setSpriteUpdateCounter((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Error placing object:", err);
      }
    };

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);

    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
    };
  }, [app, pixiContainer, currentLayer, textureCache, placedSprites, setSpriteUpdateCounter, placeObjectOnGrid]);
};

export default useMapInteractions;