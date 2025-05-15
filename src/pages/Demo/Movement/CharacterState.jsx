import React from 'react';
import DraggableWindow from './DraggableWindow';

const CharacterState = ({ characterState }) => {
  // Get movement status
  const movementStatus = characterState.isSprinting ? 'Sprinting' : characterState.isMoving ? 'Walking' : 'Idle';
  const statusColor = characterState.isSprinting ? '#ff6b6b' : characterState.isMoving ? '#4dabf7' : '#adb5bd';
  const progressValue = characterState.isSprinting ? 100 : characterState.isMoving ? 50 : 0;
  
  return (
    <DraggableWindow 
      title="Character State" 
      initialPosition={{ x: 280, y: 150 }}
      initialWidth={280}
      initialHeight={220}
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