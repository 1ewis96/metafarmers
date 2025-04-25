import React from 'react';
import { Card, Form } from 'react-bootstrap';

const SkinSelector = ({ skins, selectedSkin, setSelectedSkin }) => {
  return (
    <Card className="bg-dark text-white" style={{ width: '200px' }}>
      <Card.Header>Select Skin</Card.Header>
      <Card.Body>
        <Form.Select
          value={selectedSkin}
          onChange={(e) => setSelectedSkin(e.target.value)}
        >
          {skins.map((skin) => (
            <option key={skin} value={skin}>
              {skin}
            </option>
          ))}
        </Form.Select>
      </Card.Body>
    </Card>
  );
};

export default SkinSelector;