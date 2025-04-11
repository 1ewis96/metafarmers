import React from "react";
import "./VisualKeyboard.css";

const Key = ({ label, active }) => (
  <div className={`vk-key ${active ? "active" : ""}`}>{label}</div>
);

const VisualKeyboard = ({ keysPressed }) => {
  return (
    <div className="visual-keyboard">
      <div className="vk-row">
        <Key label="W" active={keysPressed["w"]} />
      </div>
      <div className="vk-row">
        <Key label="A" active={keysPressed["a"]} />
        <Key label="S" active={keysPressed["s"]} />
        <Key label="D" active={keysPressed["d"]} />
      </div>
      <div className="vk-row">
        <Key label="↑" active={keysPressed["ArrowUp"]} />
        <Key label="←" active={keysPressed["ArrowLeft"]} />
        <Key label="↓" active={keysPressed["ArrowDown"]} />
        <Key label="→" active={keysPressed["ArrowRight"]} />
      </div>
      <div className="vk-row">
        <Key label="Shift" active={keysPressed["Shift"]} />
        <Key label="Space" active={keysPressed[" "] || false} />
      </div>
    </div>
  );
};

export default VisualKeyboard;
