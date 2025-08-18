import type { FloatingText, Bag, Item, GameConfig } from "./types";
import basketSrc from "./assets/images/basket.png";

export class Game {
  floatingTexts: FloatingText[] = [];
  ctx: CanvasRenderingContext2D | null;
  canvas: HTMLCanvasElement;
  bag: Bag;
  items: Item[];
  score: number;
  timer: number;
  isPaused: boolean;
  gameOver: boolean;
  gameSpeed: number;
  spawnTimer: number;
  config: GameConfig;
  basketImage: HTMLImageElement;

  onUpdateState: (state: {
    score: number;
    timer: number;
    gameOver: boolean;
  }) => void;

  constructor(
    canvas: HTMLCanvasElement,
    config: GameConfig,
    onUpdateState: (state: {
      score: number;
      timer: number;
      gameOver: boolean;
    }) => void
  ) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.config = config; // Assign the config
    this.bag = {
      x: (this.canvas.width - this.config.bag.width) / 2, // center horizontally
      y: this.canvas.height - this.config.bag.initialYOffset,
      width: this.config.bag.width,
      height: this.config.bag.height,
      targetX: (this.canvas.width - this.config.bag.width) / 2, // also center target
    };
    this.items = [];
    this.score = 0;
    this.timer = 0;
    this.isPaused = false;
    this.gameOver = false;
    this.gameSpeed = this.config.gameSpeed.base;
    this.spawnTimer = 0;
    this.onUpdateState = onUpdateState;

    this.basketImage = new Image();
    this.basketImage.src = basketSrc; // make sure basketSrc is imported

