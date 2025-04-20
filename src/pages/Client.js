import React, { useEffect, useRef, useState } from "react";
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
  Rectangle,
  Assets,
  SCALE_MODES,
} from "pixi.js";
import { Button, ProgressBar } from "react-bootstrap";
import "./GridManager.js"; // Assumed dependency for PixiMapDemo

// Constants
const TILE_SIZE = 64;
const GRID_SIZE = 30;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const WALK_SPEED = 5;
const SPRINT_SPEED = 10;

// GridManager (assumed implementation from PixiMapDemo)
class GridManager {
  constructor(gridSize, layers) {
    this.gridSize = gridSize;
    this.layers = layers;
    this.grid = {};
    layers.forEach((layer) => {
      this.grid[layer] = Array(gridSize)
        .fill()
        .map(() => Array(gridSize).fill(null));
    });
  }

  get(x, y, layer) {
    if (
      x < 0 ||
      x >= this.gridSize ||
      y < 0 ||
      y >= this.gridSize ||
      !this.grid[layer]
    )
      return null;
    return this.grid[layer][y][x];
  }

  set(x, y, layer, obj) {
    if (
      x >= 0 &&
      x < this.gridSize &&
      y >= 0 &&
      y < this.gridSize &&
      this.grid[layer]
    ) {
      this.grid[layer][y][x] = obj;
    }
  }
}

// SimpleDraggable (from client.js)
const SimpleDraggable = ({
  children,
  defaultPosition = { x: 0, y: 0 },
  handleSelector = "",
}) => {
  const nodeRef = useRef(null);
  const [position, setPosition] = useState(defaultPosition);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    if (handleSelector && !e.target.closest(handleSelector)) return;
    const rect = nodeRef.current.getBoundingClientRect();
    setDragging(true);
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    e.preventDefault();
  };

  const onMouseUp = () => setDragging(false);

  return (
    <div
      ref={nodeRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        cursor: dragging ? "grabbing" : "grab",
        zIndex: 1000,
      }}
    >
      {children}
    </div>
  );
};

// CloseButton (from client.js)
const CloseButton = ({ onClick }) => (
  <div
    onClick={onClick}
    style={{
      position: "absolute",
      top: 4,
      right: 4,
      width: 16,
      height: 16,
      fontSize: 12,
      background: "#aa0000",
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: "16px",
      cursor: "pointer",
      border: "1px solid #660000",
      boxShadow: "inset -1px -1px 0 #880000",
    }}
  >
    ✕
  </div>
);

// BundleCard (from client.js)
const BundleCard = ({ title, description }) => (
  <div
    style={{
      marginBottom: 8,
      backgroundColor: "#ffe082",
      border: "2px solid #000",
      borderRadius: "2px",
      padding: 6,
      fontSize: 12,
      fontFamily: "monospace",
      boxShadow: "4px 4px 0 #999",
      imageRendering: "pixelated",
    }}
  >
    <div
      style={{
        width: "100%",
        height: 60,
        backgroundColor: "#c89f55",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontStyle: "italic",
        fontWeight: "bold",
        border: "1px dashed #000",
        marginBottom: 4,
      }}
    >
      {title}
    </div>
    <div style={{ color: "#333" }}>{description}</div>
  </div>
);

// HabboWindow (from client.js)
const HabboWindow = ({ title, children, defaultPosition, onClose }) => (
  <SimpleDraggable defaultPosition={defaultPosition} handleSelector=".window-header">
    <div
      style={{
        width: 320,
        border: "2px solid black",
        backgroundColor: "#cfcfcf",
        position: "absolute",
        fontFamily: "monospace",
        boxShadow: "4px 4px 0px #888",
      }}
    >
      <div
        className="window-header"
        style={{
          backgroundColor: "#2a2a2a",
          color: "white",
          padding: "4px 8px",
          cursor: "move",
          fontSize: "14px",
          position: "relative",
        }}
      >
        {title}
        <CloseButton onClick={onClose} />
      </div>
      <div style={{ padding: 10 }}>{children}</div>
    </div>
  </SimpleDraggable>
);

