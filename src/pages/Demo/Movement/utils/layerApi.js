import { API_HEADERS, API_BASE_URL } from './apiConfig';

/**
 * Fetches the list of available layers from the API
 * @param {Object} pendingRequests - Reference to pending requests object to avoid duplicates
 * @returns {Promise<{layerNames: string[], fullLayers: Array}>} - Layer names and full layer data
 */
export const fetchLayersList = async (pendingRequests) => {
  // Check if we already have a pending request
  const requestKey = 'list_layers';
  if (pendingRequests.current[requestKey]) {
    console.log("[Movement] Layers request already in progress, waiting...");
    try {
      await pendingRequests.current[requestKey];
    } catch (error) {
      console.error("[Movement] Error waiting for pending layers request:", error);
    }
    return { layerNames: [], fullLayers: [] };
  }
  
  try {
    // Create a new promise for this request
    pendingRequests.current[requestKey] = (async () => {
      const res = await fetch(`${API_BASE_URL}/list/layers`, {
        headers: API_HEADERS
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch layers: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      return data;
    })();
    
    const data = await pendingRequests.current[requestKey];
    console.log("[Movement] Layers API response:", data);
    
    const fullLayers = data.layers || [];
    const layerNames = fullLayers.map((l) => l.layer);
    
    return { layerNames, fullLayers };
  } catch (error) {
    console.error("[Movement] Error in fetchLayersList:", error);
    throw error;
  } finally {
    delete pendingRequests.current[requestKey];
  }
};
