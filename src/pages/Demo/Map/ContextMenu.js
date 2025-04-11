import React, { useEffect } from "react";
import { ListGroup } from "react-bootstrap";

const ContextMenu = ({ visible, x, y, object, onSelect, onClose }) => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".context-menu")) {
      onClose();
    }
  };

  useEffect(() => {
    if (visible) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [visible]);

  if (!visible || !object) return null;

  return (
    <ListGroup className="position-absolute context-menu" style={{ left: x, top: y, zIndex: 1000 }}>
      <ListGroup.Item onClick={() => onSelect("View Details")}>View Details</ListGroup.Item>
      <ListGroup.Item onClick={() => onSelect("Remove Object")}>Remove Object</ListGroup.Item>
      <ListGroup.Item onClick={() => onSelect("Mark as Important")}>Mark as Important</ListGroup.Item>
      <ListGroup.Item onClick={() => onSelect("Cancel")}>Cancel</ListGroup.Item>
    </ListGroup>
  );
};

export default ContextMenu;