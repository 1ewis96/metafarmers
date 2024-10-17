// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navigation from './components/Navigation';

const App = () => {
  return (
    <Router>
      <div>
        <Navigation />
        <Switch>
          <Route path="/" exact>
            <h1>Home Page</h1>
            <p>Welcome to the Home Page!</p>
          </Route>
          <Route path="/about">
            <h1>About Page</h1>
            <p>This is the About Page.</p>
          </Route>
          <Route path="/services">
            <h1>Services Page</h1>
            <p>Details about our Services.</p>
          </Route>
          <Route path="/contact">
            <h1>Contact Page</h1>
            <p>Get in touch through the Contact Page.</p>
          </Route>
        </Switch>
      </div>
    </Router>
  );
};

export default App;
