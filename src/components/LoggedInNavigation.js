// src/components/LoggedInNavigation.js
import React from 'react';
import { Link } from 'react-router-dom';

function LoggedInNavigation() {
  return (
    <nav>
      <ul>
        <li><Link to="/home">Home</Link></li>
        <li><Link to="/community">Community</Link></li>
        <li><Link to="/shop">Shop</Link></li>
        <li><Link to="/playing">Playing</Link></li>
        <li><Link to="/marketplace">Marketplace</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/logout">Logout</Link></li>
      </ul>
    </nav>
  );
}

export default LoggedInNavigation;
