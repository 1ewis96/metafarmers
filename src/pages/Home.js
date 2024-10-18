// src/pages/Home.js
import React from 'react';
import Subnav from '../components/subnav'; // Ensure correct import path

const Home = () => {
  return (
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <h1>Home Page</h1>
      <p>Welcome to Meta Farmers!</p>
      <Subnav /> {/* Ensure Subnav is rendered within the main content */}
    </div>
  );
};

export default Home;
