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
        position: "fixed",
        top: "10px",
        left: "20px",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.9)",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
      }}
    >
      <select
        value={currentLayer || ""}
        onChange={(e) => setCurrentLayer(e.target.value)}
        style={{ marginRight: "10px" }}
      >
        {availableLayers.map((layer) => (
          <option key={layer} value={layer}>
            {layer}
          </option>
        ))}
      </select>
      <button onClick={() => setShowAddPanel(!showAddPanel)} style={{ marginRight: "10px" }}>
        {showAddPanel ? "Close Object Panel" : "Add Object"}
      </button>
      <button onClick={() => setShowAddTilePanel(!showAddTilePanel)}>
        {showAddTilePanel ? "Close Tile Panel" : "Add Tile"}
      </button>
    </div>
  );
};

export default LayerControls;