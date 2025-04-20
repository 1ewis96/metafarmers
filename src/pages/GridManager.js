export class GridManager {
    constructor(gridSize, layers = ["objects"]) {
      this.gridSize = gridSize;
      this.layers = layers;
      this.grid = this.createEmptyGrid();
    }
  
    createEmptyGrid() {
      return Array.from({ length: this.gridSize }, () =>
        Array.from({ length: this.gridSize }, () => {
          const cell = {};
          this.layers.forEach((layer) => (cell[layer] = null));
          return cell;
        })
      );
    }
  
    inBounds(x, y) {
      return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }
  
    set(x, y, layer, object) {
      if (this.inBounds(x, y) && this.layers.includes(layer)) {
        this.grid[y][x][layer] = object;
      }
    }
  
    get(x, y, layer) {
      if (this.inBounds(x, y) && this.layers.includes(layer)) {
        return this.grid[y][x][layer];
      }
      return null;
    }
  
    remove(x, y, layer) {
      if (this.inBounds(x, y) && this.layers.includes(layer)) {
        this.grid[y][x][layer] = null;
      }
    }
  }
  