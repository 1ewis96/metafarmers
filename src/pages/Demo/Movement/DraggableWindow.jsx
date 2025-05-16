import React, { useState, useRef, useEffect } from "react";

const DraggableWindow = ({ 
  title, 
  children, 
  initialPosition = { x: 20, y: 20 }, 
  initialWidth = 250,
  initialHeight = 400,
  minWidth = 200,
  minHeight = 150,
  onClose,
  zIndex = 100,
  windowId
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState({ x: false, y: false });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);
  
  // Handle mouse down on the header (start dragging)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  // Handle resize start
  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle mouse move (dragging and resizing)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragOffset.x;
        const deltaY = e.clientY - dragOffset.y;
        
        setDragOffset({
          x: e.clientX,
          y: e.clientY
        });
        
        if (resizeDirection.x) {
          const newWidth = Math.max(size.width + deltaX, minWidth);
          setSize(prev => ({ ...prev, width: newWidth }));
        }
        
        if (resizeDirection.y) {
          const newHeight = Math.max(size.height + deltaY, minHeight);
          setSize(prev => ({ ...prev, height: newHeight }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeDirection, size.width, size.height, minWidth, minHeight]);

  return (
    <div
      ref={windowRef}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        background: "#333",
        color: "#fff",
        borderRadius: "6px",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none"
      }}
    >
      {/* Window header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: "8px 12px",
          background: "#444",
          cursor: "move",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #555",
          flexShrink: 0
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "14px" }}>{title}</div>
        {onClose && (
          <button
            onClick={() => onClose(windowId)}
            style={{
              background: "none",
              border: "none",
              color: "#ddd",
              fontSize: "16px",
              cursor: "pointer",
              padding: "0 4px"
            }}
            aria-label="Close window"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Window content */}
      <div style={{ padding: "10px", overflowY: "auto", flexGrow: 1 }}>
        {children}
      </div>
      
      {/* Resize handles */}
      <div 
        className="resize-handle resize-e"
        onMouseDown={(e) => handleResizeStart(e, { x: true, y: false })}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "5px",
          height: "100%",
          cursor: "e-resize"
        }}
      />
      <div 
        className="resize-handle resize-s"
        onMouseDown={(e) => handleResizeStart(e, { x: false, y: true })}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "5px",
          cursor: "s-resize"
        }}
      />
      <div 
        className="resize-handle resize-se"
        onMouseDown={(e) => handleResizeStart(e, { x: true, y: true })}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: "15px",
          height: "15px",
          cursor: "se-resize",
          background: "transparent"
        }}
      />
    </div>
  );
};

export default DraggableWindow;
