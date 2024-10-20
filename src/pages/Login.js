import React, { useState } from 'react';
import Subnav from '../components/subnav';
import Cookies from 'js-cookie'; // Make sure to install this package using npm or yarn

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setError(''); // Clear any previous errors

    try {
      const response = await fetch('https://f1bin6vjd7.execute-api.eu-north-1.amazonaws.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Successful response
        Cookies.set('sessionKey', data.sessionKey, { expires: 7 }); // Set cookie for 7 days
        alert('Login successful!'); // Optionally inform the user
        // Redirect or perform other actions here
      } else {
        // Handle errors, e.g. invalid credentials
        setError('Login failed. Please check your username and password.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again later.');
    }
  };

  return (
    <>
      <Subnav />
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1>Login Page</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        <form id="login" onSubmit={handleSubmit}>
          <input
            type="text"
            id="username"
            placeholder="username"
            className="form-control"
			name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            id="password"
            placeholder="password"
            className="form-control"
			name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input type="submit" id="submit" value="login" className="btn btn-primary" />
        </form>
      </div>
    </>
  );
};

export default Login;
