// src/pages/Home.js
import React from "react";
import { useAuth } from "react-oidc-context";
import { Container } from "react-bootstrap";
import Navigation from "../pages/Navigation";

import APIDocumentation from "../components/APIDocumentation"; // Import the API documentation component

const Home = () => {
  const auth = useAuth();

  return (
    <>
      <Navigation />
    <Container className="mt-4">
      {/* Show API documentation for all users */}
      <APIDocumentation />

  

      </Container>
    </>
  );
};

export default Home;
