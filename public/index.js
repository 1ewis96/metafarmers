// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Use 'react-dom' for React 17 and below
import App from './App'; // Import the main App component
import './index.css'; // Import any global styles (optional)

const root = ReactDOM.createRoot(document.getElementById('root')); // Create a root element
root.render(
  <React.StrictMode>
    <App /> {/* Render the App component */}
  </React.StrictMode>
);
