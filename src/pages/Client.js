import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Set up the socket connection with sessionKey
const socket = io('https://13.49.67.160', {
  query: {
    sessionKey: localStorage.getItem('sessionKey') || 'WPM4OVU3YyRZLUo', // Use a sessionKey from localStorage or set default
  }
});

const gridSize = 50; // Size of each grid square in pixels
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

const Client = () => {
  const [player, setPlayer] = useState(null);
  const [playerKey, setPlayerKey] = useState('');
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  const movementSpeed = 20; // Default movement speed

  // Handle socket connection and player initialization
  useEffect(() => {
    socket.on('initialize', (playerData) => {
      setPlayer(playerData);
      setPlayerPosition({ x: playerData.x, y: playerData.y });
      setPlayerKey(playerData.id.slice(0, 5)); // Get the first 5 characters of player ID for display
    });

socket.on('playerMoved', (updatedPlayer) => {
  if (updatedPlayer.id === player?.id) {
    // Snap player position to gridSize increments
    setPlayerPosition({
      x: Math.round(updatedPlayer.x / gridSize) * gridSize,
      y: Math.round(updatedPlayer.y / gridSize) * gridSize,
    });
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
  const offsetX = viewportWidth / 2 - (Math.floor(playerPosition.x / gridSize) * gridSize) - (playerPosition.x % gridSize);
  const offsetY = viewportHeight / 2 - (Math.floor(playerPosition.y / gridSize) * gridSize) - (playerPosition.y % gridSize);
  setGridOffset({ x: offsetX, y: offsetY });
}, [playerPosition]);

  // Handle keydown events for movement
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Render the grid
const renderGrid = () => {
  const cols = Math.ceil(viewportWidth / gridSize);
  const rows = Math.ceil(viewportHeight / gridSize);

  const gridLines = [];

  // Calculate the top-left corner of the grid (anchor point)
  const startX = Math.floor(playerPosition.x / gridSize) * gridSize - (cols / 2) * gridSize;
  const startY = Math.floor(playerPosition.y / gridSize) * gridSize - (rows / 2) * gridSize;

  for (let col = -1; col < cols + 1; col++) {
    gridLines.push(
      <div
        key={`v-${col}`}
        style={{
          position: 'absolute',
          top: 0,
          left: `${startX + col * gridSize - playerPosition.x + viewportWidth / 2}px`,
          height: `${viewportHeight}px`,
          width: '1px',
          backgroundColor: '#555',
        }}
      />
    );
  }

  for (let row = -1; row < rows + 1; row++) {
    gridLines.push(
      <div
        key={`h-${row}`}
        style={{
          position: 'absolute',
          top: `${startY + row * gridSize - playerPosition.y + viewportHeight / 2}px`,
          left: 0,
          width: `${viewportWidth}px`,
          height: '1px',
          backgroundColor: '#555',
        }}
      />
    );
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
          <p>Position: X: {playerPosition.x} Y: {playerPosition.y}</p>
          <p>Speed: {movementSpeed}</p>
        </div>
      )}
    </div>
  );
};

export default Client;
