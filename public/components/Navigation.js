// src/components/Navigation.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const Navigation = () => {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/services">Services</Link>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
      </ul>
      <style jsx>{`
        nav {
          background: #333;
          padding: 1rem;
        }
        ul {
          list-style-type: none;
          padding: 0;
        }
        li {
          display: inline;
          margin-right: 20px;
        }
        a {
          color: white;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      `}</style>
    </nav>
  );
};

export default Navigation;
