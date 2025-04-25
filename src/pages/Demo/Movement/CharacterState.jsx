import React from 'react';
import { Card, ProgressBar } from 'react-bootstrap';

const CharacterState = ({ characterState }) => {
  return (
    <Card className="bg-dark text-white" style={{ width: '300px' }}>
      <Card.Header>Character State</Card.Header>
      <Card.Body>
        <ul className="list-unstyled mb-2">
          <li><strong>X:</strong> {characterState.x}</li>
          <li><strong>Y:</strong> {characterState.y}</li>
          <li><strong>Direction:</strong> {characterState.direction}</li>
          <li><strong>Moving:</strong> {characterState.isMoving ? 'Yes' : 'No'}</li>
          <li><strong>Sprinting:</strong> {characterState.isSprinting ? 'Yes' : 'No'}</li>
        </ul>
        <ProgressBar
          now={characterState.isSprinting ? 100 : characterState.isMoving ? 50 : 0}
          variant={characterState.isSprinting ? 'danger' : 'info'}
          label={characterState.isSprinting ? 'Sprinting' : characterState.isMoving ? 'Walking' : 'Idle'}
        />
      </Card.Body>
    </Card>
  );
};

export default CharacterState;