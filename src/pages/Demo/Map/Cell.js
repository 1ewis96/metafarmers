import { Graphics } from "pixi.js";

export default class Cell {
  constructor({ x, y, type, object, isHighlighted, onClick, onRightClick }) {
    const cellSize = 30;
    this.graphics = new Graphics();

    // Draw cell base fill
    this.graphics.beginFill(type === "wall" ? 0x666666 : 0xf0f0f0);
    this.graphics.drawRect(x * cellSize, y * cellSize, cellSize, cellSize);
    this.graphics.endFill();

    // Highlight with yellow border if selected
    if (isHighlighted) {
      this.graphics.lineStyle(2, 0xffff00);
      this.graphics.drawRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }

    // Placeholder object render (red dot)
    if (object) {
      this.graphics.beginFill(0xff0000, 0.5);
      this.graphics.drawCircle(
        x * cellSize + cellSize / 2,
        y * cellSize + cellSize / 2,
        5
      );
      this.graphics.endFill();
    }

    // Interactivity
    this.graphics.eventMode = "static";
    this.graphics.on("pointertap", () => onClick?.(x, y));
    this.graphics.on("rightdown", (e) => onRightClick?.(e.data.originalEvent, x, y));
  }
}
