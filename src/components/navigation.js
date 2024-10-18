// src/components/navigation.js
import React from 'react';

import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const Navigation = () => {
  return (
  <div className="col-lg-8 mx-auto p-4 py-md-5">
    <header className="d-flex align-items-center pb-3 mb-5 border-bottom">
      <Link to="/" className="d-flex align-items-center text-body-emphasis text-decoration-none">
        <svg className="bi me-2" width="40" height="32">
          <use xlinkHref="#bootstrap" />
        </svg>
        <span className="fs-4">Meta Farmers</span>
      </Link>

      <nav className="ms-auto">
        <ul className="nav">
          <li className="nav-item">
            <Link className="nav-link" to="/registration">Join Now</Link>
          </li>
        </ul>
      </nav>
    </header>
	</div>
  );
};

export default Navigation;
