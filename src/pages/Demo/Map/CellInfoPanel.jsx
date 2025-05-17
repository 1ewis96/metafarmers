import React, { useState } from "react";
import DraggableWindow from "./DraggableWindow";
import PropertiesModal from "./PropertiesModal";

const CellInfoPanel = ({
  selectedCell,
  setSelectedCell,
  currentLayer,
  placedSprites,
  placedTiles,
  setSpriteUpdateCounter,
}) => {
  const [isPropertiesModalOpen, setIsPropertiesModalOpen] = useState(false);

  const handleOpenPropertiesModal = () => {
    setIsPropertiesModalOpen(true);
  };

  const handleClosePropertiesModal = () => {
    setIsPropertiesModalOpen(false);
  };

  const handleApplyFunction = (functionType, updates) => {
    // Update the local state if needed
    console.log("Function applied:", functionType, updates);
    // You might want to update the sprite appearance or add visual indicators
    // for objects with functions applied
    setSpriteUpdateCounter((prev) => prev + 1);
  };

  const handleEject = async () => {
    if (!selectedCell) return;
    
    // Handle different types (object vs tile)
    if (selectedCell.type === 'object' && selectedCell.objectName) {
      // Handle object ejection
      const compositeKey = `${selectedCell.objectName}#${selectedCell.x}#${selectedCell.y}`;

      try {
        const res = await fetch("https://api.metafarmers.io/layer/object/", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layer: currentLayer, compositeKey }),
        });

        const data = await res.json();
        if (data.message === "success") {
          const idx = placedSprites.current.findIndex(
            (sprite) =>
              sprite.metaTileX === selectedCell.x &&
              sprite.metaTileY === selectedCell.y &&
              sprite.metaObjectName === selectedCell.objectName
          );
          if (idx !== -1) {
            placedSprites.current[idx].parent.removeChild(placedSprites.current[idx]);
            placedSprites.current[idx].destroy();
            placedSprites.current.splice(idx, 1);
            setSpriteUpdateCounter((prev) => prev + 1);
          }
          setSelectedCell(null);
        }
      } catch (err) {
        console.error("Error ejecting object:", err);
      }
    } else if (selectedCell.type === 'tile' && selectedCell.tileName) {
      // Handle tile ejection
      const compositeKey = `${selectedCell.tileName}#${selectedCell.x}#${selectedCell.y}`;
      
      try {
        const res = await fetch("https://api.metafarmers.io/layer/tile/", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layer: currentLayer, compositeKey }),
        });

        const data = await res.json();
        if (data.message === "success") {
          const idx = placedTiles.current.findIndex(
            (tile) =>
              tile.metaTileX === selectedCell.x &&
              tile.metaTileY === selectedCell.y &&
              tile.metaTileName === selectedCell.tileName
          );
          if (idx !== -1) {
            placedTiles.current[idx].parent.removeChild(placedTiles.current[idx]);
            placedTiles.current[idx].destroy();
            placedTiles.current.splice(idx, 1);
            setSpriteUpdateCounter((prev) => prev + 1);
          }
          setSelectedCell(null);
        }
      } catch (err) {
        console.error("Error ejecting tile:", err);
      }
    }
  };

  const handleRotate = async () => {
    if (!selectedCell) return;
    
    if (selectedCell.type === 'object' && selectedCell.objectName) {
      // Handle object rotation
      const sprite = placedSprites.current.find(
        (s) =>
          s.metaTileX === selectedCell.x &&
          s.metaTileY === selectedCell.y &&
          s.metaObjectName === selectedCell.objectName
      );
      if (!sprite) return;

      const newRotation = (sprite.metaRotation + 90) % 360;
      sprite.rotation = (newRotation * Math.PI) / 180;
      sprite.metaRotation = newRotation;

      const compositeKey = `${selectedCell.objectName}#${selectedCell.x}#${selectedCell.y}`;

      try {
        const res = await fetch("https://api.metafarmers.io/layer/object/rotate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer: currentLayer,
            compositeKey,
            rotation: newRotation,
          }),
        });

        const data = await res.json();
        if (data.message === "success") {
          setSelectedCell({ ...selectedCell, rotation: newRotation });
          setSpriteUpdateCounter((prev) => prev + 1);
        } else {
          sprite.rotation = (sprite.metaRotation * Math.PI) / 180;
          sprite.metaRotation = selectedCell.rotation;
        }
      } catch (err) {
        console.error("Error rotating object:", err);
        sprite.rotation = (sprite.metaRotation * Math.PI) / 180;
        sprite.metaRotation = selectedCell.rotation;
      }
    } else if (selectedCell.type === 'tile' && selectedCell.tileName) {
      // Handle tile rotation
      const tile = placedTiles.current.find(
        (t) =>
          t.metaTileX === selectedCell.x &&
          t.metaTileY === selectedCell.y &&
          t.metaTileName === selectedCell.tileName
      );
      if (!tile) return;

      const newRotation = (tile.metaRotation + 90) % 360;
      tile.rotation = (newRotation * Math.PI) / 180;
      tile.metaRotation = newRotation;

      const compositeKey = `${selectedCell.tileName}#${selectedCell.x}#${selectedCell.y}`;

      try {
        const res = await fetch("https://api.metafarmers.io/layer/tile/rotate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer: currentLayer,
            compositeKey,
            rotation: newRotation,
          }),
        });

        const data = await res.json();
        if (data.message === "success") {
          setSelectedCell({ ...selectedCell, rotation: newRotation });
          setSpriteUpdateCounter((prev) => prev + 1);
        } else {
          tile.rotation = (tile.metaRotation * Math.PI) / 180;
          tile.metaRotation = selectedCell.rotation;
        }
      } catch (err) {
        console.error("Error rotating tile:", err);
        tile.rotation = (tile.metaRotation * Math.PI) / 180;
        tile.metaRotation = selectedCell.rotation;
      }
    }
  };

  return (
    <>
      <DraggableWindow
        title="Cell Info"
        initialPosition={{ x: 20, y: 70 }}
        initialWidth={250}
        initialHeight={200}
        zIndex={102}
      >
        <div>
          <p style={{ marginBottom: "8px" }}>
            <strong>Tile:</strong> ({selectedCell.x}, {selectedCell.y})
          </p>
          {selectedCell.type === 'object' ? (
            <>
              <p style={{ marginBottom: "8px" }}>
                <strong>Type:</strong> Object
              </p>
              <p style={{ marginBottom: "8px" }}>
                <strong>Object:</strong> {selectedCell.objectName}
              </p>
              <p style={{ marginBottom: "12px" }}>
                <strong>Rotation:</strong> {selectedCell.rotation || 0}°
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button 
                  onClick={handleEject}
                  style={{
                    padding: "6px 12px",
                    background: "#444",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Eject
                </button>
                <button
                  onClick={handleRotate}
                  style={{
                    padding: "6px 12px",
                    background: "#444",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Rotate
                </button>
                <button
                  onClick={handleOpenPropertiesModal}
                  style={{
                    padding: "6px 12px",
                    background: "#444",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Properties
                </button>
              </div>
            </>
          ) : selectedCell.type === 'tile' ? (
            <>
              <p style={{ marginBottom: "8px" }}>
                <strong>Type:</strong> Tile
              </p>
              <p style={{ marginBottom: "8px" }}>
                <strong>Tile:</strong> {selectedCell.tileName}
              </p>
              <p style={{ marginBottom: "12px" }}>
                <strong>Rotation:</strong> {selectedCell.rotation || 0}°
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  onClick={handleEject}
                  style={{
                    padding: "6px 12px",
                    background: "#444",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Eject
                </button>
                <button
                  onClick={handleRotate}
                  style={{
                    padding: "6px 12px",
                    background: "#444",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Rotate
                </button>
              </div>
            </>
          ) : (
            <p>
              <em>Empty cell</em>
            </p>
          )}
        </div>
      </DraggableWindow>

      {selectedCell.type === 'object' && (
        <PropertiesModal
          isOpen={isPropertiesModalOpen}
          onClose={handleClosePropertiesModal}
          selectedCell={selectedCell}
          currentLayer={currentLayer}
          onApplyFunction={handleApplyFunction}
        />
      )}
    </>
  );
};

export default CellInfoPanel;