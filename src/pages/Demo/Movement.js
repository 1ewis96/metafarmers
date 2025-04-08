import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import useAuthCheck from "../hooks/auth/TokenValidation"; // Assuming this hook checks for auth
import Navigation from "./Navigation";
import PixiMovementDemo from "./PixiMovementDemo";

const DemoMovement = () => {
    <>
      <Navigation />
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="p-4 text-center bg-dark text-white">
              <Card.Body>
                <Card.Body>
                <h1>Movement Demo</h1>
                <p>This is the Demo Movement Mechanics.</p>
                <PixiMovementDemo />
                </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
};

export default DemoMovement;