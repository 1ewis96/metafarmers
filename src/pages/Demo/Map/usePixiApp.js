import { useEffect, useState } from "react";
import * as PIXI from "pixi.js";

const usePixiApp = ({ container, width, height, backgroundColor, backgroundAlpha = 1 }) => {
  const [app, setApp] = useState(null);

  useEffect(() => {
    if (!container.current) return;

    const currentContainer = container.current;

    const handleContextLoss = (event) => {
      event.preventDefault();
      console.warn("WebGL context lost, attempting to restore...");
    };

    const handleContextRestored = () => {
      console.log("WebGL context restored");
      if (app) {
        app.renderer.gl.clear(app.renderer.backgroundColor);
      }
    };

    const initializeApp = (attempt = 1, maxAttempts = 3) => {
      console.log(`Initializing PIXI app (attempt ${attempt}/${maxAttempts})`);
      const pixiApp = new PIXI.Application({
        width,
        height,
        backgroundColor,
        backgroundAlpha,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: false,
        powerPreference: "low-power",
      });

      currentContainer.appendChild(pixiApp.view);
      currentContainer.__PIXI_APP__ = pixiApp;
      setApp(pixiApp);

      pixiApp.stage.eventMode = "static";
      pixiApp.stage.hitArea = new PIXI.Rectangle(0, 0, width, height);

      pixiApp.renderer.gl.canvas.addEventListener("webglcontextlost", handleContextLoss);
      pixiApp.renderer.gl.canvas.addEventListener("webglcontextrestored", handleContextRestored);

      console.log("PIXI app initialized, renderer state:", {
        gl: !!pixiApp.renderer.gl,
        contextLost: pixiApp.renderer.gl?.isContextLost(),
      });

      // Check for immediate context loss
      if (pixiApp.renderer.gl?.isContextLost() && attempt < maxAttempts) {
        console.warn(`Context lost after initialization, retrying (attempt ${attempt + 1}/${maxAttempts})`);
        pixiApp.destroy(true, true);
        setTimeout(() => initializeApp(attempt + 1, maxAttempts), 500);
        return null;
      }

      return pixiApp;
    };

    const timer = setTimeout(() => {
      const pixiApp = initializeApp();
      if (!pixiApp) return; // Skip if retrying

      const handleResize = () => {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight - 56; // Adjust for navbar height
        pixiApp.renderer.resize(canvasWidth, canvasHeight);
        pixiApp.stage.hitArea = new PIXI.Rectangle(0, 0, canvasWidth, canvasHeight);
        console.log(`Canvas resized to ${canvasWidth}x${canvasHeight}`);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", handleResize);
        if (pixiApp) {
          pixiApp.renderer.gl.canvas.removeEventListener("webglcontextlost", handleContextLoss);
          pixiApp.renderer.gl.canvas.removeEventListener("webglcontextrestored", handleContextRestored);
          pixiApp.destroy(true, true);
        }
        if (currentContainer) {
          delete currentContainer.__PIXI_APP__;
        }
      };
    }, 500);
  }, [container, width, height, backgroundColor, backgroundAlpha]);

  return app;
};

export default usePixiApp;