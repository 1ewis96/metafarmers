import React, { useEffect } from 'react';
import Subnav from '../components/subnav'; // Ensure correct import path

const Client = () => {
  useEffect(() => {
    const canvas = document.getElementById('unity-canvas');
    
    // Banner display function (copied from the original HTML)
    function unityShowBanner(msg, type) {
      const warningBanner = document.getElementById('unity-warning');
      const div = document.createElement('div');
      div.innerHTML = msg;
      if (type === 'error') div.style = 'background: red; padding: 10px;';
      else if (type === 'warning') div.style = 'background: yellow; padding: 10px;';
      warningBanner.appendChild(div);
      
      if (type !== 'error') {
        setTimeout(() => {
          warningBanner.removeChild(div);
        }, 5000);
      }
    }

    const buildUrl = "client/Build"; // Adjust the path as necessary
    const loaderUrl = buildUrl + "/webgl_build.loader.js"; // Replace with actual loader name
    const config = {
      dataUrl: buildUrl + "/webgl_build.data.br",
      frameworkUrl: buildUrl + "/webgl_build.framework.js.br",
      codeUrl: buildUrl + "/webgl_build.wasm.br",
      streamingAssetsUrl: "StreamingAssets",
      companyName: "DefaultCompany",
      productName: "My project",
      productVersion: "1.0",
      showBanner: unityShowBanner,
    };

    // Load the Unity loader script
    const script = document.createElement('script');
    script.src = loaderUrl;
    script.onload = () => {
      createUnityInstance(canvas, config, (progress) => {
        const progressBar = document.getElementById('unity-progress-bar-full');
        if (progressBar) {
          progressBar.style.width = 100 * progress + "%";
        }
      }).then((unityInstance) => {
        document.getElementById('unity-loading-bar').style.display = "none";
        document.getElementById('unity-fullscreen-button').onclick = () => {
          unityInstance.SetFullscreen(1);
        };
      }).catch((message) => {
        alert(message);
      });
    };
    script.onerror = () => {
      console.error("Failed to load the Unity loader script.");
    };

    document.body.appendChild(script);

    // Cleanup function
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
        <div id="unity-container" className="unity-desktop">
          <canvas id="unity-canvas" width="960" height="600" tabIndex="-1"></canvas>
          <div id="unity-loading-bar">
            <div id="unity-logo"></div>
            <div id="unity-progress-bar-empty">
              <div id="unity-progress-bar-full"></div>
            </div>
          </div>
          <div id="unity-warning"></div>
          <div id="unity-footer">
            <div id="unity-logo-title-footer"></div>
            <div id="unity-fullscreen-button"></div>
            <div id="unity-build-title">My project</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Client;
