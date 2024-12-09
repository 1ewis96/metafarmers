import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import defaultObject from '../assets/objects/default.png';
import Draggable from 'react-draggable'; // For dragging
import { ResizableBox } from 'react-resizable'; // For resizing
import 'react-resizable/css/styles.css'; // Import styles
import { Button } from 'react-bootstrap';


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
  const movementSpeed = 40; // Default movement speed
  const [rightClickMenu, setRightClickMenu] = useState({ visible: false, x: 0, y: 0, object: null });
  const [selectedSlot, setSelectedSlot] = useState(1);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	 const [message, setMessage] = useState('');

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };
  
    const sendMessage = () => {
    if (message.trim()) {
      // Send the message to the server (you can call socket.emit here)
      console.log('Sending message:', message);

      // Clear the input after sending
      setMessage('');
    }
  };
const handleMouseMove = (e) => {
  const mouseX = e.clientX + playerPosition.x - viewportWidth / 2;
  const mouseY = e.clientY + playerPosition.y - viewportHeight / 2;

  const cellX = Math.floor(mouseX / gridSize);
  const cellY = Math.floor(mouseY / gridSize);

  setHoveredCell({ x: cellX, y: cellY });
};


const InventoryPopup = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <Draggable>
      <ResizableBox
        width={400}
        height={300}
        minConstraints={[200, 150]}
        maxConstraints={[800, 600]}
        resizeHandles={['se']}
      >
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '10px',
              backgroundColor: '#222',
              cursor: 'move',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Inventory</span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              ✖
            </button>
          </div>
          <div
            style={{
              flex: 1,
              padding: '10px',
              overflowY: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {/* Render inventory items here */}
            <div style={{ width: '50px', height: '50px', backgroundColor: '#555' }}></div>
            <div style={{ width: '50px', height: '50px', backgroundColor: '#555' }}></div>
            {/* Add more inventory slots/items */}
          </div>
        </div>
      </ResizableBox>
    </Draggable>
  );
};

const [inventoryVisible, setInventoryVisible] = useState(false);

const toggleInventory = () => {
  setInventoryVisible((prev) => !prev);
};

const calculateAngle = () => {
  if (!playerPosition) return 0;

  // Adjust mouse position relative to the player
  const mouseX = mousePosition.x - gridOffset.x - playerPosition.x + viewportWidth / 2;
  const mouseY = mousePosition.y - gridOffset.y - playerPosition.y + viewportHeight / 2;

  const dx = mouseX - viewportWidth / 2; // Mouse relative to player
  const dy = mouseY - viewportHeight / 2;

  return Math.atan2(dy, dx); // Angle in radians
};

const renderTriangle = () => {
  const angle = calculateAngle();

  return (
    <div
      style={{
        position: 'absolute',
        top: `${viewportHeight / 2}px`, // Attach to player (centered)
        left: `${viewportWidth / 2}px`,
        width: '0',
        height: '0',
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderBottom: '20px solid yellow', // Triangle color
        transform: `translate(-50%, -100%) rotate(${(angle * 180) / Math.PI}deg)`, // Rotate triangle
        transformOrigin: '50% 100%', // Rotate around the base
        zIndex: 6,
      }}
    />
  );
};

const handleKeyDown = (e) => {
  if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
    socket.emit('move', { directions: [e.key.toUpperCase()], speed: movementSpeed });
  }

  if (e.key >= '1' && e.key <= '5') {
    setSelectedSlot(parseInt(e.key, 10));
  }

  if (e.key === 'b' || e.key === 'B') {
    setBuildMode((prev) => !prev);
  }
  
};


const messageBox = () => {
	return (
   <div
      style={{
        position: 'absolute',
        bottom: '2%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '600px',
        height: '60px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #888',
        borderRadius: '10px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: '-8px',
		  left: '55%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          width: '600px',
        }}
      >
        {/* Use a basic input box instead of Form.Control */}
        <input
          type="text"
          value={message}
          onChange={handleMessageChange}
          placeholder="Type your message"
          style={{
            width: '80%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            marginBottom: '10px',
            fontSize: '16px',
            color: '#333',
          }}
        />
        <Button onClick={sendMessage} variant="dark" block>
          Send
        </Button>
      </div>
    </div>
  );
};


const renderHotbar = () => {
  const slots = [1, 2, 3, 4, 5, 6]; // Add a sixth slot
  const hotbarWidth = 360; // Adjust width for six slots
  const slotSize = hotbarWidth / slots.length;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: `${hotbarWidth}px`,
        height: '60px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #888',
        borderRadius: '10px',
      }}
    >
      {slots.map((slot) => (
        <div
          key={slot}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: `${slotSize}px`,
            height: '100%',
            border: slot === selectedSlot ? '3px solid yellow' : '1px solid gray',
            backgroundColor: '#333',
            margin: '2px',
            boxShadow: slot === selectedSlot ? '0 0 5px yellow' : 'none',
            cursor: 'pointer',
          }}
          onClick={() => {
            if (slot === 6) {
              toggleInventory(); // Open inventory if the sixth slot is clicked
            } else {
              setSelectedSlot(slot);
            }
          }}
        >
          <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{slot}</span>
        </div>
      ))}
    </div>
  );
};

