import React from 'react';
import DraggableWindow from './DraggableWindow';

const SpeedControls = ({ speed, setSpeed, onClose, windowId }) => {
  return (
    <DraggableWindow 
      title="Speed Controls" 
      initialPosition={{ x: 20, y: 150 }}
      initialWidth={250}
      initialHeight={180}
      onClose={onClose}
      windowId={windowId}
    >
      <div>
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="walk-speed" 
            style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px',
              color: '#ddd'
            }}
          >
            Walk Speed: {speed.walk}
          </label>
          <input
            id="walk-speed"
            type="range"
            min={1}
            max={10}
            value={speed.walk}
            onChange={(e) =>
              setSpeed((prev) => ({ ...prev, walk: parseInt(e.target.value) }))
            }
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label 
            htmlFor="sprint-speed" 
            style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px',
              color: '#ddd'
            }}
          >
            Sprint Speed: {speed.sprint}
          </label>
          <input
            id="sprint-speed"
            type="range"
            min={5}
            max={15}
            value={speed.sprint}
            onChange={(e) =>
              setSpeed((prev) => ({ ...prev, sprint: parseInt(e.target.value) }))
            }
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </DraggableWindow>
  );
};

export default SpeedControls;