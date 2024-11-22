import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import defaultObject from '../assets/objects/default.png';

// Set up constants
const gridSize = 50; // Size of each grid square in pixels
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

const Client = () => {
  // States for game objects, player info, and loading
  const [player, setPlayer] = useState(null);
  const [playerKey, setPlayerKey] = useState('');
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState(null);
  const [cellInfo, setCellInfo] = useState(null);
  const [buildMode, setBuildMode] = useState(false);
  const [objects, setObjects] = useState([]); // Store grid objects
  const [loading, setLoading] = useState(true); // Track loading state
  const [loadingProgress, setLoadingProgress] = useState(0); // Track loading progress
  const movementSpeed = 20; // Default movement speed

  // Set up socket connection (will be delayed until assets are loaded)
  const socket = io('https://13.49.67.160', {
    query: {
      sessionKey: localStorage.getItem('sessionKey') || 'WPM4OVU3YyRZLUo', // Use a sessionKey from localStorage or set default
    },
  });

  // Fetch asset list and load images
  const loadAssets = async () => {
    try {
      const response = await fetch('https://f1bin6vjd7.execute-api.eu-north-1.amazonaws.com/objects/all');
      if (!response.ok) {
        throw new Error('Failed to fetch asset list');
      }

      const assetList = await response.json();
      const totalAssets = assetList.length;
      let loadedAssets = 0;

      const loadImagePromises = assetList.map((asset) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = `/assets/objects/${asset.location}`;
          img.onload = () => {
            loadedAssets++;
            setLoadingProgress((loadedAssets / totalAssets) * 100);
            resolve();
          };
          img.onerror = reject;
        });
      });

      // Wait for all images to load
      await Promise.all(loadImagePromises);

      // Once all assets are loaded, set the objects and hide the splash screen
      setObjects(assetList);
      setLoading(false); // Hide loading splash screen
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

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

  // Render objects on the grid
  const renderObjects = () => {
    return objects.map((obj) => {
      const objectImageSrc = `/assets/objects/${obj.location}`;

      return (
        <div
          key={obj.id}
          style={{
            position: 'absolute',
            top: `${obj.y * gridSize + gridOffset.y}px`,
            left: `${obj.x * gridSize + gridOffset.x}px`,
            width: `${gridSize}px`,
            height: `${gridSize}px`,
          }}
          title={`Type: ${obj.object_name}`}
        >
          <img
            src={objectImageSrc}
            alt={obj.object_name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.target.src = defaultObject; // Fallback to default image
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

  // Socket connection: handle player initialization and movement updates
  useEffect(() => {
    // Load assets first
    loadAssets();

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

  // Update grid offset and fetch objects when player position changes
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

  // Render the loading splash screen with progress bar
  const renderLoadingSplash = () => {
    if (loading) {
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '24px',
            zIndex: 9999,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1>Loading...</h1>
            <progress value={loadingProgress} max={100} style={{ width: '300px', marginTop: '20px' }} />
            <p>{Math.round(loadingProgress)}% loaded</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render the grid, player, and other UI elements
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
      {renderLoadingSplash()} {/* Show splash screen until assets are loaded */}
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
