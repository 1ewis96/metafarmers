import React, { useState, useEffect } from "react";
import DraggableWindow from "./DraggableWindow";
import UploadModal from "./UploadModal";

const AddObjectPanel = ({ textureCache, textureCanvases, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredObjects, setFilteredObjects] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const hasTextures = Object.keys(textureCache).length > 0;
  const hasCanvases = Object.keys(textureCanvases).length > 0;

  // Update filtered objects when search term or texture cache changes
  useEffect(() => {
    if (!hasTextures) {
      setFilteredObjects([]);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = Object.keys(textureCache).filter(key => 
      key.toLowerCase().includes(lowerSearchTerm)
    );
    
    setFilteredObjects(filtered);
  }, [searchTerm, textureCache, hasTextures]);

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
  };

  return (
    <>
      <DraggableWindow 
        title="Objects" 
        onClose={onClose}
        initialPosition={{ x: window.innerWidth - 280, y: 60 }}
        zIndex={101}
      >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <button
          onClick={handleUploadClick}
          style={{
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#444",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "20px",
            marginRight: "8px"
          }}
        >
          +
        </button>
        <div className="search-container" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search objects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #555",
              borderRadius: "4px",
              background: "#333",
              color: "#fff",
              userSelect: "text",
              WebkitUserSelect: "text",
              MozUserSelect: "text",
              msUserSelect: "text"
            }}
          />
        </div>
      </div>

      <div className="objects-container">
        {!hasTextures ? (
          <p>No objects loaded</p>
        ) : !hasCanvases ? (
          <p>Failed to load object previews. Drag by name below.</p>
        ) : filteredObjects.length === 0 ? (
          <p>No objects match your search</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {filteredObjects.map((key) => (
              <div
                key={key}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("objectName", key)}
                style={{
                  padding: "6px",
                  background: "#444",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  cursor: "grab",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  transition: "transform 0.1s, background 0.2s",
                  ":hover": {
                    background: "#555",
                    transform: "scale(1.02)"
                  }
                }}
              >
                {textureCanvases[key] ? (
                  <img
                    src={textureCanvases[key].toDataURL()}
                    alt={key}
                    style={{ width: "48px", height: "48px", objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span>No preview</span>
                  </div>
                )}
                <span style={{ marginTop: "4px", fontSize: "11px", wordBreak: "break-word" }}>{key}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      </DraggableWindow>
      
      <UploadModal 
        isOpen={showUploadModal}
        onClose={handleCloseUploadModal}
        type="object"
      />
    </>
  );
};

export default AddObjectPanel;