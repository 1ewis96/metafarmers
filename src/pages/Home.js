// src/pages/Home.js
import React from 'react';
import Subnav from '../components/subnav'; // Ensure correct import path

const Home = () => {
  return (
    <>
      {/* Wrapper for the entire content */}
      <div id="carouselExampleAutoplaying" className="carousel slide mt-n5" data-bs-ride="carousel">
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src="https://placehold.co/1500x400/EEE/31343C" className="d-block w-100" alt="First slide" />
          </div>
          <div className="carousel-item">
            <img src="https://placehold.co/1500x400/EEE/31343C" className="d-block w-100" alt="Second slide" />
          </div>
          <div className="carousel-item">
            <img src="https://placehold.co/1500x400/EEE/31343C" className="d-block w-100" alt="Third slide" />
          </div>
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>

      <Subnav /> {/* Ensure Subnav is rendered within the main content */}

      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1>Home Page</h1>
        <p>Welcome to Meta Farmers!</p>
      </div>
    </>
  );
};

export default Home;
