import React from "react";
import { ProgressBar } from "react-bootstrap";

const LoadingIndicator = ({ progress }) => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h3>Loading Sprites...</h3>
      <ProgressBar
        now={progress}
        label={`${progress}%`}
        animated
        striped
      />
    </div>
  );
};

export default LoadingIndicator;