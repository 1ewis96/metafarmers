import { Graphics } from "pixi.js";

const Cell = ({ x, y, type, object, isHighlighted, onClick, onRightClick }) => {
  const cellSize = 30; // Define cellSize here
  const graphics = new Graphics();

  graphics.rect(x * cellSize, y * cellSize, cellSize, cellSize);
  graphics.fill(type === "wall" ? 0x666666 : 0xf0f0f0);

  if (isHighlighted) {
    graphics.lineStyle(2, 0xffff00);
    graphics.drawRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }

  if (object) {
    graphics.beginFill(0xff0000, 0.5);
    graphics.drawCircle(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 5);
    graphics.endFill();
  }

  graphics.eventMode = "static";
  graphics.on("pointertap", () => onClick(x, y));
  graphics.on("rightdown", (e) => onRightClick(e.data.originalEvent, x, y));

  return { graphics }; // Return graphics object with a property name
};

export default Cell;