    this.setupCanvas();
    this.resetGame();
  }

  spawnFloatingText(text: string, x: number, y: number) {
    this.floatingTexts.push({
      x,
      y,
      text,
      alpha: 1,
      lifetime: 1000, // ms
    });
  }

  setupCanvas() {
    this.canvas.width = document.body.offsetWidth;
    this.canvas.height = document.body.offsetHeight;

    // Recalculate bag position to keep it centered and on screen
    this.bag.x = Math.max(0, (this.canvas.width - this.bag.width) / 2);
    this.bag.y = this.canvas.height - this.config.bag.initialYOffset;

    // Additionally, you should also update the targetX to prevent unexpected movement
    this.bag.targetX = this.bag.x;
  }

  resetGame() {
    this.items = [];
    this.score = 0;
    this.timer = 0;
    this.isPaused = false;
    this.gameOver = false;
    this.gameSpeed = this.config.gameSpeed.base;
    this.spawnTimer = 0;
    this.onUpdateState({
      score: this.score,
      timer: this.timer,
      gameOver: this.gameOver,
    });
  }

  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw items
    this.items.forEach((item) => {
      this.ctx!.fillStyle = item.color;
      this.ctx!.fillRect(item.x, item.y, item.width, item.height);
      this.ctx!.fillStyle = "white";
      this.ctx!.fillText(
        item.type === "bomb" ? "bomb" : `+${item.value}`,
        item.x + item.width / 2,
        item.y + item.height / 2 + 5
      );
    });

    // Draw bag
    // this.ctx.fillStyle = "black";
    // this.ctx.fillRect(this.bag.x, this.bag.y, this.bag.width, this.bag.height);
    // this.ctx.fillStyle = "white";
    // this.ctx.textAlign = "center";
    // this.ctx.font = "14px Arial";
    // this.ctx.fillText(
    //   "bag",
    //   this.bag.x + this.bag.width / 2,
    //   this.bag.y + this.bag.height / 2 + 5
    // );
    if (this.basketImage.complete) {
      this.ctx.drawImage(
        this.basketImage,
        this.bag.x,
        this.bag.y,
        this.bag.width,
        this.bag.height
      );
    } else {
      // fallback rectangle
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(
        this.bag.x,
        this.bag.y,
        this.bag.width,
        this.bag.height
      );
    }

    this.floatingTexts.forEach((p) => {
      if (!this.ctx) return;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = "#000";
      this.ctx.font = "14px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(p.text, p.x, p.y);
      this.ctx.globalAlpha = 1;
    });
  }

  update(deltaTime: number) {
    if (this.isPaused || this.gameOver) return;

    const lerpFactor = 0.1; // 0.05–0.2 for speed tuning
    this.bag.x += (this.bag.targetX - this.bag.x) * lerpFactor;

    this.timer += deltaTime / 1000;
    this.gameSpeed =
      this.config.gameSpeed.base +
      this.timer / this.config.gameSpeed.accelerationFactor;

    // Update items position
    this.items.forEach((item) => {
      item.y += item.speed * this.gameSpeed * (deltaTime / 1000);
    });

    this.floatingTexts = this.floatingTexts.filter((p) => {
      p.y -= 30 * (deltaTime / 1000); // move upward
      p.alpha -= deltaTime / p.lifetime;
      return p.alpha > 0;
    });

    this.checkCollisions();
    this.spawnItems(deltaTime);
    this.removeOffScreenItems();
    this.onUpdateState({
      score: this.score,
      timer: this.timer,
      gameOver: this.gameOver,
    });
  }

  checkCollisions() {
    this.items = this.items.filter((item) => {
      const itemBottom = item.y + item.height;
      const bagTop = this.bag.y;

      const isTouchingBagTopExactly =
        itemBottom >= bagTop &&
        itemBottom - item.speed * this.gameSpeed * (1 / 60) < bagTop;

      const horizontalOverlap = Math.max(
        0,
        Math.min(item.x + item.width, this.bag.x + this.bag.width) -
          Math.max(item.x, this.bag.x)
      );
      const isMoreThanHalfInside = horizontalOverlap >= item.width / 2;

      // Handle scoring
      if (isTouchingBagTopExactly && isMoreThanHalfInside) {
        if (item.type === "bomb") {
          this.gameOver = true;
          return true; // KEEP bomb
        }
        this.score += item.value;

        // 🎯 Spawn popup at item center
        this.spawnFloatingText(
          `+${item.value}`,
          item.x + item.width / 2,
          item.y + item.height / 2
        );

        return false; // remove point items after scoring
      }

      // Deduct points if point item falls off-screen without being caught
      if (item.type === "point" && item.y > this.canvas.height + item.height) {
        console.log(item.deduct);
        this.score -= item.deduct ?? this.config.item.defaultDeduct;
        if (this.score < 0) this.score = 0; // prevent negative score
        return false; // remove item
      }

      // Keep bombs falling
      return true;
    });
  }

  spawnItems(deltaTime: number) {
    this.spawnTimer += deltaTime / 1000;
    // Spawn interval now uses the config
    const spawnInterval =
      1 / (this.gameSpeed * this.config.item.spawnIntervalFactor);

    if (this.spawnTimer > spawnInterval) {
      this.spawnTimer = 0;
      const rand = Math.random() * 100;
      let newItem: Item | null = null;
      const itemWidth = this.config.item.width;
      const itemHeight = this.config.item.height;
      const x = Math.random() * (this.canvas.width - itemWidth);

      let cumulativeChance = 0;
      // Iterate through the config items to determine which one to spawn
      for (const itemConfig of this.config.item.items) {
        cumulativeChance += itemConfig.spawnChance;
        if (rand < cumulativeChance) {
          newItem = {
            x,
            y: -itemHeight,
            width: itemWidth,
            height: itemHeight,
            type: itemConfig.type,
            value: itemConfig.value,
            color: itemConfig.color,
            speed: itemConfig.speed,
            deduct: itemConfig.deduct,
          };
          break;
        }
      }

      if (newItem) {
        this.items.push(newItem);
      }
    }
  }

  removeOffScreenItems() {
    this.items = this.items.filter(
      (item) =>
        item.type === "bomb" || item.y < this.canvas.height + item.height
    );
  }

  handleDrag(clientX: number) {
    const target = clientX - this.bag.width / 2;
    const clampedTarget = Math.max(
      0,
      Math.min(target, this.canvas.width - this.bag.width)
    );

    // Slight smoothing toward the target
    this.bag.x += (clampedTarget - this.bag.x) * 0.2; // smaller smoothing factor
    this.bag.targetX = clampedTarget; // keep target updated for consistency
  }
}
