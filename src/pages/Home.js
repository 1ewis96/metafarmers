import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card, Button, ProgressBar, Badge } from "react-bootstrap";
import { motion } from "framer-motion";
import Particles from "@tsparticles/react";
import { tsParticles } from "@tsparticles/engine";
import Navigation from "./Navigation";
import useAuthCheck from "../hooks/auth/TokenValidation";
import "../styles/Home.css";

const Home = () => {
  const { isAuthenticated } = useAuthCheck();
  const [progress, setProgress] = useState({
    farming: 50,
    trading: 30,
    nfts: 20,
  });
  const [particlesLoaded, setParticlesLoaded] = useState(false);

  const particlesInit = async () => {
    try {
      await tsParticles.load("tsparticles", {
        fullScreen: false,
        particles: {
          number: { value: 60, density: { enable: true, value_area: 800 } },
          color: { value: ["#ff0080", "#00ffff", "#ffef00"] },
          shape: { type: "square" },
          opacity: { value: 0.6, random: true },
          size: { value: 3, random: true },
          move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: true,
            out_mode: "out",
          },
        },
        interactivity: {
          events: {
            onhover: { enable: true, mode: "repulse" },
            onclick: { enable: true, mode: "push" },
          },
          modes: {
            repulse: { distance: 120, duration: 0.4 },
            push: { particles_nb: 4 },
          },
        },
      });
      setParticlesLoaded(true);
    } catch (error) {
      console.error("Failed to load particles:", error);
      setParticlesLoaded(false);
    }
  };

  const handleStartFarming = () => {
    console.log("Starting MetaFarmers demo...");
  };

  const handleJoinCommunity = () => {
    console.log("Joining MetaFarmers community...");
  };

  return (
    <>
      <Navigation />
      {particlesLoaded && <Particles id="tsparticles" init={particlesInit} />} 
      <div className="home-wrapper">
        {/* Hero Section */}
        <Container fluid className="hero-section text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
          >
            <h1 className="display-4 fw-bold mb-3 neon-text">MetaFarmers: Crypto Farming Adventure</h1>
            <p className="lead mb-4">
              Build your decentralized farm, trade tokens, and collect NFTs in our immersive demo mode!
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Button variant="success" size="lg" onClick={handleStartFarming} className="px-5">
                {isAuthenticated ? "Play Now" : "Sign In to Play"}
              </Button>
              <Button variant="outline-light" size="lg" onClick={handleJoinCommunity} className="px-5">
                Join Community
              </Button>
            </div>
          </motion.div>
        </Container>

        {/* Game Preview Section - Now retro animated style */}
        <Container className="mt-5">
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                <Card className="bg-dark text-white shadow-lg p-4">
                  <Card.Body>
                    <h3 className="mb-4">Explore the MetaFarmers World</h3>
                    <div className="retro-preview">
                      <div className="glitch-img"></div>
                    </div>
                    <p className="mt-3">
                      Dive into a pixel-perfect world! Plant crops, manage resources, and interact with the blockchain-powered farm — Hotline Miami meets Habbo vibes.
                    </p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Container>

        {/* Features Section */}
        <Container className="mt-5">
          <h2 className="text-center mb-4">Why MetaFarmers?</h2>
          <Row>
            {[{ title: "Decentralized Farming", description: "Grow crops and earn tokens on the blockchain with full ownership.", badge: "Blockchain" },
              { title: "NFT Collectibles", description: "Collect unique farm assets as NFTs to trade or showcase.", badge: "NFTs" },
              { title: "Token Trading", description: "Trade in-game tokens in our marketplace to grow your farm.", badge: "Trading" }].map((feature, index) => (
              <Col md={4} key={index} className="mb-4">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * index + 1, duration: 0.8 }}
                >
                  <Card className="bg-dark text-white shadow-lg p-3 h-100">
                    <Card.Body>
                      <h5>{feature.title} <Badge bg="success">{feature.badge}</Badge></h5>
                      <p>{feature.description}</p>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>

        {/* Progress Tracker Section */}
        <Container className="mt-5">
          <h2 className="text-center mb-4">Demo Progress</h2>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 1 }}
              >
                <Card className="bg-dark text-white shadow-lg p-4">
                  <Card.Body>
                    <h4>Track Our Playground Milestones</h4>
                    <div className="mt-3">
                      <p>Farming Mechanics: {progress.farming}%</p>
                      <ProgressBar now={progress.farming} variant="success" />
                    </div>
                    <div className="mt-3">
                      <p>Trading System: {progress.trading}%</p>
                      <ProgressBar now={progress.trading} variant="success" />
                    </div>
                    <div className="mt-3">
                      <p>NFT Integration: {progress.nfts}%</p>
                      <ProgressBar now={progress.nfts} variant="success" />
                    </div>
                    <p className="mt-3">
                      MetaFarmers is in active development. Join the demo to help shape the future!
                    </p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Container>

        {/* Community Section */}
        <Container className="mt-5">
          <h2 className="text-center mb-4">Join Our Community</h2>
          <Row>
            {[{ platform: "Discord", url: "#", icon: "fab fa-discord" }, { platform: "Twitter", url: "#", icon: "fab fa-twitter" }, { platform: "Telegram", url: "#", icon: "fab fa-telegram" }].map((community, index) => (
              <Col md={4} key={index} className="mb-4">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * index + 2, duration: 0.8 }}
                >
                  <Card className="bg-dark text-white shadow-lg p-3 text-center h-100">
                    <Card.Body>
                      <i className={`${community.icon} fa-2x mb-3`}></i>
                      <h5>{community.platform}</h5>
                      <Button variant="outline-success" href={community.url} target="_blank" className="mt-2">
                        Join Now
                      </Button>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>

        {/* Footer */}
        <footer className="bg-dark text-white text-center py-4 mt-5">
          <Container>
            <p className="mb-0">
              © 2025 MetaFarmers. All rights reserved. <a href="/about" className="text-success">About</a> | <a href="/roadmap" className="text-success">Roadmap</a>
            </p>
          </Container>
        </footer>
      </div>
    </>
  );
};

export default Home;