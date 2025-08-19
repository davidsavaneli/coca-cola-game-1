import type { GameConfig } from "./types";

import bombSrc from "./assets/images/bomb.png";
import item1Src from "./assets/images/item-1.png";
import item2Src from "./assets/images/item-2.png";
import item3Src from "./assets/images/item-3.png";
import item4Src from "./assets/images/item-4.png";
import item5Src from "./assets/images/item-5.png";
import basketSrc from "./assets/images/basket.png";

export const defaultConfig: GameConfig = {
  basket: {
    width: 120,
    height: 70,
    initialYOffset: 100,
    basketImage: basketSrc, // <-- added basket image path here
  },
  item: {
    width: 60,
    height: 60,
    spawnIntervalFactor: 0.8,
    defaultDeduct: 10,
    items: [
      { type: "bomb", value: 0, image: bombSrc, speed: 110, spawnChance: 25 },
      {
        type: "point",
        value: 10,
        image: item1Src,
        speed: 80,
        spawnChance: 20,
        deduct: 5,
      },
      {
        type: "point",
        value: 20,
        image: item2Src,
        speed: 95,
        spawnChance: 15,
        deduct: 10,
      },
      {
        type: "point",
        value: 10,
        image: item3Src,
        speed: 85,
        spawnChance: 15,
        deduct: 5,
      },
      {
        type: "point",
        value: 20,
        image: item4Src,
        speed: 100,
        spawnChance: 15,
        deduct: 10,
      },
      {
        type: "point",
        value: 30,
        image: item5Src,
        speed: 120,
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
