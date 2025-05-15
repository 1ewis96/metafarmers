import * as PIXI from 'pixi.js';
import { API_HEADERS, API_BASE_URL, TILE_SIZE } from './apiConfig';
import { calculateSpriteScale } from './gridUtils';

/**
 * Loads objects for a specific layer
 * @param {string} layerName - Name of the layer to load objects for
 * @param {PIXI.Container} container - Container to add objects to
 * @param {Object} pendingRequests - Reference to pending requests object
 * @param {Object} objCache - Reference to object cache
 * @param {Function} updateProgress - Function to update loading progress
 * @returns {Promise<Array>} - Array of loaded object data
 */
export const loadLayerObjects = async (layerName, container, pendingRequests, objCache, updateProgress) => {
  if (!layerName || !container) {
    console.log("[Movement] Cannot load objects - missing layerName or container", { layerName, hasContainer: !!container });
    return [];
  }
  
  console.log(`[Movement] Loading objects for layer: ${layerName}`);
  
  // Check if we already have a pending request for this layer's objects
  const requestKey = `objects_${layerName}`;
  if (pendingRequests.current[requestKey]) {
    console.log(`[Movement] Objects request for layer ${layerName} already in progress, waiting...`);
    try {
      await pendingRequests.current[requestKey];
    } catch (error) {
      console.error(`[Movement] Error waiting for pending objects request:`, error);
      return [];
    }
  }
  
  let data;
  try {
    // Create a new promise for this request if it doesn't exist
    if (!pendingRequests.current[requestKey]) {
      pendingRequests.current[requestKey] = (async () => {
        try {
          console.log(`[Movement] Requesting objects with payload:`, { layer: layerName });
          const res = await fetch(`${API_BASE_URL}/objects`, {
            method: "POST",
            headers: API_HEADERS,
            body: JSON.stringify({ layer: layerName }),
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch objects: ${res.status} ${res.statusText}`);
          }
          
          const data = await res.json();
          return data;
        } catch (error) {
          console.error(`[Movement] Error fetching objects for layer ${layerName}:`, error);
          throw error;
        }
      })();
    }
    
    data = await pendingRequests.current[requestKey];
    delete pendingRequests.current[requestKey];
    console.log(`[Movement] Layer objects API response:`, data);
    
    // Check if the response has the expected format
    if (!data.data && data.objects) {
      console.log(`[Movement] Converting objects response format`);
      data.data = data.objects;
    }
    
    const items = data.data || [];
    
    if (items.length === 0) {
      console.log(`[Movement] No objects found for layer: ${layerName}`);
      return [];
    }
    
    console.log(`[Movement] Found ${items.length} objects to load`);
    
    // Deduplicate objects by ID to prevent multiple requests for the same object
    const uniqueObjects = {};
    items.forEach(item => {
      const objectId = item.object; // This is the correct property name from Map demo
      if (objectId) {
        if (!uniqueObjects[objectId]) {
          uniqueObjects[objectId] = [];
        }
        uniqueObjects[objectId].push({
          objectId,
          x: item.x,
          y: item.y,
          rotation: item.rotation || 0
        });
      } else {
        console.warn(`[Movement] Skipping object with undefined ID:`, item);
      }
    });
    
    // Fetch all unique objects that aren't already cached
    const objectsToFetch = Object.keys(uniqueObjects).filter(id => !objCache.current[id]);
    console.log(`[Movement] Need to fetch ${objectsToFetch.length} unique objects out of ${Object.keys(uniqueObjects).length} total`);
    
    // Fetch objects in smaller batches to avoid overwhelming the server
    const BATCH_SIZE = 3; // Reduced batch size to avoid server errors
    const objectBatches = [];
    for (let i = 0; i < objectsToFetch.length; i += BATCH_SIZE) {
      objectBatches.push(objectsToFetch.slice(i, i + BATCH_SIZE));
    }
    
    // Process each batch sequentially
    for (const batch of objectBatches) {
      await Promise.all(batch.map(async (objectId) => {
        // Check if we already have a pending request for this object
        const objRequestKey = `object_${objectId}`;
        if (pendingRequests.current[objRequestKey]) {
          try {
            await pendingRequests.current[objRequestKey];
          } catch (err) {
            console.error(`[Movement] Error waiting for pending object request ${objectId}:`, err);
          }
          return;
        }
        
        if (!pendingRequests.current[objRequestKey]) {
          pendingRequests.current[objRequestKey] = (async () => {
            try {
              console.log(`[Movement] Fetching object details for: ${objectId}`);
              const objRes = await fetch(`${API_BASE_URL}/object/${objectId}`, {
                headers: API_HEADERS
              });
              
              if (!objRes.ok) {
                throw new Error(`Failed to fetch object ${objectId}: ${objRes.status} ${objRes.statusText}`);
              }
              
              const objData = await objRes.json();
              
              // Check if we got valid data
              if (objData.error || !objData.spriteSheet) {
                console.error(`[Movement] Invalid object data for ${objectId}:`, objData);
                return null;
              }
              
              objCache.current[objectId] = objData;
              return objData;
            } catch (err) {
              console.error(`[Movement] Error fetching object ${objectId}:`, err);
              throw err;
            } finally {
              delete pendingRequests.current[objRequestKey];
            }
          })();
        }
        
        try {
          await pendingRequests.current[objRequestKey];
        } catch (err) {
          // Error already logged in the inner try/catch
        }
      }));
      
      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay
    }
    
    // Now create sprites for all objects using the cache
    const objectPromises = [];
    for (const [objectId, instances] of Object.entries(uniqueObjects)) {
      for (const instance of instances) {
        objectPromises.push((async () => {
          try {
            const objData = objCache.current[objectId];
            if (!objData) {
              return null; // Skip if we couldn't fetch the data
            }
            
            const { x, y, rotation } = instance;
        
            // Load texture
            const texture = PIXI.Texture.from(objData.spriteSheet.url);
            
            // Create sprite
            const sprite = new PIXI.Sprite(texture);
            
            // Scale the sprite to fit within the grid cell if needed
            const spriteWidth = objData.spriteSheet.frameSize?.width || texture.width;
            const spriteHeight = objData.spriteSheet.frameSize?.height || texture.height;
            
            // Calculate appropriate scale to fit within a cell
            const scale = calculateSpriteScale(objData, spriteWidth, spriteHeight);
            sprite.scale.set(scale);
            
            // Position sprite within the grid cell - ensure exact center of the 64px cell
            sprite.x = (x * TILE_SIZE) + (TILE_SIZE / 2); // Center in the grid cell
            sprite.y = (y * TILE_SIZE) + (TILE_SIZE / 2); // Center in the grid cell
            sprite.rotation = rotation * (Math.PI / 180);
            sprite.anchor.set(0.5, 0.5); // Set anchor to center of sprite
            
            // Add metadata
            sprite.metaObjectName = objectId;
            sprite.metaTileX = x;
            sprite.metaTileY = y;
            sprite.metaRotation = rotation;
            sprite.zIndex = 10; // Ensure objects are on top of tiles
            
            // Add to container
            container.addChild(sprite);
            
            return {
              sprite,
              objectName: objectId,
              x: sprite.x,
              y: sprite.y,
              tileX: x,
              tileY: y,
              rotation: rotation
            };
          } catch (err) {
            console.error(`[Movement] Error creating sprite for object ${objectId}:`, err);
            return null;
          }
        })());
      }
    }
    
    // Add progress tracking to object loading
    const totalObjects = objectPromises.length;
    let loadedCount = 0;
    
    const objectPromisesWithProgress = objectPromises.map(async (promise) => {
      const result = await promise;
      loadedCount++;
      
      if (updateProgress) {
        updateProgress(loadedCount, totalObjects);
      }
      
      return result;
    });
    
    const loadedObjectsData = (await Promise.all(objectPromisesWithProgress)).filter(Boolean);
    return loadedObjectsData;
  } catch (error) {
    console.error("[Movement] Error loading layer objects:", error);
    return [];
  }
};
