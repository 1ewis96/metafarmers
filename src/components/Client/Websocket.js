import React, { useState, useEffect, useRef } from 'react';
import Subnav from '../subnav'; // Adjust path if needed

const Marketplace = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    // Connect to your WebSocket server (change URL if needed)
    ws.current = new WebSocket('wss://13.51.85.5'); // Echo server for testing

    ws.current.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.current.onmessage = (event) => {
      setMessages((prev) => [...prev, { type: 'received', text: event.data }]);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(input);
      setMessages((prev) => [...prev, { type: 'sent', text: input }]);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <>
      <Subnav />
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1 className="mb-4">WebSocket Test Page</h1>
        <div className="border p-3 rounded bg-light mb-3" style={{ height: '300px', overflowY: 'auto' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`text-${msg.type === 'sent' ? 'primary' : 'success'}`}>
              <strong>{msg.type === 'sent' ? 'You' : 'Server'}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <div className="input-group">
          <input
            className="form-control"
            placeholder="Type a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn btn-primary" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </>
  );
};

export default Marketplace;
