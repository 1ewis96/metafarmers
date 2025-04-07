import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../../context/UserContext";
import LoadingScreen from "../../modules/Loading";
import ErrorScreen from "../../modules/Error";

const cognitoDomain = process.env.REACT_APP_COGNITO_URL;
const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID;
const redirectUri = process.env.REACT_APP_SIGNUP_RETURN_URL;

const CognitoCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { refreshUserData } = useUser();

  const exchangeCodeForToken = async (code) => {
    if (!cognitoDomain || !clientId || !redirectUri) {
      setErrorMessage("Configuration error: Missing Cognito settings.");
      setLoading(false);
      return;
    }

    const tokenEndpoint = `${cognitoDomain}/oauth2/token`;
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code: code,
      redirect_uri: redirectUri,
    });

    try {
      const response = await axios.post(tokenEndpoint, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { id_token, access_token, refresh_token } = response.data;
      const decodedIdToken = jwtDecode(id_token);
      const expiresAt = decodedIdToken.exp * 1000;

      localStorage.setItem("id_token", id_token);
      localStorage.setItem("access_token", access_token || "");
      localStorage.setItem("refresh_token", refresh_token || "");
      localStorage.setItem("expires_at", expiresAt.toString());

      const verifyResponse = await axios.post(
        "https://api.bittasker.xyz/cognito/auth",
        { id_token },
        { headers: { "Content-Type": "application/json" } }
      );

      if (verifyResponse.status === 200 && verifyResponse.data?.message === "User verified") {
        refreshUserData();
        navigate("/");
      } else {
        setErrorMessage("Authentication failed: Unexpected response from API.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthentication = () => {
    const urlParams = new URLSearchParams(location.search);
    const authCode = urlParams.get("code");

    if (authCode) {
      exchangeCodeForToken(authCode);
    } else {
      setErrorMessage("Authentication failed: No authorization code provided.");
      setLoading(false);
    }
  };

  // Call handleAuthentication once the component is mounted
  React.useEffect(() => {
    handleAuthentication(); // eslint-disable-next-line
  }, []);

  if (loading) return <LoadingScreen />;
  if (errorMessage) return <ErrorScreen message={errorMessage} />;
  return <div>Creating session...</div>;
};

export default CognitoCallback;
