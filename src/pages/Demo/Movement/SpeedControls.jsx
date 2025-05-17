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
            Walk Speed: {speed.walk.toFixed(1)}
          </label>
          <input
            id="walk-speed"
            type="range"
            min={0.5}
            max={5}
            step={0.1}
            value={speed.walk}
            onChange={(e) =>
              setSpeed((prev) => ({ ...prev, walk: parseFloat(e.target.value) }))
            }
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
            Recommended: 1.0 (slow) to 3.0 (fast)
          </div>
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
            Sprint Speed: {speed.sprint.toFixed(1)}
          </label>
          <input
            id="sprint-speed"
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={speed.sprint}
            onChange={(e) =>
              setSpeed((prev) => ({ ...prev, sprint: parseFloat(e.target.value) }))
            }
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
            Recommended: 2.0 (slow) to 6.0 (fast)
          </div>
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <label 
            htmlFor="animation-fps" 
            style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px',
              color: '#ddd'
            }}
          >
            Animation FPS: {speed.animationFps || 12}
          </label>
          <input
            id="animation-fps"
            type="range"
            min={5}
            max={20}
            step={1}
            value={speed.animationFps || 12}
            onChange={(e) =>
              setSpeed((prev) => ({ ...prev, animationFps: parseInt(e.target.value) }))
            }
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </DraggableWindow>
  );
};

export default SpeedControls;