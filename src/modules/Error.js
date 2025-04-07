import React, { useState } from "react";
import { Card, Alert } from "react-bootstrap";

const ErrorScreen = ({ message }) => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Card className="text-center p-4 shadow-lg border-danger" style={{ width: "22rem" }}>
        <Card.Body>
          <Alert variant="danger">
            <Alert.Heading>Oh no! An error occurred</Alert.Heading>
            <p>{message}</p>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ErrorScreen;