// CatalogWindow (from client.js)
const CatalogWindow = ({ onClose }) => {
  const [page, setPage] = useState("home");

  const renderPage = () => {
    switch (page) {
      case "home":
        return (
          <>
            <p>
              <strong>Latest Bundles</strong>
            </p>
            <BundleCard
              title="Starter Room Bundle"
              description="Includes furniture to start building your own space."
            />
            <BundleCard
              title="Party Pack"
              description="Decorations and lighting for a party vibe."
            />
            <BundleCard
              title="Retro Furniture Kit"
              description="Classic Habbo items from back in the day."
            />
            <p>
              <strong>Your Balance:</strong>{" "}
              <span style={{ color: "#007bff" }}>320 $TASK</span>
            </p>
            <Button
              size="sm"
              variant="dark"
              onClick={() => setPage("main")}
            >
              Browse Categories ➡
            </Button>
          </>
        );
      case "main":
        return (
          <>
            <p>
              <strong>Categories:</strong>
            </p>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
              <li>
                <Button variant="link" onClick={() => setPage("credits")}>
                  💰 Credits
                </Button>
              </li>
              <li>
                <Button variant="link" onClick={() => setPage("furniture")}>
                  🪑 Furniture
                </Button>
              </li>
              <li>
                <Button variant="link" onClick={() => setPage("decor")}>
                  🎨 Decorations
                </Button>
              </li>
            </ul>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage("home")}
            >
              ⬅ Home
            </Button>
          </>
        );
      case "credits":
        return (
          <>
            <p>
              <strong>Credit Packages</strong>
            </p>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
              <li>💵 10 Credits - .99</li>
              <li>💵 50 Credits - $8.99</li>
              <li>💵 100 Credits - 6.99</li>
            </ul>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage("main")}
            >
              ⬅ Back
            </Button>
          </>
        );
      case "furniture":
        return (
          <>
            <p>
              <strong>Furniture</strong>
            </p>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
              <li>🛋 Sofa</li>
              <li>🪑 Chair</li>
              <li>🛏 Bed</li>
            </ul>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage("main")}
            >
              ⬅ Back
            </Button>
          </>
        );
      case "decor":
        return (
          <>
            <p>
              <strong>Decorations</strong>
            </p>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
              <li>🖼 Wall Art</li>
              <li>🪞 Mirror</li>
              <li>🕯 Candles</li>
            </ul>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage("main")}
            >
              ⬅ Back
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <HabboWindow
      title="Catalog"
      defaultPosition={{ x: 100, y: 100 }}
      onClose={onClose}
    >
      {renderPage()}
    </HabboWindow>
  );
};

// ConsoleWindow (from client.js)
const ConsoleWindow = ({ onClose }) => (
  <HabboWindow
    title="Console"
    defaultPosition={{ x: 450, y: 120 }}
    onClose={onClose}
  >
    <p>
      <strong>Online Friends</strong>
    </p>
    <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
      <li>🟢 Alex</li>
      <li>🟡 Jamie</li>
      <li>🔴 Sam</li>
    </ul>
  </HabboWindow>
);

// NavigationWindow (from client.js)
const NavigationWindow = ({ onClose }) => (
  <HabboWindow
    title="🚇 Navigator"
    defaultPosition={{ x: 800, y: 150 }}
    onClose={onClose}
  >
    <div
      style={{
        backgroundColor: "#ffe082",
        border: "2px solid black",
        padding: "8px",
        boxShadow: "4px 4px 0 #999",
        fontFamily: "monospace",
        imageRendering: "pixelated",
      }}
    >
      <p style={{ fontSize: 13 }}>
        <strong>🚉 Subway Lines</strong>
      </p>
      <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
        <li>🟡 Central Plaza</li>
        <li>🟢 Garden Terminal</li>
        <li>🔴 Crimson Station</li>
      </ul>
    </div>
    <br />
    <div
      style={{
        backgroundColor: "#fff3cd",
        border: "2px dashed #000",
        padding: "6px",
        boxShadow: "2px 2px 0 #bbb",
        fontFamily: "monospace",
        imageRendering: "pixelated",
      }}
    >
      <p style={{ fontSize: 13 }}>
        <strong>🧭 Waypoints</strong>
      </p>
      <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
        <li>🏠 Lobby</li>
        <li>🏖 Beach Party</li>
        <li>🕹 Arcade</li>
      </ul>
    </div>
    <br />
    <p>
      <strong>My Rooms</strong>
    </p>
    <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
      <li>🛏 Chill Room</li>
      <li>🎉 Event Space</li>
    </ul>
  </HabboWindow>
);

