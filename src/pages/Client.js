import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Subnav from '../components/subnav'; // Ensure correct import path

// Connect to the Node.js server using the provided IP
const socket = io('https://13.49.67.160', {
  transports: ['websocket'],
});

const Client = () => {
  const [players, setPlayers] = useState({});
  const [camera, setCamera] = useState({ x: 0, y: 0 });

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

  // Focus the camera on the player's ball
  useEffect(() => {
    // Get the first player (your ball)
    const currentPlayer = Object.values(players)[0]; // Assuming the first player is the local player
    if (currentPlayer) {
      setCamera({
        x: currentPlayer.x - window.innerWidth / 2, // Set the camera to the center of the player's ball
        y: currentPlayer.y - window.innerHeight / 2,
      });
    }
  }, [players]); // This hook runs whenever `players` state changes

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
        </div>
      </div>
    </>
  );
};

export default Client;
