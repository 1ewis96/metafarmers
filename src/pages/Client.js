import React, { useEffect } from 'react';
import Subnav from '../components/subnav'; // Ensure correct import path

const Client = () => {
  useEffect(() => {
    // Create a script element for the Unity loader
    const script = document.createElement('script');
    script.src = 'client/Build/metaFarmers.loader.js'; // Adjust the path to your loader script

    script.onload = () => {
      // Instantiate the Unity instance directly using the loader
      window.UnityLoader.instantiate('unityContainer', 'client/Build/metaFarmers.data');
    };

    // Append the script to the body
    document.body.appendChild(script);

    // Cleanup function to remove the script on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <Subnav />
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1>Client</h1>
        <p>Your Unity WebGL game will appear below:</p>
        <div id="unityContainer" style={{ width: '800px', height: '600px' }}></div>
      </div>
    </>
  );
};

export default Client;
