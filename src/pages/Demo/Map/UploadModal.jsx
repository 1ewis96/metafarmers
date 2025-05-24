import React, { useState } from "react";
import DraggableWindow from "./DraggableWindow";

const UploadModal = ({ isOpen, onClose, type }) => {
  const [name, setName] = useState("");
  const [width, setWidth] = useState(64);
  const [height, setHeight] = useState(64);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setWidth(64);
      setHeight(64);
      setSelectedFile(null);
      setPreviewUrl(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !selectedFile) {
      alert("Please provide a name and select a file");
      return;
    }

    setLoading(true);

    // This is just a placeholder - the actual upload will be implemented later
    // when the API is available
    setTimeout(() => {
      alert(`Upload functionality will be implemented when the API is available.
      
Would upload:
- Type: ${type}
- Name: ${name}
- Width: ${width}px
- Height: ${height}px
- File: ${selectedFile.name}`);
      
      setLoading(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title={`Upload New ${type === "object" ? "Object" : "Tile"}`}
      onClose={onClose}
      initialPosition={{ x: window.innerWidth / 2 - 175, y: window.innerHeight / 2 - 200 }}
      initialWidth={350}
      initialHeight={450}
      zIndex={200}
    >
      <div style={{ padding: "15px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold"
              }}
            >
              Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${type} name`}
              style={{
                width: "100%",
                padding: "8px",
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px"
              }}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold"
                }}
              >
                Width (px):
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                min="1"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "4px"
                }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold"
                }}
              >
                Height (px):
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                min="1"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "4px"
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold"
              }}
            >
              Image File:
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              style={{
                width: "100%",
                padding: "8px",
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px"
              }}
              required
            />
          </div>

          {previewUrl && (
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <p style={{ marginBottom: "5px", fontWeight: "bold" }}>Preview:</p>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "150px",
                  border: "1px solid #555",
                  borderRadius: "4px"
                }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                background: loading ? "#555" : "#4a8",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                background: "#444",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DraggableWindow>
  );
};

export default UploadModal;
