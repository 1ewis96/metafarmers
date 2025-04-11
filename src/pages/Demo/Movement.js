import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  ProgressBar,
} from "react-bootstrap";
import Navigation from "../Navigation";
import PixiMovementDemo from "./PixiMovementDemo";

const DemoMovement = () => {
  const [consoleLines, setConsoleLines] = useState([]);
  const [command, setCommand] = useState("");
  const [directionPressed, setDirectionPressed] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const [characterState, setCharacterState] = useState({
    x: 0,
    y: 0,
    direction: "right",
    isMoving: false,
    isSprinting: false,
  });

  const [speed, setSpeed] = useState({
    walk: 3,
    sprint: 6,
  });

  const handleCommandSubmit = () => {
    if (command.trim() === "") return;
    setConsoleLines((prev) => [...prev, `> ${command}`]);
    setCommand("");
  };

  // Dev: Simulated live state update (no longer needed with Pixi handling movement)
  useEffect(() => {
    // Removed random movement simulation since Pixi now handles it
  }, []);

  return (
    <>
      <Navigation />
      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <h2 className="text-center">Character Movement Playground</h2>
          </Col>
        </Row>

        <Row>
          {/* Movement Engine */}
          <Col lg={8}>
            <Card className="bg-dark text-white">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Live Movement Demo</span>
                <Form.Select style={{ width: "200px" }}>
                  <option>Default Skin</option>
                  <option>Future Skin 1</option>
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
                  <PixiMovementDemo
                    walkSpeed={speed.walk}
                    sprintSpeed={speed.sprint}
                    onStateChange={setCharacterState}
                  />
                </div>

                {/* Direction Buttons */}
                <div className="text-center mt-4">
                  {["up", "left", "down", "right"].map((dir) => (
                    <Button
                      key={dir}
                      variant={directionPressed[dir] ? "primary" : "secondary"}
                      onClick={() =>
                        setDirectionPressed((prev) => ({
                          ...prev,
                          [dir]: !prev[dir],
                        }))
                      }
                      className="mx-1"
                    >
                      {dir === "up" ? "↑" : dir === "down" ? "↓" : dir === "left" ? "←" : "→"}
                    </Button>
                  ))}
                </div>

                {/* Speed Sliders */}
                <div className="mt-4">
                  <Form.Label className="text-white">Walk Speed: {speed.walk}</Form.Label>
                  <Form.Range
                    min={1}
                    max={10}
                    value={speed.walk}
                    onChange={(e) =>
                      setSpeed((prev) => ({ ...prev, walk: parseInt(e.target.value) }))
                    }
                  />

                  <Form.Label className="text-white mt-3">Sprint Speed: {speed.sprint}</Form.Label>
                  <Form.Range
                    min={5}
                    max={15}
                    value={speed.sprint}
                    onChange={(e) =>
                      setSpeed((prev) => ({ ...prev, sprint: parseInt(e.target.value) }))
                    }
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Side Panel */}
          <Col lg={4}>
            {/* Dev Console */}
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

            {/* Character State Panel */}
            <Card>
              <Card.Header>Character State</Card.Header>
              <Card.Body>
                <ul className="list-unstyled mb-2">
                  <li><strong>X:</strong> {characterState.x}</li>
                  <li><strong>Y:</strong> {characterState.y}</li>
                  <li><strong>Direction:</strong> {characterState.direction}</li>
                  <li><strong>Moving:</strong> {characterState.isMoving ? "Yes" : "No"}</li>
                  <li><strong>Sprinting:</strong> {characterState.isSprinting ? "Yes" : "No"}</li>
                </ul>
                <ProgressBar
                  now={characterState.isSprinting ? 100 : characterState.isMoving ? 50 : 0}
                  variant={characterState.isSprinting ? "danger" : "info"}
                  label={characterState.isSprinting ? "Sprinting" : characterState.isMoving ? "Walking" : "Idle"}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default DemoMovement;