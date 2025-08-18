import type { GameConfig } from "./types";

export const defaultConfig: GameConfig = {
  bag: {
    width: 120,
    height: 70,
    initialYOffset: 100,
  },
  item: {
    width: 40,
    height: 40,
    spawnIntervalFactor: 0.8,
    defaultDeduct: 10,
    items: [
      { type: "bomb", value: 0, color: "red", speed: 100, spawnChance: 25 },
      {
        type: "point",
        value: 10,
        color: "blue",
        speed: 80,
        spawnChance: 40,
        deduct: 5,
      },
      {
        type: "point",
        value: 20,
        color: "green",
        speed: 120,
        spawnChance: 25,
        deduct: 10,
      },
      {
        type: "point",
        value: 30,
        color: "purple",
        speed: 150,
        spawnChance: 10,
        deduct: 15,
      },
    ],
  },
  gameSpeed: {
    base: 1,
    accelerationFactor: 10,
  },
};
