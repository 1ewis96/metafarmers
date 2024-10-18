// src/components/subnav.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const Subnav = () => {
  return (
   
      <ul className="nav nav-underline">
        <li className="nav-item">
          <Link className="nav-link active" aria-current="page" to="/home">Home</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/community">Community</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/shop">Shop</Link>
        </li>
		<li className="nav-item">
          <Link className="nav-link" to="/playing">Playing {Name}</Link>
        </li>
		<li className="nav-item">
          <Link className="nav-link" to="/marketplace">Marketplace</Link>
        </li>
      </ul>

  );
};

export default Subnav;
