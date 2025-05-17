import React, { useState, useEffect } from 'react';
import { Card, Button, Form } from 'react-bootstrap';

/**
 * Debug panel to help test teleportation and other features
 */
const DebugPanel = ({ characterState, onTeleport, forceTeleport }) => {
  const [teleportX, setTeleportX] = useState(13);
  const [teleportY, setTeleportY] = useState(1);
  const [objects, setObjects] = useState([]);
  const [currentLayer, setCurrentLayer] = useState('');

  // Fetch objects for debugging
  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const response = await fetch('https://api.metafarmers.io/objects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'metafarmers-default-key'
          },
          body: JSON.stringify({
            layer: 'layer-1'
          })
        });
        
        const data = await response.json();
        console.log('[Debug] Objects data:', data);
        
        if (data.message === 'success' && Array.isArray(data.data)) {
          setObjects(data.data);
        }
      } catch (error) {
        console.error('[Debug] Error fetching objects:', error);
      }
    };
    
    fetchObjects();
  }, []);

  // Handle manual teleport
  const handleManualTeleport = () => {
    console.log('[Debug] Manual teleport triggered to coordinates:', teleportX, teleportY);
    
    // Create a simple teleport destination object for the current layer
    const teleportDestination = {
      x: Number(teleportX),
      y: Number(teleportY),
      facing: 'down'
    };
    
    // First notify parent about the teleport
    if (onTeleport) {
      console.log('[Debug] Calling onTeleport with:', teleportDestination);
      onTeleport(teleportDestination);
    }
    
    // Direct teleport approach - try multiple times with increasing delays
    const attemptTeleport = (attempt = 1) => {
      console.log(`[Debug] Teleport attempt ${attempt}`);
      
      // Check if forceTeleport is available now
      if (typeof forceTeleport === 'function') {
        try {
          console.log('[Debug] forceTeleport function found, calling it now');
          forceTeleport(teleportDestination);
          return true; // Success
        } catch (error) {
          console.error('[Debug] Error calling forceTeleport:', error);
        }
      } else {
        console.log('[Debug] forceTeleport still not available');
      }
      
      // Try again with increasing delays, up to 5 attempts
      if (attempt < 5) {
        setTimeout(() => attemptTeleport(attempt + 1), attempt * 200);
      }
    };
    
    // Start the teleport attempts
    attemptTeleport();
  };

  // Trigger the teleport object directly
  const handleTriggerTeleport = () => {
    // Find teleport object in the objects array
    const teleportObject = objects.find(obj => 
      obj.action && 
      obj.action.type === 'teleport'
    );
    
    if (teleportObject && teleportObject.action && teleportObject.action.destination) {
      console.log('[Debug] Triggering teleport object:', teleportObject);
      onTeleport(teleportObject.action.destination);
    } else {
      console.error('[Debug] No teleport object found in:', objects);
      // Fallback to the known coordinates
      console.log('[Debug] Using fallback teleport destination');
      onTeleport({
        x: 62,
        y: 62,
        facing: 'up',
        layerId: 'new-layer'
      });
    }
  };
  
  // Teleport directly to center of grid
  const handleTeleportToCenter = () => {
    console.log('[Debug] Teleporting directly to center of current grid');
    
    // Create a complete teleport destination object
    const teleportDestination = {
      x: 62,
      y: 62,
      facing: 'up',
      layerId: 'layer-1', // Use a specific layer ID
      layer: 'layer-1'    // Add the layer property as well for compatibility
    };
    
    // First notify parent about the teleport (for layer changes, etc.)
    onTeleport(teleportDestination);
    
    // Then use the direct forceTeleport function if available
    if (forceTeleport) {
      console.log('[Debug] Using forceTeleport function');
      // Use multiple attempts with increasing delays to ensure it works
      setTimeout(() => {
        console.log('[Debug] First forceTeleport attempt');
        forceTeleport();
        
        // Try again after a longer delay
        setTimeout(() => {
          console.log('[Debug] Second forceTeleport attempt');
          forceTeleport();
        }, 500);
      }, 300);
    }
  };

  return (
    <Card 
      style={{ 
        position: 'absolute', 
        bottom: '50px', 
        right: '10px',
        width: '300px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      }}
    >
      <Card.Header>Debug Panel</Card.Header>
      <Card.Body>
        <div className="mb-2">
          <strong>Current Position:</strong> ({characterState.x}, {characterState.y})
        </div>
        <div className="mb-2">
          <strong>Direction:</strong> {characterState.direction}
        </div>
        <div className="mb-3">
          <strong>Moving:</strong> {characterState.isMoving ? 'Yes' : 'No'}
        </div>
        
        <hr />
        
        <h6>Manual Teleport</h6>
        <Form.Group className="mb-2">
          <Form.Label>X Position:</Form.Label>
          <Form.Control 
            type="number" 
            value={teleportX} 
            onChange={(e) => setTeleportX(e.target.value)} 
            size="sm"
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Y Position:</Form.Label>
          <Form.Control 
            type="number" 
            value={teleportY} 
            onChange={(e) => setTeleportY(e.target.value)} 
            size="sm"
          />
        </Form.Group>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleManualTeleport}
          className="me-2"
        >
          Teleport
        </Button>
        <Button 
          variant="warning" 
          size="sm" 
          onClick={handleTriggerTeleport}
          className="me-2"
        >
          Trigger Test Teleport
        </Button>
        <Button 
          variant="success" 
          size="sm" 
          onClick={handleTeleportToCenter}
        >
          Teleport to Center
        </Button>
        
        <hr />
        
        <div className="mt-2">
          <strong>Objects:</strong> {objects.length}
          <ul style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '12px' }}>
            {objects.map((obj, index) => (
              <li key={index}>
                {obj.object} at ({obj.x}, {obj.y})
                {obj.action && obj.action.type === 'teleport' && ' - Teleport'}
              </li>
            ))}
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DebugPanel;
