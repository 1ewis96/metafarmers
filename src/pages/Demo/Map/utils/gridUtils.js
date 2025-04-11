import { Graphics, Container } from "pixi.js";

export const drawGrid = (container, size, cellSize, objects) => {
  container.removeChildren(); // Clear existing grid
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = new Graphics();
      cell.rect(x * cellSize, y * cellSize, cellSize, cellSize);
      cell.fill(objects.some(o => o.position.x === x && o.position.y === y && o.type === "wall") ? 0x666666 : 0xf0f0f0);
      
      // Add highlight if needed
      cell.eventMode = "static";
      cell.on("pointertap", () => {
        // This will be handled in Map.js for click events
      });
      
      container.addChild(cell);

      // Add object marker if present
      const object = objects.find(o => o.position.x === x && o.position.y === y);
      if (object) {
        const marker = new Graphics();
        marker.beginFill(0xff0000, 0.5); // Red circle for objects (placeholder)
        marker.drawCircle(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 5);
        marker.endFill();
        container.addChild(marker);
      }
    }
  }
};

export const drawHazardTape = (stage, isActive, width, height) => {
  if (stage.children.find(child => child.name === "hazardTape")) {
    stage.removeChild(stage.children.find(child => child.name === "hazardTape"));
  }

  if (isActive) {
    const tape = new Graphics();
    tape.name = "hazardTape";
    const stripeWidth = 10;
    
    // Draw top border
    for (let i = 0; i < width; i += stripeWidth * 2) {
      tape.beginFill(i % (stripeWidth * 2) < stripeWidth ? 0x000000 : 0xffff00); // Black and yellow
      tape.drawRect(i, 0, stripeWidth, stripeWidth);
      tape.endFill();
    }
    
    // Draw bottom border
    for (let i = 0; i < width; i += stripeWidth * 2) {
      tape.beginFill(i % (stripeWidth * 2) < stripeWidth ? 0x000000 : 0xffff00);
      tape.drawRect(i, height - stripeWidth, stripeWidth, stripeWidth);
      tape.endFill();
    }
    
    // Draw left border
    for (let i = 0; i < height; i += stripeWidth * 2) {
      tape.beginFill(i % (stripeWidth * 2) < stripeWidth ? 0x000000 : 0xffff00);
      tape.drawRect(0, i, stripeWidth, stripeWidth);
      tape.endFill();
    }
    
    // Draw right border
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