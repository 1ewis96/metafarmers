import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLayersList } from '../utils/layerApi';
import { loadLayerObjects } from '../utils/objectLoader';
import { loadLayerTiles } from '../utils/tileLoader';
import { createGridContainer } from '../utils/gridUtils';

/**
 * Hook for loading and managing map layers in the Movement demo
 * @returns {Object} Layer loading state and functions
 */
const useMapLayerLoader = () => {
  const [availableLayers, setAvailableLayers] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(null);
  const [layerDimensions, setLayerDimensions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadedObjects, setLoadedObjects] = useState([]);
  const [loadedTiles, setLoadedTiles] = useState([]);
  
  // Cache for objects and tiles to avoid repeated fetching
  const objCache = useRef({});
  const tileCache = useRef({});
  
  // Track pending requests to avoid duplicates
  const pendingRequests = useRef({});
  
  // Track the currently loaded layer to prevent reloading the same layer multiple times
  const loadedLayerRef = useRef(null);
  
  // Fetch available layers
  const fetchLayers = useCallback(async () => {
    console.log("[Movement] Fetching available layers...");
    setIsLoading(true);
    
    try {
      const { layerNames, fullLayers } = await fetchLayersList(pendingRequests);
      
      console.log("[Movement] Available layer names:", layerNames);
      
      setAvailableLayers(layerNames);
      setLayerDimensions(fullLayers);
      
      if (layerNames.length > 0 && !currentLayer) {
        console.log("[Movement] Setting initial layer to:", layerNames[0]);
        setCurrentLayer(layerNames[0]);
      }
    } catch (error) {
      console.error("[Movement] Error loading layers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLayer]);
  
  // Reset loading state
  const resetLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingProgress(0);
    setLoadingMessage('');
  }, []);
  
  // Load both objects and tiles for a layer
  const loadLayer = useCallback(async (layerName, container) => {
    if (!layerName || !container) {
      console.log("[Movement] Cannot load layer - missing layerName or container", { layerName, hasContainer: !!container });
      return;
    }
    
    // Skip if we're already loading this layer or it's already loaded
    if (loadedLayerRef.current === layerName) {
      console.log(`[Movement] Layer ${layerName} is already loaded or loading, skipping`);
      return;
    }
    
    // Start loading
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage(`Preparing to load layer: ${layerName}`);
    
    loadedLayerRef.current = layerName;
    console.log(`[Movement] Loading complete layer: ${layerName}`);
    console.log(`[Movement] Container has ${container.children.length} children before clearing`);
    
    try {
      // Clear the container
      while (container.children.length > 0) {
        const child = container.children[0];
        container.removeChild(child);
        if (child.destroy) {
          child.destroy();
        }
      }
      
      // Get the layer dimensions
      const layerDim = layerDimensions.find(dim => dim.layer === layerName);
      const width = layerDim?.width || 20;
      const height = layerDim?.height || 20;
      
      // Create grid container with grid graphics
      const gridContainer = createGridContainer(width, height);
      container.addChild(gridContainer);
      
      // Update loading progress handlers
      const updateTileProgress = (current, total) => {
        const progress = Math.floor(55 + (current / total) * 20);
        setLoadingProgress(progress);
        setLoadingMessage(`Loading tiles: ${current}/${total}`);
      };
      
      const updateObjectProgress = (current, total) => {
        const progress = Math.floor(30 + (current / total) * 20);
        setLoadingProgress(progress);
        setLoadingMessage(`Loading objects: ${current}/${total}`);
      };
      
      // Load tiles first (background)
      setLoadingProgress(30);
      setLoadingMessage(`Loading tiles for layer: ${layerName}`);
      const loadedTilesData = await loadLayerTiles(
        layerName, 
        gridContainer, 
        pendingRequests, 
        tileCache, 
        updateTileProgress
      );
      setLoadedTiles(loadedTilesData);
      
      // Then load objects (foreground)
      setLoadingProgress(55);
      setLoadingMessage(`Loading objects for layer: ${layerName}`);
      const loadedObjectsData = await loadLayerObjects(
        layerName, 
        gridContainer, 
        pendingRequests, 
        objCache, 
        updateObjectProgress
      );
      setLoadedObjects(loadedObjectsData);
      
      console.log(`[Movement] Layer loading complete. Container now has ${container.children.length} children`);
      setLoadingProgress(100);
      setLoadingMessage(`Layer ${layerName} loaded successfully!`);
      
      // Delay hiding the loading screen to ensure everything is rendered
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error(`[Movement] Error loading layer ${layerName}:`, error);
      loadedLayerRef.current = null; // Reset so we can try loading again
      setIsLoading(false);
    }
    
  }, [layerDimensions]);
  
  return {
    availableLayers,
    currentLayer,
    setCurrentLayer,
    layerDimensions,
    isLoading,
    loadingProgress,
    loadingMessage,
    loadedObjects,
    loadedTiles,
    fetchLayers,
    loadLayer,
    resetLoading
  };
};

export default useMapLayerLoader;
