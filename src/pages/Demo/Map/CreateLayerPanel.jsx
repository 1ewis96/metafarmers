import React, { useState } from "react";
import DraggableWindow from "./DraggableWindow";

const CreateLayerPanel = ({ onClose, onLayerCreated }) => {
  const [layerName, setLayerName] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateLayer = async () => {
    // Validate required fields
    if (!layerName.trim()) {
      setError("Layer name is required");
      return;
    }
    
    if (!width || !height) {
      setError("Width and height are required");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      // Prepare request body with numeric values
      const widthNum = Number(width);
      const heightNum = Number(height);
      
      // Validate that width and height are valid numbers
      if (isNaN(widthNum) || isNaN(heightNum)) {
        setError("Width and height must be valid numbers");
        setIsCreating(false);
        return;
      }
      
      const requestBody = {
        layer: { 
          layer: layerName
        },
        x: widthNum,
        y: heightNum
      };
      
      console.log("Sending layer creation request:", JSON.stringify(requestBody));

      // Send request to create layer
      const response = await fetch("https://api.metafarmers.io/create/layer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.message === "success" || response.ok) {
        // Layer created successfully - immediately fetch updated layer list
        try {
          const layersResponse = await fetch("https://api.metafarmers.io/list/layers");
          const layersData = await layersResponse.json();
          
          if (layersData && layersData.layers) {
            // Now call the callback with the fresh data
            if (onLayerCreated) {
              onLayerCreated(layersData.layers);
            }
          }
        } catch (fetchErr) {
          console.error("Error fetching updated layers:", fetchErr);
        }
        
        onClose();
      } else {
        setError(data.message || "Failed to create layer");
      }
    } catch (err) {
      console.error("Error creating layer:", err);
      setError("An error occurred while creating the layer");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DraggableWindow
      title="Create New Layer"
      initialPosition={{ x: window.innerWidth / 2 - 150, y: 100 }}
      initialWidth={300}
      initialHeight={250}
      onClose={onClose}
      zIndex={103}
    >
      <div>
        <div style={{ marginBottom: "15px" }}>
          <label 
            htmlFor="layerName" 
            style={{ 
              display: "block", 
              marginBottom: "5px",
              fontWeight: "bold" 
            }}
          >
            Layer Name*
          </label>
          <input
            id="layerName"
            type="text"
            value={layerName}
            onChange={(e) => setLayerName(e.target.value)}
            placeholder="Enter layer name"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #555",
              borderRadius: "4px",
              background: "#333",
              color: "#fff",
              userSelect: "text",
              WebkitUserSelect: "text"
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label 
            htmlFor="width" 
            style={{ 
              display: "block", 
              marginBottom: "5px",
              fontWeight: "bold" 
            }}
          >
            Width*
          </label>
          <input
            id="width"
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="Enter width (number)"
            min="1"
            step="1"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #555",
              borderRadius: "4px",
              background: "#333",
              color: "#fff",
              userSelect: "text",
              WebkitUserSelect: "text"
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label 
            htmlFor="height" 
            style={{ 
              display: "block", 
              marginBottom: "5px",
              fontWeight: "bold" 
            }}
          >
            Height*
          </label>
          <input
            id="height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Enter height (number)"
            min="1"
            step="1"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #555",
              borderRadius: "4px",
              background: "#333",
              color: "#fff",
              userSelect: "text",
              WebkitUserSelect: "text"
            }}
          />
        </div>

        {error && (
          <div 
            style={{ 
              color: "#ff6b6b", 
              marginBottom: "15px",
              fontSize: "14px" 
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 15px",
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateLayer}
            disabled={isCreating}
            style={{
              padding: "8px 15px",
              background: "#4a6da7",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: isCreating ? "wait" : "pointer",
              opacity: isCreating ? 0.7 : 1
            }}
          >
            {isCreating ? "Creating..." : "Create Layer"}
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};

export default CreateLayerPanel;