// Fetch grid objects from API
const fetchGridObjects = async (centerX, centerY) => {
  const range = 1; // Load surrounding cells within this range
  const requests = [];

  for (let x = centerX - range; x <= centerX + range; x++) {
    for (let y = centerY - range; y <= centerY + range; y++) {
      requests.push(
        fetch(`https://f1bin6vjd7.execute-api.eu-north-1.amazonaws.com/object/grid?x=${x}&y=${y}`)
          .then((response) => (response.ok ? response.json() : null))
          .catch((err) => console.error('Error fetching grid objects:', err))
      );
    }
  }

  const results = await Promise.all(requests);
  const allObjects = results.flat().filter(Boolean); // Combine and filter out null results
  setObjects((prev) => [...prev, ...allObjects]); // Merge with existing objects
};

// Render the objects on the grid with images
const renderObjects = () => {
  return objects.map((obj) => {
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
        title={`Type: ${obj.type}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setRightClickMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            object: obj,
          });
        }}
      >
        <img
          src={`/assets/objects/${obj.type}.png`}
          alt={obj.type}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          onError={(e) => {
            e.target.src = defaultObject;
          }}
        />
      </div>
    );
  });
};

const renderRightClickMenu = () => {
  if (!rightClickMenu.visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${rightClickMenu.y}px`,
        left: `${rightClickMenu.x}px`,
        backgroundColor: 'white',
        border: '1px solid black',
        zIndex: 100,
        padding: '10px',
      }}
      onClick={() => setRightClickMenu({ visible: false, x: 0, y: 0, object: null })} // Close menu on click
    >
      <p>Placeholder Action 1</p>
      <p>Placeholder Action 2</p>
      <p>Object: {rightClickMenu.object?.type}</p>
    </div>
  );
};

// Handle click to open the cell info panel
const handleCellClick = (e) => {
  const mouseX = e.clientX - viewportWidth / 2 + playerPosition.x;
  const mouseY = e.clientY - viewportHeight / 2 + playerPosition.y;

  const cellX = Math.floor(mouseX / gridSize);
  const cellY = Math.floor(mouseY / gridSize);

  setCellInfo({
    x: cellX,
    y: cellY,
  });
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
    const currentCellX = Math.floor(playerPosition.x / gridSize);
    const currentCellY = Math.floor(playerPosition.y / gridSize);

    // Adjust grid offset for smooth player centering
    const offsetX =
      viewportWidth / 2 - Math.floor(playerPosition.x / gridSize) * gridSize - (playerPosition.x % gridSize);
    const offsetY =
      viewportHeight / 2 - Math.floor(playerPosition.y / gridSize) * gridSize - (playerPosition.y % gridSize);
    setGridOffset({ x: offsetX, y: offsetY });

    // Fetch objects for the current and surrounding grids
    fetchGridObjects(currentCellX, currentCellY);
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

useEffect(() => {
  const handleClickOutside = () => setRightClickMenu({ visible: false, x: 0, y: 0, object: null });
  window.addEventListener('click', handleClickOutside);

  return () => {
    window.removeEventListener('click', handleClickOutside);
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
  const cols = Math.ceil(viewportWidth / gridSize) + 2; // Add extra lines for smooth scrolling
  const rows = Math.ceil(viewportHeight / gridSize) + 2;

  const startCol = Math.floor(playerPosition.x / gridSize) - Math.floor(cols / 2);
  const startRow = Math.floor(playerPosition.y / gridSize) - Math.floor(rows / 2);

  const gridLines = [];

  for (let col = startCol; col < startCol + cols; col++) {
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

  for (let row = startRow; row < startRow + rows; row++) {
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

const pullObjectInfo = () => {
	
	
	
	
	
}

const renderWorldInfo = () => {
	
      return (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '10px',
            zIndex: 10,
          }}
        >
          <h4>World Info:</h4>
          <p>JSON</p>
        </div>
      );	
	
	
	
}

const renderHandInfo = () => {
	
      return (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '100px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '10px',
            zIndex: 10,
          }}
        >
          <h4>Hand Info:</h4>
          <p>JSON</p>
        </div>
      );	
	
	
	
}

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
        <p>Cell Position: X: {cellInfo.x} Y: {cellInfo.y} Mouse: X: {hoveredCell.x} Y: {hoveredCell.y}</p>
        <h4>Obj Info:</h4>
        <p>JSON</p>
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
	{renderHotbar()}

      {renderGrid()}
      {renderObjects()}
{renderPlayer()}
{renderTriangle()}

      {renderPlayerInfo()}
      {renderHazardBanner()}
      {renderCellInfoPanel()}
	  {renderWorldInfo()}
	  {renderHandInfo()}
	  {messageBox()}
	  {renderRightClickMenu()}
	  <InventoryPopup visible={inventoryVisible} onClose={() => setInventoryVisible(false)} />

    </div>
  );
};

export default Client;

