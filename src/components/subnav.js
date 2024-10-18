// src/components/subnav.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const Subnav = () => {
  return (
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <ul className="nav nav-underline">
        <li className="nav-item">
          <Link className="nav-link active" aria-current="page" to="/home">Active</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/features">Link</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/pricing">Link</Link>
        </li>
        <li className="nav-item">
          <span className="nav-link disabled" aria-disabled="true">Disabled</span>
        </li>
      </ul>
    </div>
  );
};

export default Subnav;
