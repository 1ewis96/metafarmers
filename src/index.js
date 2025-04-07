import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from "react-oidc-context";

// Fetching values from environment variables
const cognitoAuthority = process.env.REACT_APP_COGNITO_AUTHORITY;
const cognitoClientID = process.env.REACT_APP_COGNITO_CLIENT_ID;
const signinReturnURL = process.env.REACT_APP_SIGNIN_RETURN_URL;
const logoutReturnURL = process.env.REACT_APP_LOGOUT_RETURN_URL;
const signupReturnURL = process.env.REACT_APP_SIGNUP_RETURN_URL;
const forgotPasswordReturnURL = process.env.REACT_APP_FORGOT_PASSWORD_RETURN_URL; 

// OIDC configuration for Cognito using the environment variables
const cognitoAuthConfig = {
  authority: cognitoAuthority,  // Use the environment variable for authority
  client_id: cognitoClientID,   // Use the environment variable for client ID
  redirect_uri: signinReturnURL,  // Use the environment variable for redirect URI
  response_type: "code",  // Authorization code flow
  scope: "email openid phone",  // Scopes to request
  post_logout_redirect_uri: logoutReturnURL,  // Use the environment variable for post logout redirect URI
};

const root = ReactDOM.createRoot(document.getElementById("root"));

// Wrap the app with the AuthProvider to handle authentication
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
