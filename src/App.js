import React, { useState, useEffect } from "react";
import { Container, Navbar, Card, Button, Form, Alert } from "react-bootstrap";
import io from "socket.io-client";
import ReactJson from "react-json-view";

const posts = [
  { title: "First Blog Post", content: "This is my first blog post!" },
  { title: "Second Blog Post", content: "This is my second blog post!" },
];

function App() {
  const [socket, setSocket] = useState(null);
  const [url, setUrl] = useState("http://localhost:3000");
  const [connected, setConnected] = useState(false);
  const [eventName, setEventName] = useState("testAlert");
  const [payload, setPayload] = useState({ message: "Hello from debug console!" });
  const [messages, setMessages] = useState([]);
  const [alertData, setAlertData] = useState(null);

  const connect = () => {
    const newSocket = io(url);
    newSocket.on("connect", () => setConnected(true));
    newSocket.on("disconnect", () => setConnected(false));
    newSocket.on("uiAlert", (data) => {
      setAlertData(data);
      logMessage("Received", "uiAlert", data);
    });
    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  };

  const sendEvent = () => {
    if (socket && eventName) {
      socket.emit(eventName, payload);
      logMessage("Sent", eventName, payload);
    }
  };

  const logMessage = (direction, name, data) => {
    setMessages((prev) => [
      { direction, name, data, timestamp: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="#">My React Blog</Navbar.Brand>
        </Container>
      </Navbar>

      <Container className="mt-4">
        {posts.map((post, index) => (
          <Card key={index} className="mb-3">
            <Card.Body>
              <Card.Title>{post.title}</Card.Title>
              <Card.Text>{post.content}</Card.Text>
            </Card.Body>
          </Card>
        ))}

        <Card className="mt-4">
          <Card.Body>
            <Card.Title>WebSocket Debug Console</Card.Title>

            <Form.Group className="mb-3">
              <Form.Label>Server URL</Form.Label>
              <Form.Control
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Form.Group>

            <Button
              variant={connected ? "danger" : "success"}
              onClick={connected ? disconnect : connect}
              className="mb-3"
            >
              {connected ? "Disconnect" : "Connect"}
            </Button>

            <Form.Group className="mb-3">
              <Form.Label>Event Name</Form.Label>
              <Form.Control
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </Form.Group>

            <Form.Label>Payload</Form.Label>
            <div className="mb-3 border rounded p-2 bg-light">
              <ReactJson
                src={payload}
                onEdit={(e) => setPayload(e.updated_src)}
                onAdd={(e) => setPayload(e.updated_src)}
                onDelete={(e) => setPayload(e.updated_src)}
                name={false}
              />
            </div>

            <Button variant="primary" onClick={sendEvent}>
              Send Event
            </Button>

            {alertData && (
              <Alert variant={alertData.type || "info"} className="mt-3">
                <Alert.Heading>{alertData.title}</Alert.Heading>
                <p>{alertData.body}</p>
              </Alert>
            )}
          </Card.Body>
        </Card>

        <Card className="mt-4">
          <Card.Body>
            <Card.Title>Event Log</Card.Title>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <strong>{msg.timestamp}</strong>{" "}
                  <span className={msg.direction === "Sent" ? "text-primary" : "text-success"}>
                    [{msg.direction}]
                  </span>{" "}
                  <code>{msg.name}</code>
                  <pre className="bg-light p-2 rounded">
                    {JSON.stringify(msg.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}

export default App;
