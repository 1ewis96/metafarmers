import React, { useState, useRef, useCallback } from "react";
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
  const appRef = useRef(null); // Store reference to the PIXI app
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [assetsPlaced, setAssetsPlaced] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Map Resources...');
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
  const [objectPropertiesCache, setObjectPropertiesCache] = useState({});

  const { fetchTexturesAndLayers } = useTextureLoader({
    setLoading,
    setLoadingProgress,
    setTexturesLoaded,
    textureCache,
    setAvailableLayers,
    setCurrentLayer,
    setLayerDimensions
  });
  
  // Function to handle layer creation
  const handleLayerCreated = useCallback((layersData) => {
    if (layersData) {
      // Directly update layers from the data
      const layerNames = layersData.map(l => l.layer);
      setAvailableLayers(layerNames);
      setLayerDimensions(layersData);
      
      // Select the newly created layer (should be the last one)
      if (layerNames.length > 0) {
        setCurrentLayer(layerNames[layerNames.length - 1]);
      }
    } else {
      // Fallback to refetching if no data provided
      fetchTexturesAndLayers(pixiContainer.current?.app);
    }
  }, [fetchTexturesAndLayers, setAvailableLayers, setLayerDimensions, setCurrentLayer]);

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
          onLayerCreated={handleLayerCreated}
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
            objectPropertiesCache={objectPropertiesCache}
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
          setObjectPropertiesCache={setObjectPropertiesCache}
          setAssetsPlaced={setAssetsPlaced}
          setLoadingMessage={setLoadingMessage}
          setLoading={setLoading}
        />
        {loading && <LoadingIndicator progress={loadingProgress} message={loadingMessage} />}
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