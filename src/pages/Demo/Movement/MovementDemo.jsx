import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import PixiCanvas from './PixiCanvas';
import SkinSelector from './SkinSelector';
import SpeedControls from './SpeedControls';
import CharacterState from './CharacterState';

const MovementDemo = () => {
  const [consoleLines, setConsoleLines] = useState([]);
  const [command, setCommand] = useState('');
  const [skins, setSkins] = useState([]);
  const [selectedSkin, setSelectedSkin] = useState('');
  const [characterState, setCharacterState] = useState({
    x: 0,
    y: 0,
    direction: 'right',
    isMoving: false,
    isSprinting: false,
  });
  const [speed, setSpeed] = useState({
    walk: 3,
    sprint: 6,
  });

  useEffect(() => {
    const fetchSkins = async () => {
      try {
        const res = await fetch('https://api.metafarmers.io/list/characters');
        const data = await res.json();
        if (data.skins && data.skins.length > 0) {
          setSkins(data.skins);
          setSelectedSkin(data.skins[0]);
        }
      } catch (error) {
        console.error('Failed to fetch skins:', error);
      }
    };
    fetchSkins();
  }, []);

  const handleCommandSubmit = () => {
    if (command.trim() === '') return;
    setConsoleLines((prev) => [...prev, `> ${command}`]);
    setCommand('');
  };

  return (
    <div className="position-relative w-100 vh-100 overflow-hidden">
      <PixiCanvas
        walkSpeed={speed.walk}
        sprintSpeed={speed.sprint}
        onStateChange={setCharacterState}
        skinId={selectedSkin}
      />
      <Container fluid className="position-absolute top-0 start-0 p-3" style={{ zIndex: 10 }}>
        <SkinSelector
          skins={skins}
          selectedSkin={selectedSkin}
          setSelectedSkin={setSelectedSkin}
        />
      </Container>
      <Container fluid className="position-absolute bottom-0 start-0 p-3" style={{ zIndex: 10 }}>
        <SpeedControls speed={speed} setSpeed={setSpeed} />
      </Container>
      <Container fluid className="position-absolute bottom-0 end-0 p-3" style={{ zIndex: 10 }}>
        <CharacterState characterState={characterState} />
      </Container>
    </div>
  );
};

export default MovementDemo;