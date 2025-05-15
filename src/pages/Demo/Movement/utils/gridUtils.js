import * as PIXI from 'pixi.js';
import { TILE_SIZE } from './apiConfig';

/**
 * Creates a grid container with grid graphics
 * @param {number} width - Width of the grid in tiles
 * @param {number} height - Height of the grid in tiles
 * @returns {PIXI.Container} - The grid container with grid graphics
 */
export const createGridContainer = (width, height) => {
  // Create a grid container that will hold both the grid graphics and map elements
  const gridContainer = new PIXI.Container();
  gridContainer.name = 'gridContainer';
  gridContainer.sortableChildren = true; // Enable z-index sorting
  
  // Center the grid container in the world container
  gridContainer.x = -(width * TILE_SIZE) / 2;
  gridContainer.y = -(height * TILE_SIZE) / 2;
  
  // Create the grid graphics
  const gridGraphics = new PIXI.Graphics();
  gridGraphics.name = 'gridGraphics';
  
  // Draw the background (white rectangle)
  gridGraphics.beginFill(0xf0f0f0);
  gridGraphics.drawRect(0, 0, width * TILE_SIZE, height * TILE_SIZE);
  gridGraphics.endFill();
  
  // Draw the grid lines
  gridGraphics.lineStyle(1, 0x444444, 1);
  
  // Vertical lines
  for (let i = 0; i <= width; i++) {
    gridGraphics.moveTo(i * TILE_SIZE, 0);
    gridGraphics.lineTo(i * TILE_SIZE, height * TILE_SIZE);
  }
  
  // Horizontal lines
  for (let i = 0; i <= height; i++) {
    gridGraphics.moveTo(0, i * TILE_SIZE);
    gridGraphics.lineTo(width * TILE_SIZE, i * TILE_SIZE);
  }
  
  // Add the grid graphics to the grid container with z-index 0
  gridGraphics.zIndex = 0;
  gridContainer.addChild(gridGraphics);
  
  console.log(`[Movement] Grid created: ${width}x${height} tiles (${width * TILE_SIZE}x${height * TILE_SIZE}px)`);
  
  return gridContainer;
};

/**
 * Calculate the appropriate scale for a sprite to fit within a grid cell
 * @param {Object} spriteData - The sprite data containing dimensions
 * @param {number} spriteWidth - The width of the sprite
 * @param {number} spriteHeight - The height of the sprite
 * @returns {number} - The appropriate scale factor
 */
export const calculateSpriteScale = (spriteData, spriteWidth, spriteHeight) => {
  // Use the full tile size - we want to fill the cell completely
  const maxCellSize = TILE_SIZE;
  
  // Calculate the maximum scale that would fit within a cell
  const maxScale = Math.min(maxCellSize / spriteWidth, maxCellSize / spriteHeight);
  
  // Use the provided scale if available, but cap it to prevent overflow
  const scale = spriteData.render?.scale ? Math.min(spriteData.render.scale, maxScale) : maxScale;
  
  return scale;
};
