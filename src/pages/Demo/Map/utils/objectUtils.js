import level1 from "../Levels/Level1.json";
import level2 from "../Levels/Level2.json";

export const loadLevel = async (levelName) => {
  const levels = {
    level1: level1,
    level2: level2,
  };
  return levels[levelName] || levels.level1;
};