import React from 'react';
import DraggableWindow from './DraggableWindow';

const SkinSelector = ({ skins, selectedSkin, setSelectedSkin, onClose, windowId }) => {
  return (
    <DraggableWindow 
      title="Character Skin" 
      initialPosition={{ x: 280, y: 20 }}
      initialWidth={250}
      initialHeight={120}
      onClose={onClose}
      windowId={windowId}
    >
      <div>
        <label 
          htmlFor="skin-select" 
          style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px',
            color: '#ddd'
          }}
        >
          Select Character Skin
        </label>
        <select
          id="skin-select"
          value={selectedSkin}
          onChange={(e) => setSelectedSkin(e.target.value)}
          style={{ 
            width: '100%',
            padding: '6px 8px',
            background: '#444',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        >
          {skins.map((skin) => (
            <option key={skin} value={skin}>
              {skin}
            </option>
          ))}
        </select>
      </div>
    </DraggableWindow>
  );
};

export default SkinSelector;