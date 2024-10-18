// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';          // Import Home component
import Features from './pages/Features';  // Import Features component
import Pricing from './pages/Pricing';    // Import Pricing component

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          {/* Redirect from '/' to '/home' */}
          <Route path="/" element={<Navigate to="/home" />} />

          {/* Explicit routes */}
          <Route path="/home" element={<Home />} />        {/* Home route */}
          <Route path="/features" element={<Features />} /> {/* Features route */}
          <Route path="/pricing" element={<Pricing />} />  {/* Pricing route */}
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
