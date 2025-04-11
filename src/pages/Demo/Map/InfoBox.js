import React from "react";
import { Card } from "react-bootstrap";

const InfoBox = ({ visible, content }) => {
  if (!visible || !content) return null;

  return (
    <Card className="position-absolute bottom-0 end-0 m-3 bg-dark text-white" style={{ maxWidth: "300px" }}>
      <Card.Body>
        <pre>{JSON.stringify(content, null, 2)}</pre>
      </Card.Body>
    </Card>
  );
};

export default InfoBox;