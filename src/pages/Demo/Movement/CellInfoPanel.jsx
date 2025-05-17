import React from 'react';
import { Card, Button } from 'react-bootstrap';

/**
 * Component to display information about the selected cell
 */
const CellInfoPanel = ({ selectedCell, onUse }) => {
  if (!selectedCell) {
    return null;
  }

  const handleUse = () => {
    if (onUse) {
      onUse(selectedCell);
    }
  };

  return (
    <Card 
      style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px',
        width: '250px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      }}
    >
      <Card.Header>Cell Information</Card.Header>
      <Card.Body>
        <div>
          <strong>Position:</strong> ({selectedCell.x}, {selectedCell.y})
        </div>
        <div className="mt-2">
          <Button size="sm" onClick={handleUse}>Use</Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CellInfoPanel;
