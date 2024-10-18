// src/App.js
import React from 'react';
import Navigation from './components/navigation';
import Footer from './components/footer';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';          // Import Home component
import Features from './pages/Features';  // Import Features component
import Pricing from './pages/Pricing';    // Import Pricing component

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />        {/* Home route */}
          <Route path="/features" element={<Features />} /> {/* Features route */}
          <Route path="/pricing" element={<Pricing />} />  {/* Pricing route */}
        </Routes>
      </div>
    </Router>
	
	<footer />
  );
}

export default App;
