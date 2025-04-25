import React from 'react';
import { Card, Form } from 'react-bootstrap';

const SpeedControls = ({ speed, setSpeed }) => {
  return (
    <Card className="bg-dark text-white" style={{ width: '250px' }}>
      <Card.Header>Speed Controls</Card.Header>
      <Card.Body>
        <Form.Label>Walk Speed: {speed.walk}</Form.Label>
        <Form.Range
          min={1}
          max={10}
          value={speed.walk}
          onChange={(e) =>
            setSpeed((prev) => ({ ...prev, walk: parseInt(e.target.value) }))
          }
        />
        <Form.Label className="mt-3">Sprint Speed: {speed.sprint}</Form.Label>
        <Form.Range
          min={5}
          max={15}
          value={speed.sprint}
          onChange={(e) =>
            setSpeed((prev) => ({ ...prev, sprint: parseInt(e.target.value) }))
          }
        />
      </Card.Body>
    </Card>
  );
};

export default SpeedControls;