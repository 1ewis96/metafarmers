import React, { useState } from "react";
import { Spinner, ProgressBar, Card } from "react-bootstrap";

const LoadingScreen = () => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Card className="text-center p-4 shadow-lg" style={{ width: "22rem" }}>
        <Card.Body>
          <Spinner animation="border" variant="primary" />
          <Card.Title className="mt-3">Authenticating...</Card.Title>
          <Card.Text>Please wait while we log you in.</Card.Text>
          <ProgressBar animated now={75} className="mt-3" />
        </Card.Body>
      </Card>
    </div>
  );
};

export default LoadingScreen;
