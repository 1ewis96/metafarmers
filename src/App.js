// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navigation from './components/navigation';
import Footer from './components/footer';
import Home from './pages/Home';          // Import Home component
import Community from './pages/Community';          // Import Community component
import Shop from './pages/Shop';          // Import Shop component
import Playing from './pages/Playing';          // Import Playing component
import Marketplace from './pages/Marketplace';          // Import Marketplace component
import Registration from './pages/Registration';          // Import Registration component
import Login from './pages/Login';          // Import Login component

import NotFound from './errors/NotFound';   // Import NotFound component

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
          <Route path="/community" element={<Community />} /> {/* Community route */}
          <Route path="/shop" element={<Shop />} />  {/* Shop route */}
		  <Route path="/playing" element={<Playing />} />  {/* Playing route */}
		  <Route path="/marketplace" element={<Marketplace />} />  {/* Marketplace route */}
		  
		  <Route path="/registration" element={<Registration />} />  {/* Registration route */}
		  <Route path="/login" element={<Login />} />  {/* Login route */}
		  
		  <Route path="*" element={<NotFound />} />       {/* Catch-all route for 404 */}
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
