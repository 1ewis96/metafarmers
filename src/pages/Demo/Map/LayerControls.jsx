import React from "react";

const LayerControls = ({
  availableLayers,
  currentLayer,
  setCurrentLayer,
  showAddPanel,
  setShowAddPanel,
  showAddTilePanel,
  setShowAddTilePanel,
}) => {
  return (
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
      <select
        value={currentLayer || ""}
        onChange={(e) => setCurrentLayer(e.target.value)}
        style={{ 
          padding: "5px 10px",
          background: "#444",
          color: "#fff",
          border: "1px solid #555",
          borderRadius: "4px" 
        }}
      >
        {availableLayers.map((layer) => (
          <option key={layer} value={layer}>
            {layer}
          </option>
        ))}
      </select>
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
  );
};

export default LayerControls;