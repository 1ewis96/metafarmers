import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import useAuthCheck from "../hooks/auth/TokenValidation"; // Assuming this hook checks for auth
import Navigation from "./Navigation";


const Settings = () => {
  const { isAuthenticated, loading } = useAuthCheck(); // Auth check and loading state
  const [isLoading, setIsLoading] = useState(false);

  const generateApiKey = async () => {
    setIsLoading(true);
    // Logic to generate API Key
    console.log("Generating API Key...");
    setIsLoading(false);
  };

  const visitBittasker = () => {
    // Redirect to Bittasker account settings page
    window.location.href = "https://www.bittasker.com/account-settings";
  };

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <Container className="mt-4">
        {!isAuthenticated ? (
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="text-center bg-dark text-white shadow-lg p-4">
                <Card.Body>
                  <h4>You are not authenticated</h4>
                  <p>Please log in to access your settings.</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <>
            {/* Card for API Key Generation */}
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <Card className="text-center bg-light text-black shadow-lg p-4">
                  <Card.Body>
                    <h4>Generate Developer API Key</h4>
                    <p className="mb-3">Get your API key to integrate with our platform and build your app.</p>
                    <Button
                      variant="warning"
                      onClick={generateApiKey}
                      disabled={isLoading}
                      style={{ width: "100%", fontSize: "16px" }}
                    >
                      {isLoading ? "Generating..." : "Generate API Key"}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Card for Bittasker Account Settings */}
            <Row className="justify-content-center mt-4">
              <Col md={8} lg={6}>
                <Card className="text-center bg-light text-black shadow-lg p-4">
                  <Card.Body>
                    <h4>Manage Your Account Settings & Security</h4>
                    <p className="mb-3">Visit Bittasker to manage your account settings and security preferences.</p>
                    <Button
                      variant="warning"
                      onClick={visitBittasker}
                      style={{ width: "100%", fontSize: "16px" }}
                    >
                      Visit Bittasker
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>

    </>
  );
};

export default Settings;
