import type { FloatingText, Bag, Item, GameConfig } from "./types";

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
  preloadedImages: Map<string, HTMLImageElement>;

  canvasCssWidth: number = 0;
  canvasCssHeight: number = 0;

  onUpdateState: (state: {
    score: number;
    timer: number;
    gameOver: boolean;
  }) => void;

  // Internal animation state
  private _rafId: number | null = null;
  private _lastTime = 0;
  private _resizeAttached = false;
  private _onResize = () => {
    this.setupCanvas();
    this.draw();
  };

  constructor(
    canvas: HTMLCanvasElement,
    config: GameConfig,
    onUpdateState: (state: {
      score: number;
      timer: number;
      gameOver: boolean;
    }) => void,
    preloadedImages: Map<string, HTMLImageElement> = new Map()
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.config = config;
    this.items = [];
    this.score = 0;
    this.timer = 0;
    this.isPaused = false;
    this.gameOver = false;
    this.gameSpeed = this.config.gameSpeed.base;
    this.spawnTimer = 0;
    this.onUpdateState = onUpdateState;
    this.preloadedImages = preloadedImages;

    // Bag setup
    this.bag = {
      x: 0,
      y: 0,
      width: this.config.bag.width,
      height: this.config.bag.height,
      targetX: 0,
      basketImage: this.config.bag.basketImage,
    };

    // Use preloaded basket image if available
    this.basketImage =
      this.preloadedImages.get(this.bag.basketImage) || new Image();
    if (!this.basketImage.src) this.basketImage.src = this.bag.basketImage;

    this.setupCanvas();
    this.resetGame();
  }

  // Start the internal animation loop
  start() {
    if (this._rafId != null) return; // already running
    this.isPaused = false;

    if (!this._resizeAttached) {
      window.addEventListener("resize", this._onResize);
      this._resizeAttached = true;
    }

    this._lastTime = performance.now();
    const step = (time: number) => {
      if (this.isPaused || this.gameOver) {
        this._rafId = null;
        return;
      }
      const delta = time - this._lastTime;
      this._lastTime = time;
      this.update(delta);
      this.draw();
      this._rafId = requestAnimationFrame(step);
    };
    this._rafId = requestAnimationFrame(step);
  }

  // Stop the loop completely
  stop() {
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._resizeAttached) {
      window.removeEventListener("resize", this._onResize);
      this._resizeAttached = false;
    }
  }

  // Pause without cancelling next frame
  pause() {
    this.isPaused = true;
  }

  // Resume the loop
  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.start();
  }

  spawnFloatingText(text: string, x: number, y: number) {
    this.floatingTexts.push({ x, y, text, alpha: 1, lifetime: 1000 });
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = document.body.offsetWidth;
    const height = document.body.offsetHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";

    if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.bag.x = (width - this.bag.width) / 2;
    this.bag.y = height - this.config.bag.initialYOffset;
    this.bag.targetX = this.bag.x;

    const oldHeight = this.canvasCssHeight || height;
    const heightRatio = height / oldHeight;

    this.items.forEach((item) => (item.y *= heightRatio));
    this.floatingTexts.forEach((p) => (p.y *= heightRatio));

    this.canvasCssWidth = width;
    this.canvasCssHeight = height;
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
    this.ctx.clearRect(0, 0, this.canvasCssWidth, this.canvasCssHeight);

    // Draw items
    this.items.forEach((item) => {
      if (item.imageElement && item.imageElement.complete) {
        const imgRatio = item.imageElement.width / item.imageElement.height;
        const drawWidth = item.width;
        const drawHeight = drawWidth / imgRatio;
        this.ctx!.drawImage(
          item.imageElement,
          item.x,
          item.y,
          drawWidth,
          drawHeight
        );
      } else {
        this.ctx!.fillStyle = item.type === "bomb" ? "red" : "gray";
        this.ctx!.fillRect(item.x, item.y, item.width, item.height);

        if (item.type === "point") {
          this.ctx!.fillStyle = "white";
          this.ctx!.textAlign = "center";
          this.ctx!.font = "14px Arial";
          this.ctx!.fillText(
            `+${item.value}`,
            item.x + item.width / 2,
            item.y + item.height / 2 + 5
          );
        }
      }
    });

    // Draw bag
    if (this.basketImage.complete) {
      const imgRatio = this.basketImage.width / this.basketImage.height;
      const drawWidth = this.bag.width;
      const drawHeight = drawWidth / imgRatio;
      this.ctx.drawImage(
        this.basketImage,
        this.bag.x,
        this.bag.y,
        drawWidth,
        drawHeight
      );
    } else {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(
        this.bag.x,
        this.bag.y,
        this.bag.width,
        this.bag.height
      );
    }

    // Draw floating texts
    this.floatingTexts.forEach((p) => {
      if (!this.ctx) return;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = "#6ACE7F";
      this.ctx.font = "700 16px 'Agdasima', sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.fillText(p.text, p.x, p.y);
      this.ctx.globalAlpha = 1;
    });
  }

  update(deltaTime: number) {
    if (this.isPaused || this.gameOver) return;

    const lerpFactor = 0.1;
    this.bag.x += (this.bag.targetX - this.bag.x) * lerpFactor;

    this.timer += deltaTime / 1000;
    this.gameSpeed =
      this.config.gameSpeed.base +
      this.timer / this.config.gameSpeed.accelerationFactor;

    this.items.forEach((item) => {
      item.y += item.speed * this.gameSpeed * (deltaTime / 1000);
    });

    this.floatingTexts = this.floatingTexts.filter((p) => {
      p.y -= 30 * (deltaTime / 1000);
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

      if (isTouchingBagTopExactly && isMoreThanHalfInside) {
        if (item.type === "bomb") {
          this.gameOver = true;
          return true;
        }
        this.score += item.value;
        this.spawnFloatingText(
          `+${item.value}`,
          item.x + item.width / 2,
          item.y + item.height / 2
        );
        return false;
      }

      if (
        item.type === "point" &&
        item.y > this.canvasCssHeight + item.height
      ) {
        this.score -= item.deduct ?? this.config.item.defaultDeduct;
        if (this.score < 0) this.score = 0;
        return false;
      }

      return true;
    });
  }

  spawnItems(deltaTime: number) {
    this.spawnTimer += deltaTime / 1000;
    const spawnInterval =
      1 / (this.gameSpeed * this.config.item.spawnIntervalFactor);

    if (this.spawnTimer > spawnInterval) {
      this.spawnTimer = 0;
      const rand = Math.random() * 100;
      let newItem: Item | null = null;
      const itemWidth = this.config.item.width;
      const itemHeight = this.config.item.height;
      const x = Math.random() * (this.canvasCssWidth - itemWidth);

      let cumulativeChance = 0;
      for (const itemConfig of this.config.item.items) {
        cumulativeChance += itemConfig.spawnChance;
        if (rand < cumulativeChance) {
          const img =
            this.preloadedImages.get(itemConfig.image!) || new Image();
          if (!img.src) img.src = itemConfig.image!;

          newItem = {
            x,
            y: -itemHeight,
            width: itemWidth,
            height: itemHeight,
            type: itemConfig.type,
            value: itemConfig.value,
            speed: itemConfig.speed,
            deduct: itemConfig.deduct,
            image: itemConfig.image,
            imageElement: img,
          };
          break;
        }
      }

      if (newItem) this.items.push(newItem);
    }
  }

  removeOffScreenItems() {
    this.items = this.items.filter(
      (item) =>
        item.type === "bomb" || item.y < this.canvasCssHeight + item.height
    );
  }

  handleDrag(clientX: number) {
    const target = clientX - this.bag.width / 2;
    const clampedTarget = Math.max(
      0,
      Math.min(target, this.canvasCssWidth - this.bag.width)
    );
    this.bag.x += (clampedTarget - this.bag.x) * 0.2;
    this.bag.targetX = clampedTarget;
  }
}
