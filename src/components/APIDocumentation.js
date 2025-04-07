import React, { useState, useEffect, useRef } from "react";
import useAuthCheck from "../hooks/auth/TokenValidation";

const APIDocumentation = () => {
  const { isAuthenticated, loading } = useAuthCheck();

  const [socketUrl, setSocketUrl] = useState("wss://your-websocket-url");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    if (!isAuthenticated) {
      alert("You must be authenticated to connect.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("No token found. Please log in.");
      return;
    }

    // Append token as a query param (you can adjust this if your server expects it differently)
    const fullSocketUrl = `${socketUrl}?token=${token}`;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(fullSocketUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("Connected");
    };

    ws.onclose = () => {
      setConnectionStatus("Disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Error");
    };

    ws.onmessage = (event) => {
      setReceivedMessages((prev) => [...prev, event.data]);
    };
  };

  const sendMessage = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
      setMessage("");
    } else {
      alert("WebSocket is not connected.");
    }
  };

  if (loading) {
    return <p className="p-4">Checking authentication...</p>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">WebSocket Test Interface</h1>

      <div className="mb-4">
        <label className="block font-medium mb-1">WebSocket URL</label>
        <input
          type="text"
          value={socketUrl}
          onChange={(e) => setSocketUrl(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={connectWebSocket}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Connect
        </button>
        <span className="ml-4">Status: <strong>{connectionStatus}</strong></span>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Send Message</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={sendMessage}
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Received Messages</h2>
        <div className="border p-2 rounded h-64 overflow-y-auto bg-gray-50">
          {receivedMessages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            receivedMessages.map((msg, i) => (
              <pre key={i} className="border-b py-1">{msg}</pre>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default APIDocumentation;
