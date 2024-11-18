import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Set up the socket connection with sessionKey
const socket = io('https://13.49.67.160', {
  query: {
    sessionKey: localStorage.getItem('sessionKey') || 'WPM4OVU3YyRZLUo', // Use a sessionKey from localStorage or set default
  }
});

const gridSize = 100; // Size of each grid cell in pixels
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

const Client = () => {
  const [player, setPlayer] = useState(null);
  const [playerKey, setPlayerKey] = useState('');
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  const movementSpeed = 20; // Default movement speed

  // Calculate the current cell based on player position
  const currentCell = {
    x: Math.floor(playerPosition.x / gridSize),
    y: Math.floor(playerPosition.y / gridSize),
  };

  // Handle socket connection and player initialization
  useEffect(() => {
    socket.on('initialize', (playerData) => {
      setPlayer(playerData);
      setPlayerPosition({ x: playerData.x, y: playerData.y });
      setPlayerKey(playerData.id.slice(0, 5)); // Get the first 5 characters of player ID for display
    });

    socket.on('playerMoved', (updatedPlayer) => {
      if (updatedPlayer.id === player?.id) {
        setPlayerPosition({ x: updatedPlayer.x, y: updatedPlayer.y });
      }
    });

    return () => {
      socket.off('initialize');
      socket.off('playerMoved');
    };
  }, [player]);

  // Handle player movement input (W, A, S, D)
  const handleKeyDown = (e) => {
    const directions = [];
    if (e.key === 'w' || e.key === 'W') directions.push('W');
    if (e.key === 'a' || e.key === 'A') directions.push('A');
    if (e.key === 's' || e.key === 'S') directions.push('S');
    if (e.key === 'd' || e.key === 'D') directions.push('D');

    if (directions.length > 0) {
      socket.emit('move', { directions, speed: movementSpeed });
    }
  };

  // Update grid offset to center the player
  useEffect(() => {
    const offsetX = viewportWidth / 2 - playerPosition.x;
    const offsetY = viewportHeight / 2 - playerPosition.y;
    setGridOffset({ x: offsetX, y: offsetY });
  }, [playerPosition]);

  // Handle keydown events for movement
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Render the grid with cell labels
  const renderGrid = () => {
    const cols = Math.ceil(viewportWidth / gridSize);
    const rows = Math.ceil(viewportHeight / gridSize);

    const gridLines = [];
    for (let col = -cols / 2; col < cols / 2; col++) {
      for (let row = -rows / 2; row < rows / 2; row++) {
        const cellX = currentCell.x + col;
        const cellY = currentCell.y + row;

        gridLines.push(
          <div
            key={`cell-${cellX}-${cellY}`}
            style={{
              position: 'absolute',
              top: `${gridOffset.y + row * gridSize}px`,
              left: `${gridOffset.x + col * gridSize}px`,
              width: `${gridSize}px`,
              height: `${gridSize}px`,
              border: '1px solid #555',
              boxSizing: 'border-box',
            }}
          >
            {/* Render cell coordinates */}
            <span
              style={{
                fontSize: '10px',
                color: '#999',
                position: 'absolute',
                bottom: '2px',
                right: '2px',
              }}
            >
              {`${cellX}, ${cellY}`}
            </span>
          </div>
        );
      }
    }

    return gridLines;
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#222',
      }}
    >
      {renderGrid()}

      {player && (
        <div
          style={{
            position: 'absolute',
            top: `${viewportHeight / 2}px`, // Centered on the screen
            left: `${viewportWidth / 2}px`, // Centered on the screen
            width: '50px',
            height: '50px',
            backgroundColor: player.color,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {playerKey}
          </div>
        </div>
      )}

      {player && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '10px',
          }}
        >
          <h4>Player Info:</h4>
          <p>Player ID: {player.id}</p>
          <p>Position: X: {playerPosition.x.toFixed(2)} Y: {playerPosition.y.toFixed(2)}</p>
          <p>Current Cell: {`${currentCell.x}, ${currentCell.y}`}</p>
          <p>Speed: {movementSpeed}</p>
        </div>
      )}
    </div>
  );
};

export default Client;
