import { Graphics } from "pixi.js";

export const drawHazardTape = (stage, isActive, width, height) => {
  if (stage.children.find(child => child.name === "hazardTape")) {
    stage.removeChild(stage.children.find(child => child.name === "hazardTape"));
  }

  if (isActive) {
    const tape = new Graphics();
    tape.name = "hazardTape";
    const stripeWidth = 10;
    for (let i = 0; i < width; i += stripeWidth * 2) {
      tape.beginFill(i % (stripeWidth * 2) < stripeWidth ? 0x000000 : 0xffff00);
      tape.drawRect(i, 0, stripeWidth, stripeWidth);
      tape.endFill();
    }
    for (let i = 0; i < width; i += stripeWidth * 2) {
      tape.beginFill(i % (stripeWidth * 2) < stripeWidth ? 0x000000 : 0xffff00);
      tape.drawRect(i, height - stripeWidth, stripeWidth, stripeWidth);
      tape.endFill();
    }
    for (let i = 0; i < height; i += stripeWidth * 2) {
      tape.beginFill(i % (stripeWidth * 2) < stripeWidth ? 0x000000 : 0xffff00);
      tape.drawRect(0, i, stripeWidth, stripeWidth);
      tape.endFill();
    }
    for (let i = 0; i < height; i += stripeWidth * 2) {
      tape.beginFill(i % (stripeWidth * 2) < stripeWidth ? 0x000000 : 0xffff00);
      tape.drawRect(width - stripeWidth, i, stripeWidth, stripeWidth);
      tape.endFill();
    }
    stage.addChild(tape);
  }
};

export const handleDrag = (container, startX, startY, newX, newY, currentOffset, setOffset) => {
  const dx = newX - startX;
  const dy = newY - startY;
  container.x += dx;
  container.y += dy;
  setOffset({ x: currentOffset.x + dx, y: currentOffset.y + dy });
};