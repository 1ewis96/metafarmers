import React, { useState, useEffect } from "react";
import DraggableWindow from "./DraggableWindow";
import PropertiesModal from "./PropertiesModal";

const CellInfoPanel = ({
  selectedCell,
  setSelectedCell,
  currentLayer,
  placedSprites,
  placedTiles,
  setSpriteUpdateCounter,
  objectPropertiesCache,
}) => {
  const [isPropertiesModalOpen, setIsPropertiesModalOpen] = useState(false);
  const [objectProperties, setObjectProperties] = useState(null);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Get object properties from cache when a cell is selected
  useEffect(() => {
    if (selectedCell && selectedCell.type === 'object' && currentLayer) {
      getObjectPropertiesFromCache();
    } else {
      setObjectProperties(null);
    }
  }, [selectedCell, currentLayer, objectPropertiesCache]);

  const getObjectPropertiesFromCache = () => {
    if (!selectedCell || !currentLayer || selectedCell.type !== 'object') return;
    
    setLoadingProperties(true);
    try {
      // Create the composite key to look up in the cache
      const compositeKey = `${selectedCell.objectName}#${selectedCell.x}#${selectedCell.y}`;
      
      // Get the object data from the cache
      const objectData = objectPropertiesCache[compositeKey];
      
      if (objectData) {
        setObjectProperties(objectData);
        console.log("Retrieved object properties from cache:", objectData);
      } else {
        console.log("Object properties not found in cache for key:", compositeKey);
        setObjectProperties(null);
      }
    } catch (error) {
      console.error("Error retrieving object properties from cache:", error);
      setObjectProperties(null);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleOpenPropertiesModal = () => {
    setIsPropertiesModalOpen(true);
  };

  const handleClosePropertiesModal = () => {
    setIsPropertiesModalOpen(false);
    // Refresh properties after closing modal
    getObjectPropertiesFromCache();
  };

  const handleApplyFunction = (functionType, updates) => {
    // Update the local state if needed
    console.log("Function applied:", functionType, updates);
    // You might want to update the sprite appearance or add visual indicators
    // for objects with functions applied
    setSpriteUpdateCounter((prev) => prev + 1);
    // Refresh properties
    getObjectPropertiesFromCache();
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

  const handleMove = () => {
    if (!selectedCell) return;
    
    // Placeholder for move functionality
    console.log(`Move ${selectedCell.type} at (${selectedCell.x}, ${selectedCell.y})`);
    alert(`Move functionality will be implemented with the new API endpoint.`);
  };

  // Render property information
  const renderPropertyInfo = () => {
    if (!objectProperties) return null;

    const propertyItems = [];

    // Check for teleporter properties
    if (objectProperties.action?.type === "teleport") {
      propertyItems.push(
        <div key="teleporter" style={{ marginBottom: "10px", padding: "6px", background: "#333", borderRadius: "4px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "4px" }}>Teleporter</p>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            Activation: {objectProperties.activationType || "step_on"}
          </p>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            Destination: ({objectProperties.action.destination?.x || 0}, {objectProperties.action.destination?.y || 0})
          </p>
          {objectProperties.action.destination?.layerId && (
            <p style={{ fontSize: "12px", margin: "2px 0" }}>
              Layer: {objectProperties.action.destination.layerId}
            </p>
          )}
          {objectProperties.action.destination?.facing && (
            <p style={{ fontSize: "12px", margin: "2px 0" }}>
              Facing: {objectProperties.action.destination.facing}
            </p>
          )}
        </div>
      );
    }

    // Check for collision properties
    if (objectProperties.collision === true) {
      propertyItems.push(
        <div key="collision" style={{ marginBottom: "10px", padding: "6px", background: "#333", borderRadius: "4px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "4px" }}>Collision</p>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            Object blocks movement
          </p>
        </div>
      );
    }

    // Check for door properties
    if (objectProperties.door === true) {
      propertyItems.push(
        <div key="door" style={{ marginBottom: "10px", padding: "6px", background: "#333", borderRadius: "4px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "4px" }}>Door</p>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            Can be opened/closed
          </p>
        </div>
      );
    }

    if (propertyItems.length === 0) {
      return (
        <p style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "10px" }}>
          No properties set
        </p>
      );
    }

    return (
      <div style={{ marginBottom: "10px" }}>
        <p style={{ fontWeight: "bold", marginBottom: "6px" }}>Properties:</p>
        {propertyItems}
      </div>
    );
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
              
              {loadingProperties ? (
                <p style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "10px" }}>
                  Loading properties...
                </p>
              ) : (
                renderPropertyInfo()
              )}
              
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
                  onClick={handleMove}
                  style={{
                    padding: "6px 12px",
                    background: "#444",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Move
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
                <button
                  onClick={handleMove}
                  style={{
                    padding: "6px 12px",
                    background: "#444",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Move
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