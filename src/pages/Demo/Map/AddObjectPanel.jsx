import React from "react";

const AddObjectPanel = ({ textureCache, textureCanvases }) => {
  const hasTextures = Object.keys(textureCache).length > 0;
  const hasCanvases = Object.keys(textureCanvases).length > 0;

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "20px",
        width: "200px",
        background: "#fff",
        border: "1px solid #ccc",
        padding: "10px",
        maxHeight: "70vh",
        overflowY: "auto",
        zIndex: 10,
      }}
    >
      <h5>Drag Object</h5>
      {!hasTextures ? (
        <p>No textures loaded</p>
      ) : !hasCanvases ? (
        <p>Failed to load texture previews. Drag by name below.</p>
      ) : (
        Object.keys(textureCache).map((key) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("objectName", key)}
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
            {textureCanvases[key] ? (
              <img
                src={textureCanvases[key].toDataURL()}
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

export default AddObjectPanel;