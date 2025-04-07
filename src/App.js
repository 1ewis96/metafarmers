import React from "react";
import { Container, Navbar, Card } from "react-bootstrap";

const posts = [
  { title: "First Blog Post", content: "This is my first blog post!" },
  { title: "Second Blog Post", content: "This is my second blog post!" },
];

function App() {
  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="#">My React Blog</Navbar.Brand>
        </Container>
      </Navbar>

      <Container className="mt-4">
        {posts.map((post, index) => (
          <Card key={index} className="mb-3">
            <Card.Body>
              <Card.Title>{post.title}</Card.Title>
              <Card.Text>{post.content}</Card.Text>
            </Card.Body>
          </Card>
        ))}
      </Container>
    </>
  );
}

export default App;
