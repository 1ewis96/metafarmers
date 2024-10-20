import React from 'react';
import Subnav from '../components/subnav'; // Ensure correct import path
import Cookies from 'js-cookie'; // Import js-cookie to manage cookies
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

const Logout = () => {
  const navigate = useNavigate(); // Create a navigate instance for navigation

  const handleLogout = () => {
    // Remove the session cookie
    Cookies.remove('sessionKey');

    // Optionally, inform the user that they have logged out
    alert('You have successfully logged out.');

    // Redirect to the login page
    navigate('/login'); // Adjust the path based on your routing setup
  };

  return (
    <>
      <Subnav />
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1>Logout</h1>
        <p>Confirm Logout</p>
        <button id="logout" className="btn btn-primary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </>
  );
};

export default Logout;
