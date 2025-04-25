import React from "react";

const CellInfoPanel = ({
  selectedCell,
  setSelectedCell,
  currentLayer,
  placedSprites,
  setSpriteUpdateCounter,
}) => {
  const handleEject = async () => {
    if (!selectedCell || !selectedCell.objectName) return;

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
  };

  const handleRotate = async () => {
    if (!selectedCell || !selectedCell.objectName) return;

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
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "70px",
        left: "20px",
        width: "250px",
        background: "#fff",
        border: "1px solid #ccc",
        padding: "10px",
        zIndex: 15,
      }}
    >
      <h5>Cell Info</h5>
      <p>
        <strong>Tile:</strong> ({selectedCell.x}, {selectedCell.y})
      </p>
      {selectedCell.objectName ? (
        <>
          <p>
            <strong>Object:</strong> {selectedCell.objectName}
          </p>
          <p>
            <strong>Rotation:</strong> {selectedCell.rotation || 0}°
          </p>
          <button onClick={handleEject}>Eject</button>
          <button
            onClick={handleRotate}
            style={{ marginLeft: "10px" }}
            disabled={!selectedCell.objectName}
          >
            Rotate
          </button>
        </>
      ) : (
        <p>
          <em>No object placed</em>
        </p>
      )}
    </div>
  );
};

export default CellInfoPanel;