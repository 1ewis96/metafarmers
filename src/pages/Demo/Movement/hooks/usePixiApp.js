import { useRef, useEffect } from 'react';
import { initializePixiApp, findGridContainer, destroyPixiApp } from '../utils/pixiUtils';

/**
 * Hook to handle Pixi.js application initialization and lifecycle
 * @param {Object} params - Parameters for the Pixi app hook
 * @param {HTMLElement} params.containerRef - Reference to the DOM container element
 * @param {Function} params.onAppReady - Callback when app is ready
 * @param {Function} params.onWorldContainerReady - Callback when world container is ready
 * @returns {Object} - References and state for the Pixi application
 */
const usePixiApp = ({ containerRef, onAppReady, onWorldContainerReady }) => {
  const appRef = useRef(null);
  const worldContainerRef = useRef(null);
  const gridContainerRef = useRef(null);
  const animationTicker = useRef(null);
  const canvasInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (canvasInitializedRef.current || !containerRef.current) return;
    canvasInitializedRef.current = true;

    const initializeApp = async () => {
      try {
        // Initialize PIXI application
        const { app, worldContainer } = initializePixiApp(containerRef.current);
        appRef.current = app;
        worldContainerRef.current = worldContainer;

        // Find the grid container
        const gridContainer = findGridContainer(worldContainer);
        gridContainerRef.current = gridContainer;

        // Notify parent that the world container is ready
        if (onWorldContainerReady) {
          console.log(`[Movement] Calling onWorldContainerReady callback`);
          onWorldContainerReady(worldContainer);
        }

        // Notify that the app is ready
        if (onAppReady) {
          onAppReady({ app, worldContainer, gridContainer });
        }

        return () => {
          // Clean up resources
          destroyPixiApp(app, animationTicker.current);
          canvasInitializedRef.current = false;
          appRef.current = null;
          worldContainerRef.current = null;
          gridContainerRef.current = null;
        };
      } catch (error) {
        console.error(`[Movement] Error initializing canvas:`, error);
        canvasInitializedRef.current = false; // Allow retry on error
        return () => {};
      }
    };

    const cleanup = initializeApp();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [containerRef, onAppReady, onWorldContainerReady]);

  return {
    appRef,
    worldContainerRef,
    gridContainerRef,
    animationTicker,
    isInitialized: canvasInitializedRef.current
  };
};

export default usePixiApp;
