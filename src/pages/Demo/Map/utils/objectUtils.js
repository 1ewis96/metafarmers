import level1 from "../Levels/Level1.json";
import level2 from "../Levels/Level2.json";

export const loadLevel = async (levelName) => {
    try {
      const response = await fetch(`/Levels/${levelName}.json`);
      if (!response.ok) throw new Error(`Failed to load ${levelName}`);
      return await response.json();
    } catch (error) {
      console.error(`Error loading level ${levelName}, falling back to level1:`, error);
      const fallback = await fetch("/Levels/level1.json");
      return await fallback.json();
    }
  };