// TopRightHUD (from client.js)
const TopRightHUD = ({ playerState }) => (
  <div
    style={{
      position: "absolute",
      top: 10,
      right: 10,
      width: 160,
      padding: 10,
      backgroundColor: "#2a2a2a",
      color: "white",
      border: "2px solid black",
      fontSize: 12,
      fontFamily: "monospace",
      zIndex: 1100,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          backgroundColor: "#777",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 10,
          fontStyle: "italic",
          color: "#fff",
        }}
      >
        Face
      </div>
      <div>
        <strong>Lvl 12</strong>
      </div>
    </div>
    <div>❤️ Health</div>
    <ProgressBar
      now={70}
      label="70%"
      variant="danger"
      style={{ height: 10 }}
    />
    <div>📍 Position: {playerState.x}, {playerState.y}</div>
  </div>
);

// Hotbar (from client.js)
const Hotbar = ({ selectedSlot, setSelectedSlot }) => {
  const handleWheel = (e) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    setSelectedSlot((prev) => (prev + direction + 9) % 9);
  };

  return (
    <div
      onWheel={handleWheel}
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 4,
        background: "#2a2a2a",
        padding: 4,
        border: "2px solid black",
        zIndex: 1100,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: i === selectedSlot ? "#999" : "#444",
            border: "1px solid #111",
            color: "white",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
};

// ChatBox (from client.js)
const ChatBox = () => (
  <div
    style={{
      position: "absolute",
      bottom: 60,
      left: 10,
      backgroundColor: "#fff",
      border: "2px solid #000",
      padding: "4px 6px",
      width: 220,
      zIndex: 1100,
      fontSize: 12,
      fontFamily: "monospace",
    }}
  >
    <input
      type="text"
      placeholder="Say something..."
      style={{
        width: "100%",
        padding: "4px",
        fontSize: "12px",
        border: "none",
        outline: "none",
      }}
    />
  </div>
);

// Minimap (from client.js)
const Minimap = () => (
  <div
    style={{
      position: "absolute",
      top: 10,
      left: 10,
      width: 100,
      height: 100,
      backgroundColor: "#222",
      border: "2px solid #000",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "monospace",
      fontSize: 10,
      zIndex: 1100,
    }}
  >
    Minimap
  </div>
);

// BottomBar (from client.js)
const BottomBar = ({
  toggleCatalog,
  toggleConsole,
  toggleNavigator,
  togglePhone,
}) => (
  <SimpleDraggable
    defaultPosition={{ x: 10, y: 520 }}
    handleSelector=".bar-drag"
  >
    <div
      style={{
        backgroundColor: "#2a2a2a",
        border: "2px solid black",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 6px",
        borderRadius: 4,
        position: "absolute",
        zIndex: 1200,
      }}
    >
      <div
        className="bar-drag"
        style={{ cursor: "move", paddingRight: 6 }}
      >
        ☰
      </div>
      <Button
        variant="dark"
        size="sm"
        onClick={toggleCatalog}
      >
        📦
      </Button>
      <Button
        variant="dark"
        size="sm"
        onClick={toggleConsole}
      >
        💬
      </Button>
      <Button
        variant="dark"
        size="sm"
        onClick={toggleNavigator}
      >
        🧭
      </Button>
      <Button
        variant="dark"
        size="sm"
        onClick={togglePhone}
      >
        📱
      </Button>
    </div>
  </SimpleDraggable>
);

// PhoneWindow (from client.js)
const PhoneWindow = ({ onClose }) => (
  <HabboWindow
    title="📱 Old Phone"
    defaultPosition={{ x: 400, y: 300 }}
    onClose={onClose}
  >
    <div
      style={{
        fontSize: 12,
        lineHeight: "16px",
        color: "lime",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        padding: "10px",
        boxShadow: "0 0 10px lime",
        fontFamily: "monospace",
      }}
    >
      <p>
        <strong>Contacts</strong>
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>📞 Alex</li>
        <li>📞 Jamie</li>
        <li>📞 Riley</li>
      </ul>
      <hr style={{ borderColor: "lime" }} />
      <p>
        <strong>Apps</strong>
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>📷 Camera</li>
        <li>🎵 Music</li>
        <li>📝 Notes</li>
      </ul>
    </div>
  </HabboWindow>
);

