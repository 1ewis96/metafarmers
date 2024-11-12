import React, { useEffect, useRef, useState } from 'react';
import Subnav from '../components/subnav'; // Ensure correct import path
import io from 'socket.io-client';

const Client = () => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);  // Declare socket with useRef
  const [players, setPlayers] = useState({});
  const [player, setPlayer] = useState({ id: null, x: 0, y: 0, radius: 20, color: 'blue' });

  useEffect(() => {
    // Connect to the WebSocket server (replace with your actual server URL)
    socketRef.current = io('https://16.171.177.203'); // Use your IP or domain name

    const socket = socketRef.current;

    // Initialize player and set up event listeners
    socket.on('initialize', (allPlayers) => {
      setPlayers(allPlayers);
      setPlayer((prevPlayer) => ({ ...prevPlayer, id: socket.id }));
    });

    socket.on('playerJoined', (data) => {
      setPlayers((prevPlayers) => ({ ...prevPlayers, [data.id]: data.position }));
    });

    socket.on('playerMoved', (data) => {
      setPlayers((prevPlayers) => ({ ...prevPlayers, [data.id]: data.position }));
    });

    socket.on('playerLeft', (id) => {
      setPlayers((prevPlayers) => {
        const updatedPlayers = { ...prevPlayers };
        delete updatedPlayers[id];
        return updatedPlayers;
      });
    });

    // Cleanup when component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  // Canvas rendering and movement logic
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Handle key events for player movement
    const keys = {};
    const handleKeyDown = (e) => { keys[e.key] = true; };
    const handleKeyUp = (e) => { keys[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const movePlayer = () => {
      if (keys['ArrowUp']) player.y -= 5;
      if (keys['ArrowDown']) player.y += 5;
      if (keys['ArrowLeft']) player.x -= 5;
      if (keys['ArrowRight']) player.x += 5;

      // Emit move event to the server
      if (player.id) {
        socketRef.current.emit('move', { x: player.x, y: player.y });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all players
      Object.keys(players).forEach((id) => {
        const p = players[id];
        ctx.beginPath();
        ctx.arc(p.x, p.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = id === player.id ? 'blue' : 'green';
        ctx.fill();
        ctx.closePath();
      });
    };

    const gameLoop = () => {
      movePlayer();
      draw();
      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [players, player]); // Dependency array to re-run on player and players changes

  return (
    <>
      <Subnav />
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1>Client Game</h1>
        <p>Interact with the game below</p>
        <canvas ref={canvasRef}></canvas>
      </div>
    </>
  );
};

export default Client;
