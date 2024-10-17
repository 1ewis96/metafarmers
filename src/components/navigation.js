// src/components/navigation.js
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const Navigation = () => {
  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Meta Farmers</Navbar.Brand> {/* Updated Link */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>  {/* Link to Home */}
            <Nav.Link as={Link} to="/features">Features</Nav.Link>  {/* Link to Features */}
            <Nav.Link as={Link} to="/pricing">Pricing</Nav.Link>  {/* Link to Pricing */}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
