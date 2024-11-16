import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Subnav from '../components/subnav'; // Ensure correct import path

// Connect to the Node.js server using the provided IP
const socket = io('https://13.49.67.160', {
  transports: ['websocket'],
});

const Client = () => {
  // Player's position and color state
  const [player, setPlayer] = useState({
    x: 300,
    y: 300,
    color: '#FF0000', // Random color will be set by the server
  });
  
  const [players, setPlayers] = useState({});
  const [camera, setCamera] = useState({ x: player.x, y: player.y });

  useEffect(() => {
    // Initialize the player and listen for server updates
    socket.on('initialize', (allPlayers) => {
      setPlayers(allPlayers);
    });

    // Update player position when other players move
    socket.on('playerMoved', (playerData) => {
      setPlayers((prev) => ({ ...prev, [playerData.id]: playerData }));
    });

    // Listen for new players joining
    socket.on('newPlayer', (newPlayer) => {
      setPlayers((prev) => ({ ...prev, [newPlayer.id]: newPlayer }));
    });

    // Listen for player disconnection
    socket.on('playerDisconnected', (playerId) => {
      setPlayers((prev) => {
        const updatedPlayers = { ...prev };
        delete updatedPlayers[playerId];
        return updatedPlayers;
      });
    });

    // Cleanup on component unmount
    return () => {
      socket.off('initialize');
      socket.off('playerMoved');
      socket.off('newPlayer');
      socket.off('playerDisconnected');
    };
  }, []);

  // Handle keypresses (WASD movement)
  const handleKeyDown = (event) => {
    const direction = event.key.toUpperCase();
    if (['W', 'A', 'S', 'D'].includes(direction)) {
      socket.emit('move', direction); // Send the move direction to the server
    }
  };

  // Update camera position to follow the player's ball
  useEffect(() => {
    const cameraFollow = () => {
      setCamera({
        x: player.x - window.innerWidth / 2,
        y: player.y - window.innerHeight / 2,
      });
    };

    cameraFollow(); // Call it once initially
    const interval = setInterval(cameraFollow, 100); // Continuously update camera

    return () => clearInterval(interval); // Cleanup
  }, [player]);

  // Render the game grid and players
  return (
    <>
      <Subnav />
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1>Game Client</h1>
        <p>Use WASD keys to move your ball. See other players' movements!</p>
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
      >
        <div
          style={{
            position: 'absolute',
            top: `${-camera.y}px`,
            left: `${-camera.x}px`,
            width: '10000px', // Making the grid large enough to move around
            height: '10000px',
            backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        >
          {Object.keys(players).map((playerId) => {
            const currentPlayer = players[playerId];
            return (
              <div
                key={playerId}
                style={{
                  position: 'absolute',
                  top: `${currentPlayer.y}px`,
                  left: `${currentPlayer.x}px`,
                  width: '30px',
                  height: '30px',
                  backgroundColor: currentPlayer.color,
                  borderRadius: '50%',
                  transition: 'top 0.05s, left 0.05s', // Smooth movement
                }}
              ></div>
            );
          })}

          {/* Display the player's own ball */}
          <div
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
          ></div>
        </div>
      </div>
    </>
  );
};

export default Client;
