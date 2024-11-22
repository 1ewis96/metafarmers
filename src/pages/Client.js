import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Set up the socket connection with sessionKey
const socket = io('https://13.49.67.160', {
  query: {
    sessionKey: localStorage.getItem('sessionKey') || 'WPM4OVU3YyRZLUo', // Use a sessionKey from localStorage or set default
  },
});

const gridSize = 50; // Size of each grid square in pixels
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

const Client = () => {
  const [player, setPlayer] = useState(null);
  const [playerKey, setPlayerKey] = useState('');
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState(null);
  const [cellInfo, setCellInfo] = useState(null);
  const [buildMode, setBuildMode] = useState(false);
  const [objects, setObjects] = useState([]); // Store grid objects
  const movementSpeed = 20; // Default movement speed

// Fetch grid objects from API
const fetchGridObjects = async (x, y) => {
  try {
    const response = await fetch(`https://f1bin6vjd7.execute-api.eu-north-1.amazonaws.com/object/grid?x=${x}&y=${y}`);
    if (response.ok) {
      const data = await response.json();
      setObjects(data);
    } else {
      console.error('Failed to fetch grid objects', response.status);
    }
  } catch (error) {
    console.error('Error fetching grid objects:', error);
  }
};

// Render the objects on the grid with images
const renderObjects = () => {
  return objects.map((obj) => {
    const objectImageSrc = `/assets/objects/${obj.type}.png`; // Construct the image source URL dynamically

    return (
      <div
        key={obj.id}
        style={{
          position: 'absolute',
          top: `${obj.grid_y * gridSize + gridOffset.y}px`,
          left: `${obj.grid_x * gridSize + gridOffset.x}px`,
          width: `${gridSize}px`,
          height: `${gridSize}px`,
        }}
        title={`Type: ${obj.type}`} // Tooltip with object type
      >
        <img
          src={objectImageSrc}
          alt={obj.type}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain', // Ensure the image fits well within the grid
          }}
          onError={(e) => {
            e.target.src = '/assets/objects/default.png'; // Fallback to a default image if the specific one isn't found
          }}
        />
      </div>
    );
  });
};

  // Handle mouse move to track hovered cell
  const handleMouseMove = (e) => {
    const mouseX = e.clientX - gridOffset.x;
    const mouseY = e.clientY - gridOffset.y;
    const cellX = Math.floor(mouseX / gridSize);
    const cellY = Math.floor(mouseY / gridSize);
    setHoveredCell({ x: cellX, y: cellY });
  };

  // Handle key press for movement (W, A, S, D) and build mode (B)
  const handleKeyDown = (e) => {
    if (e.key === 'b' || e.key === 'B') {
      setBuildMode((prev) => !prev);
    }
    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
      socket.emit('move', { directions: [e.key.toUpperCase()], speed: movementSpeed });
    }
  };

  // Handle click to open the cell info panel
  const handleCellClick = () => {
    if (hoveredCell) {
      setCellInfo({
        x: hoveredCell.x,
        y: hoveredCell.y,
      });
    }
  };

  // Socket connection: handle player initialization and movement updates
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

  // Update grid offset and fetch objects when the player position changes
  useEffect(() => {
    if (playerPosition) {
      const offsetX = viewportWidth / 2 - (Math.floor(playerPosition.x / gridSize) * gridSize) - (playerPosition.x % gridSize);
      const offsetY = viewportHeight / 2 - (Math.floor(playerPosition.y / gridSize) * gridSize) - (playerPosition.y % gridSize);
      setGridOffset({ x: offsetX, y: offsetY });

      // Fetch objects for the current grid
      fetchGridObjects(Math.floor(playerPosition.x / gridSize), Math.floor(playerPosition.y / gridSize));
    }
  }, [playerPosition]);

  // Add event listeners for mouse and keydown events
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleCellClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleCellClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Render hazard banner when build mode is active
  const renderHazardBanner = () => {
    if (buildMode) {
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 0, 0, 0.2)', // Semi-transparent red
            border: '5px dashed red',
            zIndex: 5,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              fontSize: '18px',
              color: 'red',
              fontWeight: 'bold',
            }}
          >
            WARNING: Build Mode Active
          </div>
        </div>
      );
    }
    return null;
  };

  // Render the grid with lines and highlighted cell
  const renderGrid = () => {
    const cols = Math.ceil(viewportWidth / gridSize);
    const rows = Math.ceil(viewportHeight / gridSize);

    const gridLines = [];

    // Render vertical and horizontal lines
    for (let col = -1; col < cols + 1; col++) {
      gridLines.push(
        <div
          key={`v-${col}`}
          style={{
            position: 'absolute',
            top: 0,
            left: `${col * gridSize + gridOffset.x}px`,
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
            top: `${row * gridSize + gridOffset.y}px`,
            left: 0,
            width: `${viewportWidth}px`,
            height: '1px',
            backgroundColor: '#555',
          }}
        />
      );
    }

    // Highlight the hovered cell
    if (hoveredCell) {
      gridLines.push(
        <div
          key={`highlight-${hoveredCell.x}-${hoveredCell.y}`}
          style={{
            position: 'absolute',
            top: `${hoveredCell.y * gridSize + gridOffset.y}px`,
            left: `${hoveredCell.x * gridSize + gridOffset.x}px`,
            width: `${gridSize}px`,
            height: `${gridSize}px`,
            border: '2px solid yellow',
            zIndex: 2, // Ensure it's on top of other elements
          }}
        />
      );
    }

    return gridLines;
  };


  // Render the player on the screen
  const renderPlayer = () => {
    if (player) {
      return (
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
      );
    }
    return null;
  };

  // Render the player info panel
  const renderPlayerInfo = () => {
    if (player) {
      return (
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
          <p>Current Cell: X: {Math.floor(playerPosition.x / gridSize)} Y: {Math.floor(playerPosition.y / gridSize)}</p>
          <p>Speed: {movementSpeed}</p>
        </div>
      );
    }
    return null;
  };

  // Render the cell info panel
  const renderCellInfoPanel = () => {
    if (cellInfo) {
      return (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '10px',
            zIndex: 10,
          }}
        >
          <h4>Cell Info:</h4>
          <p>Cell Position: X: {cellInfo.x} Y: {cellInfo.y}</p>
        </div>
      );
    }
    return null;
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
      {renderObjects()}
      {renderPlayer()}
      {renderPlayerInfo()}
      {renderHazardBanner()}
      {renderCellInfoPanel()}
    </div>
  );
};

export default Client;
