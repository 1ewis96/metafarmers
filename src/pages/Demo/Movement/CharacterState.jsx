import React from 'react';
import DraggableWindow from './DraggableWindow';

const CharacterState = ({ characterState, onClose, windowId }) => {
  // Get movement status from the state machine
  const movementStatus = characterState.state ? characterState.state.charAt(0).toUpperCase() + characterState.state.slice(1) : 
    (characterState.isSprinting ? 'Running' : characterState.isMoving ? 'Walking' : 'Idle');
    
  // Set colors based on state
  const stateColors = {
    idle: '#adb5bd',
    walking: '#4dabf7',
    running: '#ff6b6b',
    interacting: '#82c91e'
  };
  
  const statusColor = characterState.state ? stateColors[characterState.state] : 
    (characterState.isSprinting ? '#ff6b6b' : characterState.isMoving ? '#4dabf7' : '#adb5bd');
    
  const progressValue = characterState.state === 'running' || characterState.isSprinting ? 100 : 
    characterState.state === 'walking' || characterState.isMoving ? 50 : 
    characterState.state === 'interacting' ? 75 : 0;
  
  return (
    <DraggableWindow 
      title="Character State" 
      initialPosition={{ x: 280, y: 150 }}
      initialWidth={280}
      initialHeight={220}
      onClose={onClose}
      windowId={windowId}
    >
      <div>
        <div style={{ marginBottom: '15px' }}>
          <table style={{ width: '100%', color: '#ddd', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0' }}><strong>Grid Cell X:</strong></td>
                <td style={{ textAlign: 'right' }}>{characterState.x}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}><strong>Grid Cell Y:</strong></td>
                <td style={{ textAlign: 'right' }}>{characterState.y}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}><strong>Position in Cell:</strong></td>
                <td style={{ textAlign: 'right' }}>
                  {characterState.cellX !== undefined ? 
                    `${(characterState.cellX * 100).toFixed(1)}%, ${(characterState.cellY * 100).toFixed(1)}%` : 
                    'N/A'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}><strong>Pixel X:</strong></td>
                <td style={{ textAlign: 'right' }}>{characterState.pixelX}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}><strong>Pixel Y:</strong></td>
                <td style={{ textAlign: 'right' }}>{characterState.pixelY}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}><strong>Direction:</strong></td>
                <td style={{ textAlign: 'right', textTransform: 'capitalize' }}>{characterState.direction}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}><strong>Moving:</strong></td>
                <td style={{ textAlign: 'right' }}>{characterState.isMoving ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}><strong>Sprinting:</strong></td>
                <td style={{ textAlign: 'right' }}>{characterState.isSprinting ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}><strong>State:</strong></td>
                <td style={{ textAlign: 'right', textTransform: 'capitalize' }}>{characterState.state || 'Idle'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '5px', fontSize: '14px', color: '#ddd' }}>
            <strong>Status:</strong> {movementStatus}
          </div>
          <div style={{ 
            width: '100%', 
            height: '20px', 
            backgroundColor: '#444',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressValue}%`,
              height: '100%',
              backgroundColor: statusColor,
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {movementStatus}
            </div>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};

export default CharacterState;