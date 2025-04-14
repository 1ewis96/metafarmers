// Enhanced Habbo-style draggable windows in React with a polished catalog UI
import React, { useState } from "react";
import Draggable from "react-draggable";
import { Button, ProgressBar, Card } from "react-bootstrap";

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
      boxShadow: "inset -1px -1px 0 #880000"
    }}
  >
    ✕
      </div>
  );

const BundleCard = ({ title, description }) => (
  <div style={{
    marginBottom: 8,
    backgroundColor: '#ffe082',
    border: '2px solid #000',
    borderRadius: '2px',
    padding: 6,
    fontSize: 12,
    fontFamily: 'monospace',
    boxShadow: '4px 4px 0 #999',
    imageRendering: 'pixelated'
  }}>
    <div style={{
      width: '100%',
      height: 60,
      backgroundColor: '#c89f55',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontStyle: 'italic',
      fontWeight: 'bold',
      border: '1px dashed #000',
      marginBottom: 4
    }}>
      {title}
    </div>
    <div style={{ color: '#333' }}>{description}</div>
  </div>
);

const HabboWindow = ({ title, children, defaultPosition, onClose }) => {
  return (
    // Add more UI elements
    // 1. XP Bar
    // 2. Currency Display
    // 3. Status Panel
    // 4. Server Clock
    <Draggable handle=".window-header" defaultPosition={defaultPosition}>
      <div
        style={{
          width: 320,
          border: "2px solid black",
          backgroundColor: "#cfcfcf",
          position: "absolute",
          zIndex: 1000,
          fontFamily: "monospace",
          boxShadow: "4px 4px 0px #888"
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
            position: "relative"
          }}
        >
          {title}
          <CloseButton onClick={onClose} />
        </div>
        <div style={{ padding: 10 }}>{children}</div>
      </div>
    </Draggable>
  );
};

