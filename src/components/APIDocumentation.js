import React, { useEffect } from "react";
import SwaggerUI from "swagger-ui-dist";
import "swagger-ui-dist/swagger-ui.css";
import useAuthCheck from "../hooks/auth/TokenValidation"; // Assuming this hook checks for auth

const APIDocumentation = () => {
  const { isAuthenticated, loading } = useAuthCheck(); // Auth check and loading state

  useEffect(() => {
    if (loading) return; // Wait for loading to finish

    const ui = SwaggerUI.SwaggerUIBundle({
      dom_id: "#swagger-ui", // The element where Swagger UI will be rendered
      url: "https://cdn.bittasker.xyz/swagger.json", // Path to your Swagger JSON
      theme: "BaseLayout",
    });

    // If authenticated, set the Bearer token from localStorage
    if (isAuthenticated) {
      const token = localStorage.getItem("access_token"); // Get the token from localStorage
      if (token) {
        ui.authActions.authorize({
          BearerAuth: {
            name: "Authorization",
            schema: {
              type: "apiKey",
              in: "header",
              name: "Authorization",
              description: "Bearer token",
            },
            value: `Bearer ${token}`, // Set the Bearer token
          },
        });
      } else {
        console.log("No token found in localStorage.");
      }
    }
  }, [isAuthenticated, loading]); // Re-run effect when isAuthenticated or loading changes

  return <div id="swagger-ui" style={{ height: "100vh" }} />;
};

export default APIDocumentation;
