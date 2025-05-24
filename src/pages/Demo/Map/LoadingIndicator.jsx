import React, { useEffect, useState } from "react";
import { ProgressBar } from "react-bootstrap";

const LoadingIndicator = ({ progress, message }) => {
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState('');
  const [visible, setVisible] = useState(true);
  
  // Track loading steps to show history of operations
  useEffect(() => {
    if (message && message !== currentStep) {
      setLoadingSteps(prev => {
        // Keep only the last 5 steps to avoid clutter
        const newSteps = [...prev, message];
        if (newSteps.length > 5) {
          return newSteps.slice(newSteps.length - 5);
        }
        return newSteps;
      });
      setCurrentStep(message);
      
      // Ensure the loading indicator is visible when new messages come in
      setVisible(true);
    }
  }, [message, currentStep]);
  
  // If progress reaches 100%, start fading out the loading indicator
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1500); // Give some time to show the completion message
      
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Don't render anything if not visible
  if (!visible) return null;
  
  return (
    <div className="loading-overlay" style={{ opacity: progress >= 100 ? 0.9 : 1, transition: 'opacity 0.5s ease-out' }}>
      <div className="loading-content">
        <div className="loading-header">
          <h3>MetaFarmers Map Playground</h3>
          <div className="loading-spinner"></div>
        </div>
        
        <div className="current-operation">
          <h4>{message || 'Loading Map Resources...'}</h4>
          <ProgressBar
            now={progress}
            label={`${progress}%`}
            animated
            variant="success"
            style={{ height: '12px', borderRadius: '6px' }}
          />
        </div>
        
        <div className="loading-steps">
          <h5>Loading Process:</h5>
          <ul>
            {loadingSteps.map((step, index) => (
              <li key={index} className={step === message ? 'current' : ''}>
                {step === message ? '➤ ' : '✓ '}{step}
              </li>
            ))}
          </ul>
        </div>
        
        <p className="loading-status">
          {progress < 100 ? 'Please wait while map resources are loading...' : 'Finalizing map rendering...'}
        </p>
      </div>
      
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .loading-content {
          background-color: #1e1e1e;
          color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.5);
          width: 90%;
          max-width: 600px;
          text-align: left;
        }
        .loading-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #444;
        }
        .loading-header h3 {
          margin: 0;
          color: #4CAF50;
          font-weight: bold;
        }
        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(76, 175, 80, 0.3);
          border-radius: 50%;
          border-top-color: #4CAF50;
          animation: spin 1s linear infinite;
        }
        .current-operation {
          margin-bottom: 25px;
        }
        .current-operation h4 {
          margin-bottom: 10px;
          color: #e0e0e0;
        }
        .loading-steps {
          background-color: #2a2a2a;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          max-height: 200px;
          overflow-y: auto;
        }
        .loading-steps h5 {
          color: #4CAF50;
          margin-bottom: 10px;
        }
        .loading-steps ul {
          list-style-type: none;
          padding-left: 5px;
          margin: 0;
        }
        .loading-steps li {
          padding: 5px 0;
          color: #aaa;
          font-size: 14px;
        }
        .loading-steps li.current {
          color: #4CAF50;
          font-weight: bold;
        }
        .loading-status {
          margin-top: 15px;
          color: #888;
          font-size: 14px;
          text-align: center;
          font-style: italic;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingIndicator;