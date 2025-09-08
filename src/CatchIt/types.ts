export interface FloatingText {
  x: number;
  y: number;
  text: string;
  alpha: number;
  lifetime: number;
}

export const ItemType = {
  Bomb: 1,
  Point: 2,
} as const;
export type ItemType = (typeof ItemType)[keyof typeof ItemType];

export interface Item {
  x: number;
  y: number;
  width: number;
  height: number;
  /** 1 = bomb, 2 = point */
  type: ItemType;
  value: number;
  image: string;
  imageElement?: HTMLImageElement;
  speed: number;
  deduct?: number;
}

export interface Basket {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  basketImage: string;
}

export interface GameConfig {
  backgroundImage: string;
  basket: {
    width: number;
    height: number;
    initialYOffset: number;
    basketImage: string;
  };
  item: {
    width: number;
    height: number;
    spawnIntervalFactor: number;
    defaultDeduct: number;
    items: {
  /** 1 = bomb, 2 = point */
  type: ItemType;
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
