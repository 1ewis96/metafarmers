import React from "react";

const DragItemPanel = ({ items }) => {
  const handleDragStart = (e, itemName) => {
    e.dataTransfer.setData("objectName", itemName);
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
      <h4>Objects</h4>
      {items.map((item) => (
        <div
          key={item}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          style={{
            marginBottom: "8px",
            padding: "8px",
            backgroundColor: "#eee",
            borderRadius: "6px",
            cursor: "grab",
            textAlign: "center",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default DragItemPanel;
