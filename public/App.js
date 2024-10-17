// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Use Routes instead of Switch
import Navigation from './components/Navigation';

const HomePage = () => (
  <div>
    <h1>Home Page</h1>
    <p>Welcome to the Home Page!</p>
  </div>
);

const AboutPage = () => (
  <div>
    <h1>About Page</h1>
    <p>This is the About Page.</p>
  </div>
);

const ServicesPage = () => (
  <div>
    <h1>Services Page</h1>
    <p>Details about our Services.</p>
  </div>
);

const ContactPage = () => (
  <div>
    <h1>Contact Page</h1>
    <p>Get in touch through the Contact Page.</p>
  </div>
);

const App = () => {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes> {/* Use Routes instead of Switch */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
