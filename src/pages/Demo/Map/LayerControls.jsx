import React, { useState } from "react";
import CreateLayerPanel from "./CreateLayerPanel";

const LayerControls = ({
  availableLayers,
  currentLayer,
  setCurrentLayer,
  showAddPanel,
  setShowAddPanel,
  showAddTilePanel,
  setShowAddTilePanel,
  onLayerCreated,
}) => {
  const [showCreateLayerPanel, setShowCreateLayerPanel] = useState(false);
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 10,
          display: "flex",
          gap: "10px",
          background: "rgba(42, 42, 42, 0.8)",
          padding: "10px",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <select
            value={currentLayer || ""}
            onChange={(e) => setCurrentLayer(e.target.value)}
            style={{ 
              padding: "5px 10px",
              background: "#444",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "4px 0 0 4px",
              borderRight: "none"
            }}
          >
            {availableLayers.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateLayerPanel(true)}
            title="Create New Layer"
            style={{
              padding: "5px 8px",
              background: "#444",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "0 4px 4px 0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%"
            }}
          >
            +
          </button>
        </div>
        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          style={{ 
            padding: "5px 10px",
            background: showAddPanel ? "#555" : "#444",
            color: "#fff",
            border: "1px solid #666",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background 0.2s"
          }}
        >
          {showAddPanel ? "Hide Objects" : "Show Objects"}
        </button>
        <button
          onClick={() => setShowAddTilePanel(!showAddTilePanel)}
          style={{ 
            padding: "5px 10px",
            background: showAddTilePanel ? "#555" : "#444",
            color: "#fff",
            border: "1px solid #666",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background 0.2s"
          }}
        >
          {showAddTilePanel ? "Hide Tiles" : "Show Tiles"}
        </button>
      </div>

      {showCreateLayerPanel && (
        <CreateLayerPanel 
          onClose={() => setShowCreateLayerPanel(false)}
          onLayerCreated={onLayerCreated}
        />
      )}
    </>
  );
};

export default LayerControls;