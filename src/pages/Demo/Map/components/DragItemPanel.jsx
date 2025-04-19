import React, { useRef } from "react";

const DragItemPanel = ({ items }) => {
  const dragImageRef = useRef(null);

  const handleDragStart = (e, itemName, spriteUrl) => {
    e.dataTransfer.setData("objectName", itemName);

    if (dragImageRef.current) {
      dragImageRef.current.src = spriteUrl; // update the image source
      e.dataTransfer.setDragImage(dragImageRef.current, 32, 32); // center the drag image
    }
  };

  return (
    <div style={{
      position: "absolute",
      top: 10,
      left: 10,
      backgroundColor: "white",
      padding: "10px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      width: "160px",
      maxHeight: "80vh",
      overflowY: "auto",
    }}>
      {/* Hidden drag image */}
      <img ref={dragImageRef} style={{ position: "absolute", top: "-1000px", pointerEvents: "none" }} alt="drag" />

      <h4>Objects</h4>
      {items.map((item) => (
        <div
          key={item.name}
          draggable
          onDragStart={(e) => handleDragStart(e, item.name, item.spriteUrl)}
          style={{
            marginBottom: "8px",
            padding: "8px",
            backgroundColor: "#eee",
            borderRadius: "6px",
            cursor: "grab",
            textAlign: "center",
          }}
        >
          <img src={item.spriteUrl} alt={item.name} style={{ width: "32px", height: "32px", objectFit: "contain", marginBottom: "4px" }} />
          <div>{item.name}</div>
        </div>
      ))}
    </div>
  );
};

export default DragItemPanel;
