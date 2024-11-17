import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Set up the socket connection with sessionKey
const socket = io('https://13.49.67.160', {
  query: {
    sessionKey: localStorage.getItem('sessionKey') || 'WPM4OVU3YyRZLUo', // Use a sessionKey from localStorage or set default
  }
});

const Client = () => {
  const [player, setPlayer] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [playerKey, setPlayerKey] = useState('');
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });

  const playerRef = useRef(null);
  const movementSpeed = 20; // Default movement speed

  // Handle socket connection and player initialization
  useEffect(() => {
    socket.on('initialize', (playerData) => {
      setPlayer(playerData);
      setPlayerPosition({ x: playerData.x, y: playerData.y });
      setPlayerKey(playerData.id.slice(0, 5)); // Get the first 5 characters of player ID for display
    });

    socket.on('newPlayer', (newPlayer) => {
      console.log('New player joined:', newPlayer);
    });

    socket.on('playerMoved', (updatedPlayer) => {
      if (updatedPlayer.id === player?.id) {
        setPlayerPosition({ x: updatedPlayer.x, y: updatedPlayer.y });
      }
    });

    socket.on('playerDisconnected', (playerId) => {
      console.log('Player disconnected:', playerId);
      if (player && player.id === playerId) {
        setPlayer(null);
      }
    });

    return () => {
      socket.off('initialize');
      socket.off('newPlayer');
      socket.off('playerMoved');
      socket.off('playerDisconnected');
    };
  }, [player]);

  // Handle player movement input (W, A, S, D)
  const handleKeyDown = (e) => {
    let directions = [];
    if (e.key === 'W') directions.push('W');
    if (e.key === 'A') directions.push('A');
    if (e.key === 'S') directions.push('S');
    if (e.key === 'D') directions.push('D');
    if (directions.length > 0) {
      socket.emit('move', { directions, speed: movementSpeed });
    }
  };

  // Handle player movement while key is pressed
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Ensure that the grid stays the same size regardless of screen resizing or zooming
  useEffect(() => {
    const handleResize = () => {
      // Code to handle resizing (if necessary)
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div>
      {player ? (
        <div>
          <div
            style={{
              position: 'absolute',
              top: `${playerPosition.y}px`,
              left: `${playerPosition.x}px`,
              width: '50px',
              height: '50px',
              backgroundColor: player.color,
              borderRadius: '50%',
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
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default Client;
