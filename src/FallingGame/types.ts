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
  image: string;
  imageElement?: HTMLImageElement;
  speed: number;
  deduct?: number;
}

export interface Bag {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  basketImage: string;
}

export interface GameConfig {
  bag: {
    width: number;
    height: number;
    initialYOffset: number;
    basketImage: string; // <--- added basket image path here
  };
  item: {
    width: number;
    height: number;
    spawnIntervalFactor: number;
    defaultDeduct: number;
    items: {
      type: "point" | "bomb";
      value: number;
      image: string;
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
