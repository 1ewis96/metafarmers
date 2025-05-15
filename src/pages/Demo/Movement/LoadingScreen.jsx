import React from 'react';

const LoadingScreen = ({ progress, message }) => {
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center" 
         style={{ 
           backgroundColor: 'rgba(0, 0, 0, 0.85)', 
           zIndex: 9999,
           backdropFilter: 'blur(5px)'
         }}>
      <div className="text-center">
        <h3 className="text-light mb-4">Loading Map</h3>
        <div className="progress mb-3" style={{ width: '300px', height: '20px' }}>
          <div 
            className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
            role="progressbar" 
            style={{ width: `${progress}%` }} 
            aria-valuenow={progress} 
            aria-valuemin="0" 
            aria-valuemax="100">
            {progress}%
          </div>
        </div>
        <p className="text-light">{message || 'Please wait while we load the map assets...'}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
