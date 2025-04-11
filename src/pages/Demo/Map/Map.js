import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, InputGroup, Button } from "react-bootstrap";
import Navigation from "../../Navigation";
import PixiMapDemo from "./PixiMapDemo";
import InfoBox from "./InfoBox";
import ContextMenu from "./ContextMenu";
import { loadLevel } from "./utils/objectUtils";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/MapStyles.css";

const Map = () => {
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [highlightedCell, setHighlightedCell] = useState(null);
  const [objects, setObjects] = useState([]);
  const [currentLevel, setCurrentLevel] = useState("level1");
  const [infoBoxContent, setInfoBoxContent] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, object: null });
  const [consoleLines, setConsoleLines] = useState([]);
  const [command, setCommand] = useState("");

  useEffect(() => {
    const fetchLevel = async () => {
      const levelData = await loadLevel(currentLevel);
      setObjects(levelData.objects);
    };
    fetchLevel().catch(console.error);
  }, [currentLevel]);

  const handleCellClick = (x, y) => {
    setHighlightedCell({ x, y });
    if (isBuildMode) {
      const obj = objects.find(o => o.position.x === x && o.position.y === y);
      if (obj) {
        setInfoBoxContent(obj);
        setConsoleLines((prev) => [...prev, `Clicked object: ${obj.id} at (${x}, ${y})`]);
        setTimeout(() => setInfoBoxContent(null), 3000);
      }
    }
  };

  const handleCellRightClick = (e, x, y) => {
    e.preventDefault();
    if (isBuildMode) {
      const obj = objects.find(o => o.position.x === x && o.position.y === y);
      if (obj) {
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, object: obj });
      }
    }
  };

  const handleContextMenuSelect = (option) => {
    setInfoBoxContent(contextMenu.object);
    setConsoleLines((prev) => [...prev, `Selected: ${option} for ${contextMenu.object.id}`]);
    setContextMenu({ ...contextMenu, visible: false });
    setTimeout(() => setInfoBoxContent(null), 3000);
  };

  const handleCommandSubmit = () => {
    if (command.trim() === "") return;
    setConsoleLines((prev) => [...prev, `> ${command}`]);
    setCommand("");
  };

  const handleLevelChange = (e) => {
    setCurrentLevel(e.target.value);
    setHighlightedCell(null);
    setConsoleLines((prev) => [...prev, `Switched to ${e.target.value}`]);
  };

  return (
    <>
      <Navigation />
      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <h2 className="text-center">Map Playground Demo</h2>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card className="bg-dark text-white">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Live Map Demo</span>
                <Form.Select value={currentLevel} onChange={handleLevelChange} style={{ width: "200px" }}>
                  <option value="level1">Level 1</option>
                  <option value="level2">Level 2</option>
                </Form.Select>
              </Card.Header>
              <Card.Body style={{ height: "400px", width: "100%" }}>
                <div
                  style={{
                    border: "2px solid #ccc",
                    borderRadius: "8px",
                    overflow: "hidden",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <PixiMapDemo
                    isBuildMode={isBuildMode}
                    setIsBuildMode={setIsBuildMode}
                    highlightedCell={highlightedCell}
                    objects={objects}
                    currentLevel={currentLevel}
                    onCellClick={handleCellClick}
                    onCellRightClick={handleCellRightClick}
                  />
                </div>
                <InfoBox visible={!!infoBoxContent} content={infoBoxContent} />
                <ContextMenu
                  visible={contextMenu.visible}
                  x={contextMenu.x}
                  y={contextMenu.y}
                  object={contextMenu.object}
                  onSelect={handleContextMenuSelect}
                  onClose={() => setContextMenu({ ...contextMenu, visible: false })}
                />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="mb-4">
              <Card.Header>Dev Console</Card.Header>
              <Card.Body>
                <div
                  style={{
                    background: "#000",
                    color: "#0f0",
                    height: "200px",
                    overflowY: "auto",
                    padding: "10px",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    borderRadius: "4px",
                  }}
                >
                  {consoleLines.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                <InputGroup className="mt-3">
                  <Form.Control
                    placeholder="Type command..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCommandSubmit();
                    }}
                  />
                  <Button onClick={handleCommandSubmit} variant="dark">
                    Send
                  </Button>
                </InputGroup>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Map State</Card.Header>
              <Card.Body>
                <ul className="list-unstyled mb-2">
                  <li><strong>Level:</strong> {currentLevel}</li>
                  <li><strong>Build Mode:</strong> {isBuildMode ? "On" : "Off"}</li>
                  <li><strong>Highlighted Cell:</strong> {highlightedCell ? `(${highlightedCell.x}, ${highlightedCell.y})` : "None"}</li>
                  <li><strong>Objects:</strong> {objects.length}</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Map;