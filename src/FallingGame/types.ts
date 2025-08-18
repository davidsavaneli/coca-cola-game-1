export interface FloatingText {
  x: number;
  y: number;
  text: string;
  alpha: number;
  lifetime: number;
}

export interface Item {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "point" | "bomb";
  value: number;
  color: string;
  speed: number;
  deduct?: number;
}

export interface Bag {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
}

export interface GameConfig {
  bag: {
    width: number;
    height: number;
    initialYOffset: number;
  };
  item: {
    width: number;
    height: number;
    spawnIntervalFactor: number;
    defaultDeduct: number;
    items: {
      type: "point" | "bomb";
      value: number;
      color: string;
      speed: number;
      spawnChance: number;
      deduct?: number;
    }[];
  };
  gameSpeed: {
    base: number;
    accelerationFactor: number;
  };
}