// ChatBubble (from client.js)
const ChatBubble = ({ text, position = { top: 240, left: 80 } }) => (
  <div
    style={{
      position: "absolute",
      top: position.top,
      left: position.left,
      backgroundColor: "#fff",
      border: "1px solid #000",
      borderRadius: 6,
      padding: "4px 8px",
      fontSize: 12,
      fontFamily: "monospace",
      maxWidth: 180,
      boxShadow: "2px 2px 0 #444",
      zIndex: 1000,
    }}
  >
    {text}
  </div>
);

// DragItemPanel (from PixiMapDemo.js)
const DragItemPanel = ({ items }) => (
  <div
    style={{
      position: "absolute",
      top: 10,
      left: 120,
      backgroundColor: "#fff",
      border: "2px solid black",
      padding: 10,
      zIndex: 1100,
    }}
  >
    <h4>Objects</h4>
    {items.map((item) => (
      <div
        key={item.name}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("objectName", item.name);
        }}
        style={{
          padding: 5,
          cursor: "grab",
          borderBottom: "1px solid #ddd",
        }}
      >
        {item.name}
      </div>
    ))}
  </div>
);

// Main DemoGame Component
export default function DemoGame() {
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const gridContainerRef = useRef(null);
  const gridManagerRef = useRef(null);
  const needsRedraw = useRef(false);
  const objectInfoCache = useRef({});
  const keysState = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    Shift: false,
    Control: false,
  });
  const isShiftPressed = useRef(false);
  const isLocked = useRef(false);
  const lastDirection = useRef("right");
  const lastFrame = useRef(0);
  const isFocused = useRef(true);
  const worldOffset = useRef({ x: 0, y: 0 });

  const [availableLayers, setAvailableLayers] = useState([]);
  const [availableObjects, setAvailableObjects] = useState([]);
  const [activeLayer, setActiveLayer] = useState("background");
  const [playerState, setPlayerState] = useState({
    x: 0,
    y: 0,
    direction: "right",
    isMoving: false,
    isSprinting: false,
    isLocked: false,
  });
  const [showCatalog, setShowCatalog] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [showNavigator, setShowNavigator] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [layersRes, objectsRes] = await Promise.all([
          fetch("https://api.metafarmers.io/list/layers"),
          fetch("https://api.metafarmers.io/list/objects"),
        ]);

        const layersData = await layersRes.json();
        const objectsData = await objectsRes.json();

        const layers = layersData.layers.map((l) => l.layer);
        setAvailableLayers(layers);
        if (layers.length > 0) setActiveLayer(layers[0]);

        setAvailableObjects(
          (objectsData.objects || []).map((obj) => ({
            name: obj.name,
            spriteUrl: obj.spriteSheet?.url || "",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };

    fetchInitialData();
  }, []);

  const fetchObjectInfo = async (objectName) => {
    if (objectInfoCache.current[objectName]) {
      return objectInfoCache.current[objectName];
    }
    try {
      const res = await fetch(
        `https://api.metafarmers.io/object/${objectName}`
      );
      const data = await res.json();
      objectInfoCache.current[objectName] = data;
      return data;
    } catch (err) {
      console.error(`Failed to fetch object info for ${objectName}:`, err);
      return null;
    }
  };

  useEffect(() => {
    if (!availableLayers.length) return;

    const run = async () => {
      const app = new Application({
        backgroundColor: 0x222222,
        powerPreference: "high-performance",
        resizeTo: pixiContainer.current,
      });
      appRef.current = app;

      if (pixiContainer.current) {
        pixiContainer.current.innerHTML = "";
        pixiContainer.current.appendChild(app.view);
      }

      const worldContainer = new Container();
      app.stage.addChild(worldContainer);

      const gridContainer = new Container();
      gridContainerRef.current = gridContainer;
      worldContainer.addChild(gridContainer);

      const gridManager = new GridManager(GRID_SIZE, availableLayers);
      gridManagerRef.current = gridManager;

      // Map rendering (from PixiMapDemo)
      const drawGrid = async () => {
        const container = gridContainerRef.current;
        container.removeChildren();

        const gridGraphics = new Graphics();

        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const obj = gridManager.get(x, y, activeLayer);
            gridGraphics.beginFill(obj ? 0xcccccc : 0xf0f0f0);
            gridGraphics.drawRect(
              x * TILE_SIZE,
              y * TILE_SIZE,
              TILE_SIZE,
              TILE_SIZE
            );
            gridGraphics.endFill();
          }
        }

        gridGraphics.lineStyle(1, 0x444444, 1);
        for (let i = 0; i <= GRID_SIZE; i++) {
          gridGraphics.moveTo(i * TILE_SIZE, 0);
          gridGraphics.lineTo(i * TILE_SIZE, GRID_SIZE * TILE_SIZE);
          gridGraphics.moveTo(0, i * TILE_SIZE);
          gridGraphics.lineTo(GRID_SIZE * TILE_SIZE, i * TILE_SIZE);
        }

        container.addChild(gridGraphics);

        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const obj = gridManager.get(x, y, activeLayer);
            if (obj?.spriteUrl) {
              const texture = await Texture.fromURL(obj.spriteUrl, {
                crossOrigin: "anonymous",
              });
              const sprite = new Sprite(texture);
              sprite.anchor.set(obj.anchor?.x || 0.5, obj.anchor?.y || 0.5);
              sprite.scale.set(obj.scale || 1);
              sprite.x = x * TILE_SIZE + TILE_SIZE / 2;
              sprite.y = y * TILE_SIZE + TILE_SIZE / 2;
              sprite.width = obj.frameSize?.width || TILE_SIZE;
              sprite.height = obj.frameSize?.height || TILE_SIZE;
              container.addChild(sprite);
            }
          }
        }
      };

      // Player setup (from PixiMovementDemo)
      const skinId = "character-1"; // Replace with actual skin ID
      const spriteInfoResponse = await fetch(
        `https://api.metafarmers.io/character/${skinId}`
      );
      const spriteInfo = await spriteInfoResponse.json();
      const spriteSheetUrl = spriteInfo.spriteSheet.url;
      const frameWidth = spriteInfo.spriteSheet.frameSize.width;
      const frameHeight = spriteInfo.spriteSheet.frameSize.height;
      const framesPerDirection = spriteInfo.spriteSheet.framesPerDirection;
      const directionMap = spriteInfo.spriteSheet.directionMap;
      const scale = spriteInfo.render.scale || 2;

      const characterTexture = await Assets.load(spriteSheetUrl);
      characterTexture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      const baseTexture = characterTexture.baseTexture;

      const frames = {};
      for (const [direction, row] of Object.entries(directionMap)) {
        frames[direction] = [];
        for (let i = 0; i < framesPerDirection; i++) {
          const rect = new Rectangle(
            i * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight
          );
          frames[direction].push(new Texture(baseTexture, rect));
        }
      }

      const sprite = new Sprite(frames.right[0]);
      sprite.anchor.set(
        spriteInfo.render.anchor?.x ?? 0.5,
        spriteInfo.render.anchor?.y ?? 0.5
      );
      sprite.scale.set(scale);
      sprite.x = app.screen.width / 2;
      sprite.y = app.screen.height / 2;
      app.stage.addChild(sprite);

      worldContainer.position.set(-app.screen.width / 2, -app.screen.height / 2);

      // Grid interactions (from PixiMapDemo)
      gridContainer.eventMode = "static";
      gridContainer.cursor = "grab";

      let dragging = false;
      let dragStart = { x: 0, y: 0 };
      let gridStart = { x: 0, y: 0 };

      gridContainer.on("pointerdown", (event) => {
        dragging = true;
        dragStart = { x: event.data.global.x, y: event.data.global.y };
        gridStart = { x: worldContainer.position.x, y: worldContainer.position.y };
        gridContainer.cursor = "grabbing";
      });

      gridContainer.on("pointermove", (event) => {
        if (dragging) {
          const dx = event.data.global.x - dragStart.x;
          const dy = event.data.global.y - dragStart.y;
          worldContainer.position.set(gridStart.x + dx, gridStart.y + dy);
        }
      });

      const stopDragging = () => {
        dragging = false;
        gridContainer.cursor = "grab";
      };

      gridContainer.on("pointerup", stopDragging);
      gridContainer.on("pointerupoutside", stopDragging);

      // Drop handlers (from PixiMapDemo)
      const setupDropHandlers = () => {
        if (!pixiContainer.current) return;

        pixiContainer.current.addEventListener("dragover", (e) =>
          e.preventDefault()
        );
        pixiContainer.current.addEventListener("drop", async (e) => {
          e.preventDefault();
          const objectName = e.dataTransfer.getData("objectName");
          if (!objectName) return;

          const rect = pixiContainer.current.getBoundingClientRect();
          const localX = e.clientX - rect.left;
          const localY = e.clientY - rect.top;

          const tileX = Math.floor(
            (localX - worldContainer.position.x) / TILE_SIZE
          );
          const tileY = Math.floor(
            (localY - worldContainer.position.y) / TILE_SIZE
          );

          const fullInfo = await fetchObjectInfo(objectName);
          if (!fullInfo) return;

          gridManagerRef.current.set(tileX, tileY, activeLayer, {
            name: objectName,
            spriteUrl: fullInfo.spriteSheet.url,
            frameSize: fullInfo.spriteSheet.frameSize,
            scale: fullInfo.render?.scale || 1,
            anchor: fullInfo.render?.anchor || { x: 0.5, y: 0.5 },
          });

          await fetch("https://api.metafarmers.io/layer/object/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              layer: activeLayer,
              object: objectName,
              x: tileX,
              y: tileY,
            }),
          });

          needsRedraw.current = true;
        });
      };

      setupDropHandlers();

      // Game loop
      const fps = 10;
      let elapsed = 0;

      app.ticker.add(async (delta) => {
        if (!isFocused.current) return;

        // Redraw map if needed
        if (needsRedraw.current) {
          await drawGrid();
          needsRedraw.current = false;
        }

        // Player movement (from PixiMovementDemo)
        const keys = keysState.current;
        const shift = isShiftPressed.current;
        const speed = shift ? SPRINT_SPEED : WALK_SPEED;

        let vx = 0;
        let vy = 0;
        let moving = false;

        if (!isLocked.current) {
          if (keys["ArrowRight"] || keys["d"]) {
            vx = speed;
            lastDirection.current = "right";
            moving = true;
          } else if (keys["ArrowLeft"] || keys["a"]) {
            vx = -speed;
            lastDirection.current = "left";
            moving = true;
          }

          if (keys["ArrowUp"] || keys["w"]) {
            vy = -speed;
            lastDirection.current = "up";
            moving = true;
          } else if (keys["ArrowDown"] || keys["s"]) {
            vy = speed;
            lastDirection.current = "down";
            moving = true;
          }

          const len = Math.sqrt(vx * vx + vy * vy);
          if (len > speed) {
            vx = (vx / len) * speed;
            vy = (vy / len) * speed;
          }
        }

        if (moving && !isLocked.current) {
          elapsed += delta;
          if (elapsed >= 60 / fps) {
            elapsed = 0;
            lastFrame.current = (lastFrame.current + 1) % framesPerDirection;
          }
        } else {
          lastFrame.current = 0;
        }

        sprite.texture = frames[lastDirection.current][lastFrame.current];

        sprite.x = app.screen.width / 2;
        sprite.y = app.screen.height / 2;

        if (moving && !isLocked.current) {
          worldOffset.current.x -= vx;
          worldOffset.current.y -= vy;
          worldContainer.position.set(worldOffset.current.x, worldOffset.current.y);
        }

        setPlayerState({
          x: Math.round(-worldOffset.current.x + app.screen.width / 2),
          y: Math.round(-worldOffset.current.y + app.screen.height / 2),
          direction: lastDirection.current,
          isMoving: moving && !isLocked.current,
          isSprinting: shift,
          isLocked: isLocked.current,
        });
      });

      const handleKeyDown = (e) => {
        keysState.current[e.key] = true;
        if (e.key === "Shift") isShiftPressed.current = true;
        if (e.key === "Control") {
          isLocked.current = !isLocked.current;
          if (isLocked.current) lastFrame.current = 0;
        }
      };

      const handleKeyUp = (e) => {
        keysState.current[e.key] = false;
        if (e.key === "Shift") {
          isShiftPressed.current = false;
          const anyDirectionPressed = Object.keys(keysState.current).some(
            (key) =>
              key !== "Shift" &&
              keysState.current[key] &&
              [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "w",
                "a",
                "s",
                "d",
              ].includes(key)
          );
          if (!anyDirectionPressed && !isLocked.current) {
            lastFrame.current = 0;
          }
        }
      };

      const handleFocusIn = () => (isFocused.current = true);
      const handleFocusOut = () => (isFocused.current = false);

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("focusin", handleFocusIn);
      window.addEventListener("focusout", handleFocusOut);

      return () => {
        app.destroy(true, { children: true });
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("focusin", handleFocusIn);
        window.removeEventListener("focusout", handleFocusOut);
      };
    };

    run().catch(console.error);
  }, [availableLayers, activeLayer]);

  const zoomIn = () => {
    if (gridContainerRef.current) {
      let newScale = gridContainerRef.current.scale.x * 1.1;
      newScale = Math.min(newScale, MAX_SCALE);
      gridContainerRef.current.scale.set(newScale);
    }
  };

  const zoomOut = () => {
    if (gridContainerRef.current) {
      let newScale = gridContainerRef.current.scale.x * 0.9;
      newScale = Math.max(newScale, MIN_SCALE);
      gridContainerRef.current.scale.set(newScale);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#e4e4e4",
        fontFamily: "monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={pixiContainer}
        style={{ width: "100%", height: "100%", position: "absolute" }}
      />

      <DragItemPanel items={availableObjects} />

      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <select
          value={activeLayer}
          onChange={(e) => {
            setActiveLayer(e.target.value);
            needsRedraw.current = true;
          }}
        >
          {availableLayers.map((layer) => (
            <option key={layer} value={layer}>
              {layer}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button
          onClick={zoomIn}
          style={{ padding: "8px 12px" }}
        >
          Zoom In
        </button>
        <button
          onClick={zoomOut}
          style={{ padding: "8px 12px" }}
        >
          Zoom Out
        </button>
      </div>

      <TopRightHUD playerState={playerState} />

      <div
        style={{
          position: "absolute",
          top: 80,
          right: 10,
          width: 160,
          zIndex: 1100,
        }}
      >
        <div
          style={{ color: "white", marginBottom: 2, fontSize: 12 }}
        >
          🟢 Health
        </div>
        <ProgressBar
          now={70}
          style={{ height: 8, marginBottom: 4 }}
          variant="success"
        />

        <div
          style={{ color: "white", marginBottom: 2, fontSize: 12 }}
        >
          🔵 Armor
        </div>
        <ProgressBar
          now={40}
          style={{ height: 8, marginBottom: 4 }}
          variant="info"
        />

        <div
          style={{ color: "white", marginBottom: 2, fontSize: 12 }}
        >
          🟠 Energy
        </div>
        <ProgressBar
          now={85}
          style={{ height: 8 }}
          variant="warning"
        />
      </div>

      {showCatalog && <CatalogWindow onClose={() => setShowCatalog(false)} />}
      {showConsole && <ConsoleWindow onClose={() => setShowConsole(false)} />}
      {showNavigator && (
        <NavigationWindow onClose={() => setShowNavigator(false)} />
      )}
      {showPhone && <PhoneWindow onClose={() => setShowPhone(false)} />}

      <Hotbar
        selectedSlot={selectedSlot}
        setSelectedSlot={setSelectedSlot}
      />
      <ChatBox />
      <Minimap />
      <ChatBubble
        text="Hey! Wanna trade?"
        position={{ top: 260, left: 100 }}
      />

      <BottomBar
        toggleCatalog={() => setShowCatalog((prev) => !prev)}
        toggleConsole={() => setShowConsole((prev) => !prev)}
        toggleNavigator={() => setShowNavigator((prev) => !prev)}
        togglePhone={() => setShowPhone((prev) => !prev)}
      />

      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#222",
          color: "#0f0",
          padding: "4px 10px",
          fontSize: 12,
          border: "2px solid #000",
          fontFamily: "monospace",
          zIndex: 1100,
        }}
      >
        Server Time: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
