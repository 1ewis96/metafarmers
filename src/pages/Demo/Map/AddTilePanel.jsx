import React from "react";

const AddTilePanel = ({ tileCache, tileCanvases }) => {
  const hasTiles = tileCache && Object.keys(tileCache).length > 0;
  const hasCanvases = tileCanvases && Object.keys(tileCanvases).length > 0;

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
      {!hasTiles ? (
        <p>No tiles loaded</p>
      ) : !hasCanvases ? (
        <p>Failed to load tile previews. Drag by name below.</p>
      ) : (
        Object.keys(tileCache).map((key) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("tileName", key)}
            style={{
              margin: "8px 0",
              padding: "6px",
              background: "#eee",
              border: "1px solid #aaa",
              cursor: "grab",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            {tileCanvases[key] ? (
              <img
                src={tileCanvases[key].toDataURL()}
                alt={key}
                style={{ width: "48px", height: "48px", objectFit: "contain" }}
              />
            ) : (
              <span>Preview unavailable</span>
            )}
            <span style={{ marginTop: "4px", fontSize: "12px" }}>{key}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default AddTilePanel;
