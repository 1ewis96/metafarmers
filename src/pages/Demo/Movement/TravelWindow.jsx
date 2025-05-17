import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import DraggableWindow from './DraggableWindow';

/**
 * TravelWindow component for teleportation functionality
 * Allows the user to input coordinates and teleport to them
 * Now with layer selection capability
 */
const TravelWindow = ({ 
  onClose, 
  windowId, 
  onTeleport, 
  availableLayers = [], 
  currentLayer = '',
  onLayerChange,
  onUserChangeLayer,
  layerDimensions = []
}) => {
  const [destinationX, setDestinationX] = useState(62);
  const [destinationY, setDestinationY] = useState(62);
  const [destinationLayer, setDestinationLayer] = useState(currentLayer);
  const [teleportStatus, setTeleportStatus] = useState('');
  const [includeLayerChange, setIncludeLayerChange] = useState(false);
  const [currentGridSize, setCurrentGridSize] = useState({ width: 124, height: 124 });
  const [destinationGridSize, setDestinationGridSize] = useState({ width: 124, height: 124 });

  // Update destination layer when current layer changes
  useEffect(() => {
    if (currentLayer && !destinationLayer) {
      setDestinationLayer(currentLayer);
    }
  }, [currentLayer, destinationLayer]);
  
  // Update grid sizes when layers or layer dimensions change
  useEffect(() => {
    // Update current layer grid size
    const currentLayerDim = layerDimensions.find(dim => dim.layer === currentLayer);
    if (currentLayerDim) {
      setCurrentGridSize({
        width: currentLayerDim.width || 124,
        height: currentLayerDim.height || 124
      });
    }
    
    // Update destination layer grid size
    const destLayerDim = layerDimensions.find(dim => dim.layer === destinationLayer);
    if (destLayerDim) {
      setDestinationGridSize({
        width: destLayerDim.width || 124,
        height: destLayerDim.height || 124
      });
    }
  }, [currentLayer, destinationLayer, layerDimensions]);

  // Calculate adjusted coordinates for different grid sizes
  const calculateAdjustedCoordinates = () => {
    if (!includeLayerChange || destinationLayer === currentLayer) {
      // No adjustment needed if staying on same layer
      return { x: destinationX, y: destinationY };
    }
    
    // Calculate proportional coordinates when changing between layers with different grid sizes
    const xRatio = destinationGridSize.width / currentGridSize.width;
    const yRatio = destinationGridSize.height / currentGridSize.height;
    
    // Calculate adjusted coordinates proportionally
    const adjustedX = Math.min(Math.floor(destinationX * xRatio), destinationGridSize.width - 1);
    const adjustedY = Math.min(Math.floor(destinationY * yRatio), destinationGridSize.height - 1);
    
    console.log(`[Travel] Adjusting coordinates for different grid sizes:`);
    console.log(`[Travel] Current grid: ${currentGridSize.width}x${currentGridSize.height}, Destination grid: ${destinationGridSize.width}x${destinationGridSize.height}`);
    console.log(`[Travel] Original coordinates: (${destinationX}, ${destinationY}), Adjusted: (${adjustedX}, ${adjustedY})`);
    
    return { x: adjustedX, y: adjustedY };
  };

  // Handle teleport request
  const handleTeleport = () => {
    // Calculate adjusted coordinates if needed
    const { x: adjustedX, y: adjustedY } = calculateAdjustedCoordinates();
    
    console.log(`[Travel] Teleport requested to coordinates: (${adjustedX}, ${adjustedY})`);
    
    // Check if teleport function is available
    if (onTeleport) {
      setTeleportStatus('Teleporting...');
      
      // Call the enhanced teleport function with adjusted coordinates and layer information
      const targetLayer = includeLayerChange && destinationLayer !== currentLayer ? destinationLayer : null;
      
      if (targetLayer) {
        console.log(`[Travel] Using layer-aware teleport to ${targetLayer}`);
      }
      
      // Pass the target layer as the third parameter if we're changing layers
      const success = onTeleport(adjustedX, adjustedY, targetLayer);
      
      if (success) {
        setTeleportStatus('Teleport successful!');
        setTimeout(() => setTeleportStatus(''), 2000); // Clear status after 2 seconds
      } else {
        setTeleportStatus('Teleport failed. Try again.');
      }
    } else {
      console.error('[Travel] Teleport function not available');
      setTeleportStatus('Teleport function not available');
    }
  };

  return (
    <DraggableWindow 
      title="Travel" 
      onClose={onClose}
      windowId={windowId}
      initialPosition={{ x: 20, y: 100 }}
    >
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Destination Coordinates</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control 
                type="number" 
                placeholder="X" 
                value={destinationX}
                onChange={(e) => setDestinationX(parseInt(e.target.value) || 0)}
                min={0}
                max={destinationGridSize.width - 1}
              />
              <Form.Control 
                type="number" 
                placeholder="Y" 
                value={destinationY}
                onChange={(e) => setDestinationY(parseInt(e.target.value) || 0)}
                min={0}
                max={destinationGridSize.height - 1}
              />
            </div>
          </Form.Group>
          
          {/* Layer selection */}
          <Form.Group className="mb-3">
            <Form.Check 
              type="checkbox"
              id="include-layer-change"
              label="Change layer during teleport"
              checked={includeLayerChange}
              onChange={(e) => setIncludeLayerChange(e.target.checked)}
              className="mb-2"
              style={{ color: '#ddd' }}
            />
            
            {includeLayerChange && (
              <>
                <Form.Label>Destination Layer</Form.Label>
                <Form.Select
                  value={destinationLayer || ''} 
                  onChange={(e) => setDestinationLayer(e.target.value)}
                  style={{ 
                    background: '#444',
                    color: '#fff',
                    border: '1px solid #555',
                    marginBottom: '10px'
                  }}
                  disabled={!includeLayerChange}
                >
                  {!availableLayers || availableLayers.length === 0 ? (
                    <option value="">No layers available</option>
                  ) : (
                    availableLayers.map((layer) => {
                      const layerDim = layerDimensions.find(dim => dim.layer === layer);
                      const gridSize = layerDim ? `${layerDim.width}x${layerDim.height}` : 'unknown';
                      return (
                        <option key={layer} value={layer}>
                          {layer} ({gridSize})
                        </option>
                      );
                    })
                  )}
                </Form.Select>
                
                {/* Show grid size warning if different */}
                {includeLayerChange && destinationLayer !== currentLayer && 
                 (destinationGridSize.width !== currentGridSize.width || 
                  destinationGridSize.height !== currentGridSize.height) && (
                  <Alert variant="info" className="mt-2 mb-2" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                    <small>
                      Grid sizes differ: {currentGridSize.width}x{currentGridSize.height} → {destinationGridSize.width}x{destinationGridSize.height}.<br/>
                      Coordinates will be adjusted proportionally.
                    </small>
                  </Alert>
                )}
              </>
            )}
          </Form.Group>
          
          <Button 
            variant="primary" 
            className="w-100 mb-3"
            onClick={handleTeleport}
          >
            Teleport
          </Button>
          
          {teleportStatus && (
            <div className="mt-2 text-center">
              <small className={teleportStatus.includes('successful') ? 'text-success' : teleportStatus.includes('failed') ? 'text-danger' : 'text-info'}>
                {teleportStatus}
              </small>
            </div>
          )}
          
          <div className="mt-3 text-center">
            <small className="text-muted">
              {includeLayerChange && <>Layer will change to {destinationLayer || 'none'}</>}
            </small>
          </div>
        </Form>
      </Card.Body>
    </DraggableWindow>
  );
};

export default TravelWindow;
