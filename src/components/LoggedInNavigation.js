// src/components/LoggedInNavigation.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import placeholder from '../assets/placeholder.png';

const LoggedInNavigation = () => {
  return (
   <>
      <header className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-between py-3 border-bottom bg-dark">
     
		 <div className="col-md-3 mb-2 mb-md-0">
          <Link to="/" className="d-inline-flex link-body-emphasis text-decoration-none">
            <svg className="bi" width="40" height="32" role="img" aria-label="Bootstrap">
              <use xlinkHref="#bootstrap" />
            </svg>
            <span className="fs-4 ms-2">
			<div className="logoPlaceholder" style={{ backgroundImage: `url(${placeholder})` }}>
			</div>
			</span>
          </Link>
        </div>

        <div className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0">
        <Link to="/home">Home</Link>
        <Link to="/community">Community</Link>
        <Link to="/shop">Shop</Link>
        <Link to="/playing">Playing</Link>
        <Link to="/marketplace">Marketplace</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/logout">Logout</Link>
        </div>

        <div className="col-md-3 text-end">
    <Link className="btn btn-primary me-2" to="/login">Login</Link>
          <Link className="btn btn-primary me-5" to="/client">Client></Link>
        </div>
	
      </header>
</>
  );
};

export default LoggedInNavigation;
