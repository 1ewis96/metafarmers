import { useState, useEffect } from "react";
import axios from "axios";

// Helper function to decode the JWT token and extract its payload
const decodeJwt = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  
  return JSON.parse(jsonPayload);
};

// Function to refresh tokens using Cognito's refresh_token
const refreshTokens = async (refreshToken) => {
  const response = await axios.post("https://YOUR_COGNITO_DOMAIN/oauth2/token", null, {
    params: {
      grant_type: "refresh_token",
      client_id: "YOUR_COGNITO_CLIENT_ID", // Replace with your Cognito client ID
      refresh_token: refreshToken,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  
  return response.data; // This will contain the new id_token, access_token, etc.
};

const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      const idToken = localStorage.getItem("id_token");
      const refreshToken = localStorage.getItem("refresh_token");
      const expiresAt = localStorage.getItem("expires_at");

      // Check if the id_token exists and is not expired
      if (idToken && expiresAt) {
        const currentTime = Date.now();
        const expiryTime = parseInt(expiresAt, 10);

        if (currentTime < expiryTime) {
          // If the token is still valid, authenticate the user
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        // If the token is expired, attempt to refresh the tokens
        if (refreshToken) {
          try {
            const refreshedTokens = await refreshTokens(refreshToken);
            
            // Store the new tokens and expiry time in localStorage
            localStorage.setItem("id_token", refreshedTokens.id_token);
            localStorage.setItem("access_token", refreshedTokens.access_token);
            localStorage.setItem("refresh_token", refreshedTokens.refresh_token);
            localStorage.setItem("expires_at", (Date.now() + refreshedTokens.expires_in * 1000).toString()); // expires_in is in seconds

            setIsAuthenticated(true); // User is now authenticated
          } catch (error) {
            console.error("Token refresh failed:", error);
            setErrorMessage("Token refresh failed. Please log in again.");
            setIsAuthenticated(false);
          }
        } else {
          // If there's no refresh token, consider the user logged out
          setErrorMessage("No refresh token found. Please log in again.");
          setIsAuthenticated(false);
        }
      } else {
        // No id_token found, user is not authenticated
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  return { isAuthenticated, loading, errorMessage };
};

export default useAuthCheck;
