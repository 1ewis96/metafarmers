import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import Subnav from '../components/subnav';

const sessionKey = Cookies.get('sessionKey');
console.log('Session Key:', sessionKey);

const socket = io('https://13.49.67.160', {
  transports: ['websocket'],
  query: { sessionKey },
});

const Client = () => {
  const [players, setPlayers] = useState({});
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [localPlayerId, setLocalPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentGrid, setCurrentGrid] = useState({ x: 0, y: 0, z: 0 });
  const [creatorMode, setCreatorMode] = useState(false);
  const [highlightedGrid, setHighlightedGrid] = useState(null);
  const [mouseGridPosition, setMouseGridPosition] = useState({ x: 0, y: 0 });
  const [movementSpeed, setMovementSpeed] = useState(20);

  const gridSize = 200;

  useEffect(() => {
    socket.on('initialize', (localPlayerData) => {
      setLocalPlayerId(localPlayerData.id);
      setPlayers((prev) => ({ ...prev, [localPlayerData.id]: localPlayerData }));
      setLoading(false);
    });

    socket.on('newPlayer', (newPlayer) => {
      setPlayers((prev) => ({ ...prev, [newPlayer.id]: newPlayer }));
    });

    socket.on('playerMoved', (playerData) => {
      setPlayers((prev) => ({ ...prev, [playerData.id]: playerData }));
    });

    socket.on('playerDisconnected', (playerId) => {
      setPlayers((prev) => {
        const updatedPlayers = { ...prev };
        delete updatedPlayers[playerId];
        return updatedPlayers;
      });
    });

    return () => {
      socket.off('initialize');
      socket.off('newPlayer');
      socket.off('playerMoved');
      socket.off('playerDisconnected');
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key.toUpperCase() === 'B') {
        setCreatorMode((prev) => !prev); // Toggle creator mode
      }

      const directions = [];
      if (event.key.toUpperCase() === 'W') directions.push('W');
      if (event.key.toUpperCase() === 'A') directions.push('A');
      if (event.key.toUpperCase() === 'S') directions.push('S');
      if (event.key.toUpperCase() === 'D') directions.push('D');

      if (directions.length > 0 && !creatorMode) {
        socket.emit('move', { directions, speed: movementSpeed });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [creatorMode, movementSpeed]);

  useEffect(() => {
    if (localPlayerId) {
      const localPlayer = players[localPlayerId];
      if (localPlayer) {
        setCamera({
          x: localPlayer.x - window.innerWidth / 2,
          y: localPlayer.y - window.innerHeight / 2,
        });

        const gridX = Math.floor(localPlayer.x / gridSize);
        const gridY = Math.floor(localPlayer.y / gridSize);
        const gridZ = 0;
        if (currentGrid.x !== gridX || currentGrid.y !== gridY || currentGrid.z !== gridZ) {
          setCurrentGrid({ x: gridX, y: gridY, z: gridZ });
          socket.emit('gridChange', { x: gridX, y: gridY, z: gridZ });
        }
      }
    }
  }, [players, localPlayerId]);

  const handleMouseMove = (event) => {
    const mouseX = event.clientX + camera.x;
    const mouseY = event.clientY + camera.y;

    const gridX = Math.floor(mouseX / gridSize);
    const gridY = Math.floor(mouseY / gridSize);

    setMouseGridPosition({ x: gridX, y: gridY });

    if (creatorMode) {
      setHighlightedGrid({ x: gridX, y: gridY });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#333', color: '#fff' }}>
        <h1>Loading... Please wait</h1>
      </div>
    );
  }

  return (
    <>
      <Subnav />
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1>Game Client</h1>
        <p>Press <strong>B</strong> to toggle creator mode.</p>
        <p>Use WASD keys to move your ball. See other players' movements!</p>
      </div>

      {/* UI Section */}
      <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px', backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#fff', zIndex: 10 }}>
        <h3>Debug Info</h3>
        <p><strong>Player Position:</strong> {localPlayerId ? `${players[localPlayerId]?.x}, ${players[localPlayerId]?.y}` : 'N/A'}</p>
        <p><strong>Mouse Position (Grid):</strong> {`${mouseGridPosition.x}, ${mouseGridPosition.y}`}</p>
        <p><strong>Movement Speed:</strong> {movementSpeed}</p>
        <p><strong>Current Grid:</strong> ({currentGrid.x}, {currentGrid.y}, {currentGrid.z})</p>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#eee',
          overflow: 'hidden',
        }}
        onMouseMove={handleMouseMove}
      >
        <div
          style={{
            position: 'absolute',
            top: `${-camera.y}px`,
            left: `${-camera.x}px`,
            width: '10000px',
            height: '10000px',
            backgroundImage: `
              linear-gradient(#ccc 1px, transparent 1px),
              linear-gradient(90deg, #ccc 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        >
          {Object.keys(players).map((playerId) => {
            const player = players[playerId];
            const playerLabel = player.id.slice(0, 5);
            return (
              <div
                key={playerId}
                style={{
                  position: 'absolute',
                  top: `${player.y}px`,
                  left: `${player.x}px`,
                  width: '30px',
                  height: '30px',
                  textAlign: 'center',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {playerLabel}
                </div>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: player.color,
                    borderRadius: '50%',
                    border: playerId === localPlayerId ? '2px solid red' : 'none',
                    transition: 'top 0.05s, left 0.05s',
                  }}
                ></div>
              </div>
            );
          })}

          {creatorMode && highlightedGrid && (
            <div
              style={{
                position: 'absolute',
                top: `${highlightedGrid.y * gridSize}px`,
                left: `${highlightedGrid.x * gridSize}px`,
                width: `${gridSize}px`,
                height: `${gridSize}px`,
                border: '2px dashed red',
                boxSizing: 'border-box',
                pointerEvents: 'none',
              }}
            ></div>
          )}
        </div>
      </div>

      {/* Placeholder UI */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#fff', padding: '10px', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h4>Inventory</h4>
            <p>(Placeholder for inventory UI)</p>
          </div>
          <div>
            <h4>Bank</h4>
            <p>(Placeholder for bank UI)</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Client;
