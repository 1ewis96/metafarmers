import React from "react";
import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Navigation from "./Navigation";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  const handleNavigateToMapPlayground = () => {
    navigate("/demo/map");
  };

  const handleNavigateToMovementDemo = () => {
    navigate("/demo/movement");
  };

  return (
    <>
      <Navigation />
      <div className="home-wrapper">
        <Container fluid className="demo-section text-center text-white py-5">
          <h1 className="display-4 fw-bold mb-5 neon-text">MetaFarmers Demo</h1>
          
          <div className="d-flex flex-column align-items-center gap-4">
            <Button 
              variant="success" 
              size="lg" 
              onClick={handleNavigateToMapPlayground} 
              className="demo-button px-5 py-3"
              style={{ minWidth: "300px" }}
            >
              Demo Map Playground
            </Button>
            
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleNavigateToMovementDemo} 
              className="demo-button px-5 py-3"
              style={{ minWidth: "300px" }}
            >
              Demo Movement
            </Button>
          </div>
        </Container>
      </div>
    </>
  );
};

export default Home;