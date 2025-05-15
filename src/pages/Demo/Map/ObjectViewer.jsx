import React, { useState, useRef } from "react";
import { Container } from "react-bootstrap";
import LayerControls from "./LayerControls";
import AddObjectPanel from "./AddObjectPanel";
import AddTilePanel from "./AddTilePanel"; // Added import statement
import CellInfoPanel from "./CellInfoPanel";
import MainCanvas from "./MainCanvas";
import Minimap from "./Minimap";
import LoadingIndicator from "./LoadingIndicator";
import useTextureLoader from "./useTextureLoader";
import useTileLoader from "./useTileLoader";
import useTileLayerLoader from "./useTileLayerLoader";

const ObjectViewer = () => {
  const pixiContainer = useRef(null);
  const minimapContainer = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const textureCache = useRef({});
  const tileCache = useRef({});
  const placedSprites = useRef([]);
  const placedTiles = useRef([]);
  const [availableLayers, setAvailableLayers] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(null);
  const [layerDimensions, setLayerDimensions] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showAddTilePanel, setShowAddTilePanel] = useState(false); // Added state
  const [selectedCell, setSelectedCell] = useState(null);
  const [textureCanvases, setTextureCanvases] = useState({});
  const [tileCanvases, setTileCanvases] = useState({});
  const [spriteUpdateCounter, setSpriteUpdateCounter] = useState(0);
  const [gridBounds, setGridBounds] = useState({ width: 30, height: 30 }); // Default to 30x30

  const { fetchTexturesAndLayers } = useTextureLoader({
    setLoading,
    setLoadingProgress,
    setTexturesLoaded,
    textureCache,
    setAvailableLayers,
    setCurrentLayer,
    setLayerDimensions
  });

  const { fetchTiles } = useTileLoader({
    setLoading,
    setLoadingProgress,
    setTilesLoaded,
    tileCache
  });

  const { loadTileLayer, placeSingleTile } = useTileLayerLoader({
    app: null, // Will be set in MainCanvas
    tileCache,
    placedTiles,
    setSpriteUpdateCounter,
    currentLayer
  });

  return (
    <>
      <Container fluid style={{ padding: 0, margin: 0, width: "100%", maxWidth: "100%" }}>
        <LayerControls
          availableLayers={availableLayers}
          currentLayer={currentLayer}
          setCurrentLayer={setCurrentLayer}
          showAddPanel={showAddPanel}
          setShowAddPanel={setShowAddPanel}
          showAddTilePanel={showAddTilePanel}
          setShowAddTilePanel={setShowAddTilePanel}
        />
        {showAddPanel && (
          <AddObjectPanel
            textureCache={textureCache.current}
            textureCanvases={textureCanvases}
            onClose={() => setShowAddPanel(false)}
          />
        )}
        {showAddTilePanel && (
          <AddTilePanel 
            tileCache={tileCache.current} 
            tileCanvases={tileCanvases} 
            onClose={() => setShowAddTilePanel(false)}
          />
        )}
        {selectedCell && (
          <CellInfoPanel
            selectedCell={selectedCell}
            setSelectedCell={setSelectedCell}
            currentLayer={currentLayer}
            placedSprites={placedSprites}
            placedTiles={placedTiles}
            setSpriteUpdateCounter={setSpriteUpdateCounter}
          />
        )}
        <MainCanvas
          pixiContainer={pixiContainer}
          textureCache={textureCache}
          tileCache={tileCache}
          placedSprites={placedSprites}
          placedTiles={placedTiles}
          currentLayer={currentLayer}
          setSelectedCell={setSelectedCell}
          setTextureCanvases={setTextureCanvases}
          setTileCanvases={setTileCanvases}
          setSpriteUpdateCounter={setSpriteUpdateCounter}
          loading={loading}
          texturesLoaded={texturesLoaded}
          tilesLoaded={tilesLoaded}
          fetchTexturesAndLayers={fetchTexturesAndLayers}
          fetchTiles={fetchTiles}
          loadTileLayer={loadTileLayer}
          placeSingleTile={placeSingleTile}
          setGridBounds={setGridBounds}
          layerDimensions={layerDimensions}
          availableLayers={availableLayers}
        />
        {loading && <LoadingIndicator progress={loadingProgress} />}
      </Container>
      <Minimap
        minimapContainer={minimapContainer}
        mainAppRef={pixiContainer}
        placedSprites={placedSprites}
        placedTiles={placedTiles}
        spriteUpdateCounter={spriteUpdateCounter}
        loading={loading}
        currentLayer={currentLayer}
        gridBounds={gridBounds}
        layerDimensions={layerDimensions}
      />
    </>
  );
};

export default ObjectViewer;