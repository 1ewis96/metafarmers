// src/components/subnav.js
import React from 'react';

import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const Subnav = () => {
  return (
  <div className="col-lg-8 mx-auto p-4 py-md-5">
	<ul className="nav nav-underline">
	  <li className="nav-item">
		<a className="nav-link active" aria-current="page" href="#">Active</a>
	  </li>
	  <li className="nav-item">
		<a className="nav-link" href="#">Link</a>
	  </li>
	  <li className="nav-item">
		<a className="nav-link" href="#">Link</a>
	  </li>
	  <li className="nav-item">
		<a className="nav-link disabled" aria-disabled="true">Disabled</a>
	  </li>
	</ul>
	</div>
  );
};

export default Subnav;
