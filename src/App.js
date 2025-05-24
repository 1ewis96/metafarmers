import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext'; // Import UserProvider

import Home from './pages/Home';
import Settings from './pages/Settings';
import DemoMovement from './pages/Demo/Movement/MovementDemo';
import ObjectViewer from './pages/Demo/Map/ObjectViewer';
import CognitoCallback from './hooks/auth/CognitoCallback';
import CognitoCallbackClear from './hooks/auth/CognitoCallbackClear';

import useAuthCheck from "./hooks/auth/TokenValidation";


function App() {
  return (
    <UserProvider> {/* Wrap your app with UserProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/demo/movement" element={<DemoMovement />} />
          <Route path="/demo/map" element={<ObjectViewer />} />
          <Route path="/auth/callback" element={<CognitoCallback />} />
          <Route path="/auth/callback/clear" element={<CognitoCallbackClear />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
