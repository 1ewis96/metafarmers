import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie'; // Import js-cookie to handle cookies
import Subnav from '../components/subnav'; // Ensure correct import path

// Get the sessionKey from cookies
const sessionKey = Cookies.get('sessionKey'); // Assuming 'sessionKey' is stored in the cookies
console.log('Session Key:', sessionKey); // Check if the sessionKey is correct

// Connect to the Node.js server using the provided IP
const socket = io('https://13.49.67.160', {
  transports: ['websocket'],
  query: { sessionKey }, // Send the sessionKey to the server as a query parameter
});

const Client = () => {
  const [players, setPlayers] = useState({});
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [localPlayerId, setLocalPlayerId] = useState(null);
  const [movementSpeed, setMovementSpeed] = useState(20); // Movement speed state
  const [currentGrid, setCurrentGrid] = useState({ x: 0, y: 0, z: 0 }); // Tracking grid position
  const [isCreatorMode, setIsCreatorMode] = useState(false); // Toggle for creator mode

  useEffect(() => {
    // Listen for 'initialize' event when the server sends the local player's data
    socket.on('initialize', (localPlayerData) => {
      setLocalPlayerId(localPlayerData.id); // Store the local player's ID
      setPlayers((prev) => ({ ...prev, [localPlayerData.id]: localPlayerData }));
    });

    // Listen for other players joining
    socket.on('newPlayer', (newPlayer) => {
      setPlayers((prev) => ({ ...prev, [newPlayer.id]: newPlayer }));
    });

    // Update players when they move
    socket.on('playerMoved', (playerData) => {
      setPlayers((prev) => ({ ...prev, [playerData.id]: playerData }));
    });

    // Handle player disconnection
    socket.on('playerDisconnected', (playerId) => {
      setPlayers((prev) => {
        const updatedPlayers = { ...prev };
        delete updatedPlayers[playerId];
        return updatedPlayers;
      });
    });

    // Cleanup when the component unmounts
    return () => {
      socket.off('initialize');
      socket.off('newPlayer');
      socket.off('playerMoved');
      socket.off('playerDisconnected');
    };
  }, []);

  // Handle keypresses (WASD movement)
  const handleKeyDown = (event) => {
    const direction = event.key.toUpperCase();
    if (['W', 'A', 'S', 'D'].includes(direction)) {
      socket.emit('move', direction); // Send the move direction to the server
    }

    // If B is pressed, toggle creator mode
    if (event.key === 'B' || event.key === 'b') {
      setIsCreatorMode((prev) => !prev);
    }
  };

  // Update the camera to follow the local player's ball
  useEffect(() => {
    if (localPlayerId) {
      const currentPlayer = players[localPlayerId]; // Get the local player by ID
      if (currentPlayer) {
        setCamera({
          x: currentPlayer.x - window.innerWidth / 2, // Center camera on player's ball
          y: currentPlayer.y - window.innerHeight / 2,
        });
      }
    }
  }, [players, localPlayerId]); // Recalculate camera position whenever players or localPlayerId changes

  // Update grid when mouse moves over the game area
  const handleMouseMove = (event) => {
    const gridSize = 50; // Each grid square is 50px
    const gridX = Math.floor((event.clientX + camera.x) / gridSize);
    const gridY = Math.floor((event.clientY + camera.y) / gridSize);

    setCurrentGrid({ x: gridX, y: gridY, z: 0 }); // Assume 'z' is always 0 for now
  };

  return (
    <>
      <Subnav />
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1>Game Client</h1>
        <p>Use WASD keys to move your ball. See other players' movements!</p>
        <div>
          <p>Movement Speed: {movementSpeed}</p>
          <p>Player Position: X: {players[localPlayerId]?.x}, Y: {players[localPlayerId]?.y}</p>
          <p>Mouse Position: X: {currentGrid.x}, Y: {currentGrid.y}</p>
        </div>
      </div>

      {/* Game Grid */}
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#eee',
          overflow: 'hidden',
        }}
        tabIndex={0}
        onKeyDown={handleKeyDown} // Listen for keydown events
        onMouseMove={handleMouseMove} // Track mouse position over the grid
      >
        <div
          style={{
            position: 'absolute',
            top: `${-camera.y}px`,
            left: `${-camera.x}px`,
            width: '10000px', // Large grid for scrolling
            height: '10000px',
            backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(to right, #ccc 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        >
          {Object.keys(players).map((playerId) => {
            const player = players[playerId];
            return (
              <div
                key={playerId}
                style={{
                  position: 'absolute',
                  top: `${player.y}px`,
                  left: `${player.x}px`,
                  width: '30px',
                  height: '30px',
                  backgroundColor: player.color,
                  borderRadius: '50%',
                  transition: 'top 0.05s, left 0.05s', // Smooth movement
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    color: 'black',
                  }}
                >
                  {player.id.substring(0, 5)} {/* Display first 5 letters of sessionKey */}
                </span>
              </div>
            );
          })}

          {/* Show grid highlight if in creator mode */}
          {isCreatorMode && (
            <div
              style={{
                position: 'absolute',
                top: `${currentGrid.y * 50 - camera.y}px`,
                left: `${currentGrid.x * 50 - camera.x}px`,
                width: '50px',
                height: '50px',
                border: '2px dashed red',
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Client;