const CatalogWindow = ({ onClose }) => {
  const [page, setPage] = useState("home");

  const renderPage = () => {
    switch (page) {
      case "home":
        return (
          <>
            <p><strong>Latest Bundles</strong></p>
            <BundleCard title="Starter Room Bundle" description="Includes furniture to start building your own space." />
            <BundleCard title="Party Pack" description="Decorations and lighting for a party vibe." />
            <BundleCard title="Retro Furniture Kit" description="Classic Habbo items from back in the day." />
            <p><strong>Your Balance:</strong> <span style={{ color: '#007bff' }}>320 $TASK</span></p>
            <Button size="sm" variant="dark" onClick={() => setPage("main")}>Browse Categories ➡</Button>
          </>
        );
      case "main":
        return (
          <>
            <p><strong>Categories:</strong></p>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
              <li><Button variant="link" onClick={() => setPage("credits")}>💰 Credits</Button></li>
              <li><Button variant="link" onClick={() => setPage("furniture")}>🪑 Furniture</Button></li>
              <li><Button variant="link" onClick={() => setPage("decor")}>🎨 Decorations</Button></li>
            </ul>
            <Button size="sm" variant="secondary" onClick={() => setPage("home")}>⬅ Home</Button>
          </>
        );
      case "credits":
        return (
          <>
            <p><strong>Credit Packages</strong></p>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
              <li>💵 10 Credits - .99</li>
              <li>💵 50 Credits - $8.99</li>
              <li>💵 100 Credits - 6.99</li>
            </ul>
            <Button size="sm" variant="secondary" onClick={() => setPage("main")}>⬅ Back</Button>
          </>
        );
      case "furniture":
        return (
          <>
            <p><strong>Furniture</strong></p>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
              <li>🛋 Sofa</li>
              <li>🪑 Chair</li>
              <li>🛏 Bed</li>
            </ul>
            <Button size="sm" variant="secondary" onClick={() => setPage("main")}>⬅ Back</Button>
          </>
        );
      case "decor":
        return (
          <>
            <p><strong>Decorations</strong></p>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
              <li>🖼 Wall Art</li>
              <li>🪞 Mirror</li>
              <li>🕯 Candles</li>
            </ul>
            <Button size="sm" variant="secondary" onClick={() => setPage("main")}>⬅ Back</Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <HabboWindow title="Catalog" defaultPosition={{ x: 100, y: 100 }} onClose={onClose}>
      {renderPage()}
    </HabboWindow>
  );
};

const ConsoleWindow = ({ onClose }) => (
  <HabboWindow title="Console" defaultPosition={{ x: 450, y: 120 }} onClose={onClose}>
    <p><strong>Online Friends</strong></p>
    <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
      <li>🟢 Alex</li>
      <li>🟡 Jamie</li>
      <li>🔴 Sam</li>
    </ul>
  </HabboWindow>
);

const NavigationWindow = ({ onClose }) => (
  <HabboWindow title="🚇 Navigator" defaultPosition={{ x: 800, y: 150 }} onClose={onClose}>
    <div style={{
      backgroundColor: '#ffe082',
      border: '2px solid black',
      padding: '8px',
      boxShadow: '4px 4px 0 #999',
      fontFamily: 'monospace',
      imageRendering: 'pixelated'
    }}>
      <p style={{ fontSize: 13 }}><strong>🚉 Subway Lines</strong></p>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px' }}>
        <li>🟡 Central Plaza</li>
        <li>🟢 Garden Terminal</li>
        <li>🔴 Crimson Station</li>
      </ul>
    </div>
    <br />
    <div style={{
      backgroundColor: '#fff3cd',
      border: '2px dashed #000',
      padding: '6px',
      boxShadow: '2px 2px 0 #bbb',
      fontFamily: 'monospace',
      imageRendering: 'pixelated'
    }}>
      <p style={{ fontSize: 13 }}><strong>🧭 Waypoints</strong></p>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px' }}>
        <li>🏠 Lobby</li>
        <li>🏖 Beach Party</li>
        <li>🕹 Arcade</li>
      </ul>
    </div>
    <br />
    <p><strong>My Rooms</strong></p>
    <ul style={{ listStyle: "none", padding: 0, fontSize: "13px" }}>
      <li>🛏 Chill Room</li>
      <li>🎉 Event Space</li>
    </ul>
  </HabboWindow>
);

const TopRightHUD = () => (
  <div style={{
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
    zIndex: 1100
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    }}>
      <div style={{
        width: 32,
        height: 32,
        backgroundColor: "#777",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 10,
        fontStyle: "italic",
        color: "#fff"
      }}>Face</div>
      <div><strong>Lvl 12</strong></div>
    </div>
    <div>❤️ Health</div>
    <ProgressBar now={70} label={`70%`} variant="danger" style={{ height: 10 }} />
  </div>
);

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
        zIndex: 1100
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
            fontSize: 12
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
};

const ChatBox = () => (
  <div style={{
    position: 'absolute',
    bottom: 60,
    left: 10,
    backgroundColor: '#fff',
    border: '2px solid #000',
    padding: '4px 6px',
    width: 220,
    zIndex: 1100,
    fontSize: 12,
    fontFamily: 'monospace'
  }}>
    <input
      type="text"
      placeholder="Say something..."
      style={{
        width: '100%',
        padding: '4px',
        fontSize: '12px',
        border: 'none',
        outline: 'none'
      }}
    />
  </div>
);

const Minimap = () => (
  <div style={{
    position: 'absolute',
    top: 10,
    left: 10,
    width: 100,
    height: 100,
    backgroundColor: '#222',
    border: '2px solid #000',
    zIndex: 1100,
    fontSize: 10,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'monospace'
  }}>
    Minimap
  </div>
);

const Notification = ({ text }) => (
  <div style={{
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#111',
    color: '#fff',
    padding: '6px 10px',
    fontSize: 12,
    fontFamily: 'monospace',
    border: '1px solid #444',
    zIndex: 1100
  }}>
    {text}
  </div>
);

const BottomBar = ({ toggleCatalog, toggleConsole, toggleNavigator, togglePhone }) => (
  <Draggable handle=".bar-drag" defaultPosition={{ x: 10, y: 520 }}>
    <div
      style={{
        backgroundColor: "#2a2a2a",
        border: "2px solid black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        padding: '4px 6px',
        borderRadius: 4,
        zIndex: 1200,
        position: 'absolute'
      }}
    >
      <div className="bar-drag" style={{ cursor: 'move', paddingRight: 6 }}>☰</div>
      <Button variant="dark" size="sm" onClick={toggleCatalog}>📦</Button>
      <Button variant="dark" size="sm" onClick={toggleConsole}>💬</Button>
      <Button variant="dark" size="sm" onClick={toggleNavigator}>🧭</Button>
      <Button variant="dark" size="sm" onClick={togglePhone}>📱</Button>
    </div>
  </Draggable>
);

const PhoneWindow = ({ onClose }) => (
  <HabboWindow title="📱 Old Phone" defaultPosition={{ x: 400, y: 300 }} onClose={onClose}>
    <div style={{
      fontSize: 12,
      lineHeight: '16px',
      color: 'lime',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '10px',
      boxShadow: '0 0 10px lime',
      fontFamily: 'monospace'
    }}>
      <p><strong>Contacts</strong></p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>📞 Alex</li>
        <li>📞 Jamie</li>
        <li>📞 Riley</li>
      </ul>
      <hr style={{ borderColor: 'lime' }} />
      <p><strong>Apps</strong></p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>📷 Camera</li>
        <li>🎵 Music</li>
        <li>📝 Notes</li>
      </ul>
    </div>
  </HabboWindow>
);

const ChatBubble = ({ text, position = { top: 240, left: 80 } }) => (
  <div style={{
    position: 'absolute',
    top: position.top,
    left: position.left,
    backgroundColor: '#fff',
    border: '1px solid #000',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 12,
    fontFamily: 'monospace',
    maxWidth: 180,
    boxShadow: '2px 2px 0 #444',
    zIndex: 1000
  }}>
    {text}
  </div>
);

export default function HabboDemoPage() {
  const [showCatalog, setShowCatalog] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [showNavigator, setShowNavigator] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#e4e4e4",
        fontFamily: "monospace",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <TopRightHUD />

      {/* Health, Armor, Energy Bars */}
      <div style={{ position: 'absolute', top: 80, right: 10, width: 160, zIndex: 1100 }}>
        <div style={{ color: 'white', marginBottom: 2, fontSize: 12 }}>🟢 Health</div>
        <ProgressBar now={70} style={{ height: 8, marginBottom: 4 }} variant="success" />

        <div style={{ color: 'white', marginBottom: 2, fontSize: 12 }}>🔵 Armor</div>
        <ProgressBar now={40} style={{ height: 8, marginBottom: 4 }} variant="info" />

        <div style={{ color: 'white', marginBottom: 2, fontSize: 12 }}>🟠 Energy</div>
        <ProgressBar now={85} style={{ height: 8 }} variant="warning" />
      </div>
      {showCatalog && <CatalogWindow onClose={() => setShowCatalog(false)} />}
      {showConsole && <ConsoleWindow onClose={() => setShowConsole(false)} />}
      {showNavigator && <NavigationWindow onClose={() => setShowNavigator(false)} />}
      <Hotbar selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} />
      <ChatBox />
      <Minimap />
      <ChatBubble text="Hey! Wanna trade?" position={{ top: 260, left: 100 }} />
      
          {showPhone && <PhoneWindow onClose={() => setShowPhone(false)} />}
      <BottomBar
        toggleCatalog={() => setShowCatalog((prev) => !prev)}
        toggleConsole={() => setShowConsole((prev) => !prev)}
        toggleNavigator={() => setShowNavigator((prev) => !prev)}
        togglePhone={() => setShowPhone((prev) => !prev)}
      />
          {/* Additional UI Elements */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#222',
        color: '#0f0',
        padding: '4px 10px',
        fontSize: 12,
        border: '2px solid #000',
        fontFamily: 'monospace',
        zIndex: 1100
      }}>
        Server Time: {new Date().toLocaleTimeString()}
      </div>

      <div style={{
        position: 'absolute',
        bottom: 120,
        left: 10,
        backgroundColor: '#ffe082',
        padding: 6,
        border: '2px solid #000',
        fontSize: 12,
        fontFamily: 'monospace',
        boxShadow: '4px 4px 0 #999',
        zIndex: 1100
      }}>
        💰 $TASK: <strong>320</strong>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 160,
        left: 10,
        backgroundColor: '#fff3cd',
        padding: 6,
        border: '2px dashed #000',
        fontSize: 12,
        fontFamily: 'monospace',
        boxShadow: '2px 2px 0 #bbb',
        zIndex: 1100
      }}>
        🧠 Status: Rested
      </div>
    </div>
  );
}
