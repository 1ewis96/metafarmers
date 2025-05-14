import React from "react";

const AddTilePanel = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "230px", // Adjusted to position next to AddObjectPanel
        width: "200px",
        background: "#fff",
        border: "1px solid #ccc",
        padding: "10px",
        maxHeight: "70vh",
        overflowY: "auto",
        zIndex: 10,
      }}
    >
      <h5>Drag Tile</h5>
      <p>Tile selection will be implemented here.</p>
    </div>
  );
};

export default AddTilePanel;
