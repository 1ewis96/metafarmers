// src/App.js
import React from 'react';
import './App.css';
import Navigation from './components/navigation';

function App() {
  return (
    <div className="App">
      <Navigation />
      <header className="App-header">
        <h1>Welcome to Meta Farmers</h1>
        <p>This is your new app with a Bootstrap-based Navbar!</p>
      </header>
    </div>
  );
}

export default App;
