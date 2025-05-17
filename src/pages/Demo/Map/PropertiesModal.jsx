import React, { useState, useEffect } from "react";
import DraggableWindow from "./DraggableWindow";

const PropertiesModal = ({ 
  isOpen, 
  onClose, 
  selectedCell, 
  currentLayer,
  onApplyFunction 
}) => {
  const [availableFunctions, setAvailableFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState("");
  const [functionParams, setFunctionParams] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentObjectData, setCurrentObjectData] = useState(null);

  // Fetch available functions when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableFunctions();
      fetchCurrentObjectData();
    }
  }, [isOpen, selectedCell, currentLayer]);

  // Fetch available functions from the API
  const fetchAvailableFunctions = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.metafarmers.io/list/object/functions");
      const data = await response.json();
      
      if (data.data) {
        setAvailableFunctions(data.data);
      }
    } catch (error) {
      console.error("Error fetching available functions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current object data to see if it already has functions applied
  const fetchCurrentObjectData = async () => {
    if (!selectedCell || !currentLayer) return;
    
    setLoading(true);
    try {
      const response = await fetch("https://api.metafarmers.io/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layer: currentLayer }),
      });
      
      const data = await response.json();
      
      if (data.data) {
        // Find the current object in the layer data
        const objectData = data.data.find(obj => 
          obj.object === selectedCell.objectName && 
          obj.x === selectedCell.x && 
          obj.y === selectedCell.y
        );
        
        if (objectData) {
          setCurrentObjectData(objectData);
          
          // Detect which function is currently applied
          if (objectData.action?.type === "teleport") {
            setSelectedFunction("teleporter");
            setFunctionParams({
              activationType: objectData.activationType || "step_on",
              "action.type": "teleport",
              "action.destination.x": objectData.action.destination?.x || 0,
              "action.destination.y": objectData.action.destination?.y || 0,
              "action.destination.facing": objectData.action.destination?.facing || "down",
              "action.destination.layerId": objectData.action.destination?.layerId || ""
            });
          } else if (objectData.collision === true) {
            setSelectedFunction("collision");
            setFunctionParams({ collision: true });
          } else if (objectData.door === true) {
            setSelectedFunction("door");
            setFunctionParams({ door: true });
          } else {
            // No function applied
            setSelectedFunction("");
            setFunctionParams({});
          }
        }
      }
    } catch (error) {
      console.error("Error fetching current object data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle function selection
  const handleFunctionChange = (functionId) => {
    setSelectedFunction(functionId);
    
    // Reset parameters when changing function
    if (functionId === "") {
      setFunctionParams({});
      return;
    }
    
    // Initialize parameters with default values based on selected function
    const selectedFunctionData = availableFunctions.find(fn => fn.id === functionId);
    if (selectedFunctionData) {
      const defaultParams = {};
      
      // Create default values for each required field
      Object.entries(selectedFunctionData.requiredFields).forEach(([field, type]) => {
        if (type === "boolean") {
          defaultParams[field] = true;
        } else if (type === "number") {
          defaultParams[field] = 0;
        } else if (type === "string") {
          if (field === "action.type" && functionId === "teleporter") {
            defaultParams[field] = "teleport";
          } else if (field === "action.destination.facing") {
            defaultParams[field] = "down";
          } else if (field === "activationType") {
            defaultParams[field] = "step_on";
          } else {
            defaultParams[field] = "";
          }
        }
      });
      
      setFunctionParams(defaultParams);
    }
  };

  // Handle parameter changes
  const handleParamChange = (paramName, value) => {
    // Convert value to the appropriate type
    let typedValue = value;
    const selectedFunctionData = availableFunctions.find(fn => fn.id === selectedFunction);
    
    if (selectedFunctionData) {
      const paramType = Object.entries(selectedFunctionData.requiredFields)
        .find(([field]) => field === paramName)?.[1];
      
      if (paramType === "number") {
        typedValue = Number(value);
      } else if (paramType === "boolean") {
        typedValue = value === "true";
      }
    }
    
    setFunctionParams(prev => ({
      ...prev,
      [paramName]: typedValue
    }));
  };

  // Apply function to object
  const handleApply = async () => {
    if (!selectedCell || !currentLayer || !selectedFunction) return;
    
    const compositeKey = `${selectedCell.objectName}#${selectedCell.x}#${selectedCell.y}`;
    
    // Prepare updates object
    let updates = {};
    
    if (selectedFunction === "teleporter") {
      updates = {
        activationType: functionParams.activationType,
        action: {
          type: "teleport",
          destination: {
            x: functionParams["action.destination.x"],
            y: functionParams["action.destination.y"],
            facing: functionParams["action.destination.facing"],
            layerId: functionParams["action.destination.layerId"]
          }
        }
      };
    } else if (selectedFunction === "collision") {
      updates = {
        collision: true
      };
    } else if (selectedFunction === "door") {
      updates = {
        door: true
      };
    }
    
    try {
      const response = await fetch("https://api.metafarmers.io/objects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer: currentLayer,
          compositeKey,
          updates
        }),
      });
      
      const data = await response.json();
      
      if (data.message === "Update successful") {
        console.log("Function applied successfully:", data);
        onApplyFunction(selectedFunction, updates);
        onClose();
      } else {
        console.error("Error applying function:", data);
      }
    } catch (error) {
      console.error("Error applying function:", error);
    }
  };

  // Remove function from object
  const handleRemove = async () => {
    if (!selectedCell || !currentLayer || !selectedFunction) return;
    
    const compositeKey = `${selectedCell.objectName}#${selectedCell.x}#${selectedCell.y}`;
    
    // Prepare updates object to remove the function
    let updates = {};
    
    if (selectedFunction === "teleporter") {
      updates = {
        activationType: null,
        action: null
      };
    } else if (selectedFunction === "collision") {
      updates = {
        collision: null
      };
    } else if (selectedFunction === "door") {
      updates = {
        door: null
      };
    }
    
    try {
      const response = await fetch("https://api.metafarmers.io/objects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer: currentLayer,
          compositeKey,
          updates
        }),
      });
      
      const data = await response.json();
      
      if (data.message === "Update successful") {
        console.log("Function removed successfully:", data);
        setSelectedFunction("");
        setFunctionParams({});
        onApplyFunction(null, {});
        onClose();
      } else {
        console.error("Error removing function:", data);
      }
    } catch (error) {
      console.error("Error removing function:", error);
    }
  };

  // Render form fields based on selected function
  const renderFunctionFields = () => {
    if (!selectedFunction) return null;
    
    const selectedFunctionData = availableFunctions.find(fn => fn.id === selectedFunction);
    if (!selectedFunctionData) return null;
    
    return (
      <div style={{ marginTop: "15px" }}>
        {Object.entries(selectedFunctionData.requiredFields).map(([field, type]) => (
          <div key={field} style={{ marginBottom: "10px" }}>
            <label 
              style={{ 
                display: "block", 
                marginBottom: "5px",
                fontSize: "12px",
                fontWeight: "bold" 
              }}
            >
              {field}:
            </label>
            
            {type === "boolean" ? (
              <select
                value={functionParams[field]?.toString() || "true"}
                onChange={(e) => handleParamChange(field, e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "4px"
                }}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : type === "number" ? (
              <input
                type="number"
                value={functionParams[field] || 0}
                onChange={(e) => handleParamChange(field, e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "4px"
                }}
              />
            ) : (
              <input
                type="text"
                value={functionParams[field] || ""}
                onChange={(e) => handleParamChange(field, e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "4px"
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Object Properties"
      onClose={onClose}
      initialPosition={{ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 200 }}
      initialWidth={300}
      initialHeight={400}
      zIndex={200}
    >
      <div style={{ padding: "10px" }}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label 
                style={{ 
                  display: "block", 
                  marginBottom: "5px",
                  fontWeight: "bold" 
                }}
              >
                Function:
              </label>
              <select
                value={selectedFunction}
                onChange={(e) => handleFunctionChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "4px"
                }}
              >
                <option value="">Select a function</option>
                {availableFunctions.map(fn => (
                  <option key={fn.id} value={fn.id}>
                    {fn.id}
                  </option>
                ))}
              </select>
            </div>
            
            {renderFunctionFields()}
            
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleApply}
                disabled={!selectedFunction}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: selectedFunction ? "#4a8" : "#555",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: selectedFunction ? "pointer" : "not-allowed"
                }}
              >
                Apply
              </button>
              
              <button
                onClick={handleRemove}
                disabled={!selectedFunction}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: selectedFunction ? "#a55" : "#555",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: selectedFunction ? "pointer" : "not-allowed"
                }}
              >
                Remove
              </button>
              
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "#444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </DraggableWindow>
  );
};

export default PropertiesModal;
