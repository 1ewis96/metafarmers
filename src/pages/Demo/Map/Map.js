import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import Navigation from "../../Navigation";
import PixiMapDemo from "./PixiMapDemo";
import InfoBox from "./InfoBox";
import ContextMenu from "./ContextMenu";


const Map = () => {
  const [isBuildMode, setIsBuildMode] = useState(true);
  const [highlightedCell, setHighlightedCell] = useState(null);
  const [objects, setObjects] = useState([]);
  const [activeLayer, setActiveLayer] = useState("layer-1");
  const [availableLayers, setAvailableLayers] = useState(["layer-1"]);
  const [infoBoxContent, setInfoBoxContent] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, object: null });

  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const res = await fetch("https://api.metafarmers.io/list/layers");
        const data = await res.json();
        const layers = data.layers.map((l) => l.layer);
        setAvailableLayers(layers);
        if (layers.length > 0) setActiveLayer(layers[0]);
      } catch (err) {
        console.error("Failed to fetch layers:", err);
      }
    };

    fetchLayers();
  }, []);

  useEffect(() => {
    fetchLayerObjects(activeLayer);
  }, [activeLayer]);

  const fetchLayerObjects = async (layer) => {
    try {
      const res = await fetch("https://api.metafarmers.io/layer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layer }),
      });
      const response = await res.json();
      const objs = await Promise.all(
        response.data.map(async (obj) => {
          try {
            const res = await fetch(`https://api.metafarmers.io/object/${obj.object}`);
            const data = await res.json();
            return {
              position: { x: obj.x, y: obj.y },
              name: obj.object,
              compositeKey: obj.compositeKey,
              layer: obj.layer,
              spriteUrl: data.spriteSheet?.url || "",
              frameSize: data.spriteSheet?.frameSize || { width: 64, height: 64 },
              scale: data.render?.scale || 1,
              anchor: data.render?.anchor || { x: 0.5, y: 0.5 },
            };
          } catch (err) {
            console.error(`Failed to fetch sprite for ${obj.object}:`, err);
            return {
              position: { x: obj.x, y: obj.y },
              name: obj.object,
              compositeKey: obj.compositeKey,
              layer: obj.layer,
              spriteUrl: "",
              frameSize: { width: 64, height: 64 },
              scale: 1,
              anchor: { x: 0.5, y: 0.5 },
            };
          }
        })
      );
      setObjects(objs);
    } catch (err) {
      console.error("Failed to fetch objects for layer:", err);
    }
  };

  const handleCellClick = (x, y) => {
    setHighlightedCell({ x, y });
    const obj = objects.find((o) => o.position.x === x && o.position.y === y && o.layer === activeLayer);
    if (obj) {
      setInfoBoxContent(obj);
      setTimeout(() => setInfoBoxContent(null), 3000);
    }
  };

  const handleCellRightClick = (e, x, y) => {
    e.preventDefault();
    const obj = objects.find((o) => o.position.x === x && o.position.y === y && o.layer === activeLayer);
    if (obj) {
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, object: obj });
    }
  };

  return (
    <>
      <Navigation />
      <Container className="mt-4">
        <Row className="mb-2">
          <Col>
            <Form.Select value={activeLayer} onChange={(e) => setActiveLayer(e.target.value)}>
              {availableLayers.map((layer) => (
                <option key={layer} value={layer}>
                  {layer}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card style={{ height: "500px", overflow: "hidden" }}>
              <PixiMapDemo
                objects={objects}
                highlightedCell={highlightedCell}
                onCellClick={handleCellClick}
                onCellRightClick={handleCellRightClick}
                isBuildMode={isBuildMode}
                activeLayer={activeLayer}
                availableLayers={availableLayers}
              />
              <InfoBox visible={!!infoBoxContent} content={infoBoxContent} />
              <ContextMenu
                visible={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                object={contextMenu.object}
                onSelect={(option) => {
                  setInfoBoxContent(contextMenu.object);
                  setContextMenu({ ...contextMenu, visible: false });
                  setTimeout(() => setInfoBoxContent(null), 3000);
                }}
                onClose={() => setContextMenu({ ...contextMenu, visible: false })}
              />
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Map;