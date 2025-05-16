import React from 'react';
import DraggableWindow from './DraggableWindow';

const LayerSelector = ({ availableLayers, currentLayer, setCurrentLayer, onUserChangeLayer, onClose, windowId }) => {
  return (
    <DraggableWindow 
      title="Layer Selector" 
      initialPosition={{ x: 20, y: 20 }}
      initialWidth={250}
      initialHeight={120}
      onClose={onClose}
      windowId={windowId}
    >
      <div>
        <label 
          htmlFor="layer-select" 
          style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px',
            color: '#ddd'
          }}
        >
          Select Map Layer
        </label>
        <select
          id="layer-select"
          value={currentLayer || ''} 
          onChange={(e) => {
            // Mark this as a user-initiated layer change
            if (onUserChangeLayer) onUserChangeLayer();
            setCurrentLayer(e.target.value);
          }}
          style={{ 
            width: '100%',
            padding: '6px 8px',
            background: '#444',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        >
          {!availableLayers || availableLayers.length === 0 ? (
            <option value="">No layers available</option>
          ) : (
            availableLayers.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))
          )}
        </select>
      </div>
    </DraggableWindow>
  );
};

export default LayerSelector;
