import * as PIXI from 'pixi.js';
import { API_HEADERS, API_BASE_URL, TILE_SIZE } from './apiConfig';
import { calculateSpriteScale } from './gridUtils';

/**
 * Loads tiles for a specific layer
 * @param {string} layerName - Name of the layer to load tiles for
 * @param {PIXI.Container} container - Container to add tiles to
 * @param {Object} pendingRequests - Reference to pending requests object
 * @param {Object} tileCache - Reference to tile cache
 * @param {Function} updateProgress - Function to update loading progress
 * @returns {Promise<Array>} - Array of loaded tile data
 */
export const loadLayerTiles = async (layerName, container, pendingRequests, tileCache, updateProgress) => {
  if (!layerName || !container) {
    console.log("[Movement] Cannot load tiles - missing layerName or container", { layerName, hasContainer: !!container });
    return [];
  }
  
  console.log(`[Movement] Loading tiles for layer: ${layerName}`);
  
  // Check if we already have a pending request for this layer's tiles
  const requestKey = `tiles_${layerName}`;
  if (pendingRequests.current[requestKey]) {
    console.log(`[Movement] Tiles request for layer ${layerName} already in progress, waiting...`);
    try {
      await pendingRequests.current[requestKey];
    } catch (error) {
      console.error(`[Movement] Error waiting for pending tiles request:`, error);
      return [];
    }
  }
  
  let data;
  try {
    // Create a new promise for this request if it doesn't exist
    if (!pendingRequests.current[requestKey]) {
      pendingRequests.current[requestKey] = (async () => {
        try {
          console.log(`[Movement] Requesting tiles with payload:`, { layer: layerName });
          const res = await fetch(`${API_BASE_URL}/tiles`, {
            method: "POST",
            headers: API_HEADERS,
            body: JSON.stringify({ layer: layerName }),
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch tiles: ${res.status} ${res.statusText}`);
          }
          
          const data = await res.json();
          return data;
        } catch (error) {
          console.error(`[Movement] Error fetching tiles for layer ${layerName}:`, error);
          throw error;
        }
      })();
    }
    
    data = await pendingRequests.current[requestKey];
    delete pendingRequests.current[requestKey];
    console.log(`[Movement] Layer tiles API response:`, data);
    
    // Check if the response has the expected format
    if (!data.data && data.tiles) {
      console.log(`[Movement] Converting tiles response format`);
      data.data = data.tiles;
    }
    
    const items = data.data || [];
    
    if (items.length === 0) {
      console.log(`[Movement] No tiles found for layer: ${layerName}`);
      return [];
    }
    
    console.log(`[Movement] Found ${items.length} tiles to load`);
    
    // Deduplicate tiles by ID to prevent multiple requests for the same tile
    const uniqueTiles = {};
    items.forEach(item => {
      const tileId = item.tile; // This is the correct property name from Map demo
      if (tileId) {
        if (!uniqueTiles[tileId]) {
          uniqueTiles[tileId] = [];
        }
        uniqueTiles[tileId].push({
          tileId,
          x: item.x,
          y: item.y
        });
      } else {
        console.warn(`[Movement] Skipping tile with undefined ID:`, item);
      }
    });
    
    // Fetch all unique tiles that aren't already cached
    const tilesToFetch = Object.keys(uniqueTiles).filter(id => !tileCache.current[id]);
    console.log(`[Movement] Need to fetch ${tilesToFetch.length} unique tiles out of ${Object.keys(uniqueTiles).length} total`);
    
    // Fetch tiles in smaller batches to avoid overwhelming the server
    const BATCH_SIZE = 3; // Reduced batch size to avoid server errors
    const tileBatches = [];
    for (let i = 0; i < tilesToFetch.length; i += BATCH_SIZE) {
      tileBatches.push(tilesToFetch.slice(i, i + BATCH_SIZE));
    }
    
    // Process each batch sequentially
    for (const batch of tileBatches) {
      await Promise.all(batch.map(async (tileId) => {
        // Check if we already have a pending request for this tile
        const tileRequestKey = `tile_${tileId}`;
        if (pendingRequests.current[tileRequestKey]) {
          try {
            await pendingRequests.current[tileRequestKey];
          } catch (err) {
            console.error(`[Movement] Error waiting for pending tile request ${tileId}:`, err);
          }
          return;
        }
        
        if (!pendingRequests.current[tileRequestKey]) {
          pendingRequests.current[tileRequestKey] = (async () => {
            try {
              console.log(`[Movement] Fetching tile details for: ${tileId}`);
              // Fixed endpoint from /tile/ to /tiles/
              const tileRes = await fetch(`${API_BASE_URL}/tiles/${tileId}`, {
                headers: API_HEADERS
              });
              
              if (!tileRes.ok) {
                throw new Error(`Failed to fetch tile ${tileId}: ${tileRes.status} ${tileRes.statusText}`);
              }
              
              const tileData = await tileRes.json();
              
              // Check if we got valid data
              if (tileData.error || !tileData.spriteSheet) {
                console.error(`[Movement] Invalid tile data for ${tileId}:`, tileData);
                return null;
              }
              
              tileCache.current[tileId] = tileData;
              return tileData;
            } catch (err) {
              console.error(`[Movement] Error fetching tile ${tileId}:`, err);
              throw err;
            } finally {
              delete pendingRequests.current[tileRequestKey];
            }
          })();
        }
        
        try {
          await pendingRequests.current[tileRequestKey];
        } catch (err) {
          // Error already logged in the inner try/catch
        }
      }));
      
      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay
    }
    
    // Now create sprites for all tiles using the cache
    const tilePromises = [];
    for (const [tileId, instances] of Object.entries(uniqueTiles)) {
      for (const instance of instances) {
        tilePromises.push((async () => {
          try {
            const tileData = tileCache.current[tileId];
            if (!tileData) {
              return null; // Skip if we couldn't fetch the data
            }
            
            const { x, y } = instance;
        
            // Load texture
            const texture = PIXI.Texture.from(tileData.spriteSheet.url);
            
            // Create sprite
            const sprite = new PIXI.Sprite(texture);
            
            // Scale the sprite to fit within the grid cell if needed
            const spriteWidth = tileData.spriteSheet.frameSize?.width || texture.width;
            const spriteHeight = tileData.spriteSheet.frameSize?.height || texture.height;
            
            // Calculate appropriate scale to fit within a cell
            const scale = calculateSpriteScale(tileData, spriteWidth, spriteHeight);
            sprite.scale.set(scale);
            
            // Position sprite within the grid cell
            sprite.x = (x * TILE_SIZE) + (TILE_SIZE / 2); // Center in the grid cell
            sprite.y = (y * TILE_SIZE) + (TILE_SIZE / 2); // Center in the grid cell
            sprite.anchor.set(0.5, 0.5); // Set anchor to center of sprite
            
            // Add metadata
            sprite.metaTileName = tileId;
            sprite.metaTileX = x;
            sprite.metaTileY = y;
            sprite.zIndex = 5; // Ensure tiles are below objects
            
            // Add to container
            container.addChild(sprite);
            
            return {
              sprite,
              tileName: tileId,
              x: sprite.x,
              y: sprite.y,
              tileX: x,
              tileY: y
            };
          } catch (err) {
            console.error(`[Movement] Error creating sprite for tile ${tileId}:`, err);
            return null;
          }
        })());
      }
    }
    
    // Add progress tracking to tile loading
    const totalTiles = tilePromises.length;
    let loadedCount = 0;
    
    const tilePromisesWithProgress = tilePromises.map(async (promise) => {
      const result = await promise;
      loadedCount++;
      
      if (updateProgress) {
        updateProgress(loadedCount, totalTiles);
      }
      
      return result;
    });
    
    const loadedTilesData = (await Promise.all(tilePromisesWithProgress)).filter(Boolean);
    return loadedTilesData;
  } catch (error) {
    console.error("[Movement] Error loading layer tiles:", error);
    return [];
  }
};
