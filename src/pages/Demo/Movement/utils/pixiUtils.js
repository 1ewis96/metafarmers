import { Application, Container } from 'pixi.js';

/**
 * Creates and initializes a new PIXI Application
 * @param {HTMLElement} container - The DOM element to append the PIXI canvas to
 * @returns {Object} The initialized PIXI Application and world container
 */
export const initializePixiApp = (container) => {
  // Create a new PIXI Application
  const app = new Application({
    backgroundColor: 0x222222,
    powerPreference: 'high-performance',
    resizeTo: window,
  });

  // Clear and append to container
  if (container) {
    container.innerHTML = '';
    container.appendChild(app.view);
  }

  // Create world container for map elements
  const worldContainer = new Container();
  app.stage.addChild(worldContainer);

  return { app, worldContainer };
};

/**
 * Finds the grid container in the world container
 * @param {PIXI.Container} worldContainer - The world container to search in
 * @returns {PIXI.Container|null} The grid container if found, null otherwise
 */
export const findGridContainer = (worldContainer) => {
  if (worldContainer && worldContainer.children) {
    for (let i = 0; i < worldContainer.children.length; i++) {
      const child = worldContainer.children[i];
      if (child.name === 'gridContainer') {
        console.log('[Movement] Found grid container in world container');
        return child;
      }
    }
  }
  return null;
};

/**
 * Destroys a PIXI Application and cleans up resources
 * @param {PIXI.Application} app - The PIXI Application to destroy
 * @param {PIXI.Ticker} animationTicker - The animation ticker to destroy
 */
export const destroyPixiApp = (app, animationTicker) => {
  if (app) {
    app.destroy(true, { children: true });
  }
  
  if (animationTicker) {
    animationTicker.destroy();
  }
};
