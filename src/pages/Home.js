import React from 'react';
import Subnav from './components/subnav';

const Home = () => {
  return (
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <h1>Home Page</h1>
      <p>Welcome to Meta Farmers!</p>
    </div>
	<Subnav />
  );
};

export default Home;
