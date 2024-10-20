import React from 'react';
import Subnav from '../components/subnav'; // Ensure correct import path
const Login = () => {
  return (
	<>
	<Subnav />
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <h1>Login Page</h1>
      <p>
	  <form id="login">
	  <input type="text" id="username" placeholder="username" className="form-control"/>
	  <input type="password" id="password" placeholder="password" className="form-control"/>
	  <input type="submit" id="submit" value="login"/>
	  </form>
	  </p>
    </div>
	</>
  );
};

export default Login;
