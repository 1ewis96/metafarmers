import React, { useState, useEffect } from "react";
import DraggableWindow from "./DraggableWindow";
import UploadModal from "./UploadModal";

const AddTilePanel = ({ tileCache, tileCanvases, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTiles, setFilteredTiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const hasTiles = tileCache && Object.keys(tileCache).length > 0;
  const hasCanvases = tileCanvases && Object.keys(tileCanvases).length > 0;

  // Update filtered tiles when search term or tile cache changes
  useEffect(() => {
    if (!hasTiles) {
      setFilteredTiles([]);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = Object.keys(tileCache).filter(key => 
      key.toLowerCase().includes(lowerSearchTerm)
    );
    
    setFilteredTiles(filtered);
  }, [searchTerm, tileCache, hasTiles]);

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
  };

  return (
    <>
      <DraggableWindow 
        title="Tiles" 
        onClose={onClose}
        initialPosition={{ x: window.innerWidth - 550, y: 60 }}
        zIndex={100}
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
            placeholder="Search tiles..."
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

      <div className="tiles-container">
        {!hasTiles ? (
          <p>No tiles loaded</p>
        ) : !hasCanvases ? (
          <p>Failed to load tile previews. Drag by name below.</p>
        ) : filteredTiles.length === 0 ? (
          <p>No tiles match your search</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {filteredTiles.map((key) => (
              <div
                key={key}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("tileName", key)}
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
                {tileCanvases[key] ? (
                  <img
                    src={tileCanvases[key].toDataURL()}
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
        type="tile"
      />
    </>
  );
};

export default AddTilePanel;
