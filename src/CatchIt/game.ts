import type { FloatingText, Basket, Item, GameConfig } from "./types";
import { ItemType } from "./types";
import { sendPostMessage } from "./helpers.ts";

export class Game {
  // Rendering
  ctx: CanvasRenderingContext2D | null;
  canvas: HTMLCanvasElement;

  // Config & state
  config: GameConfig;
  basket: Basket;
  items: Item[] = [];
  floatingTexts: FloatingText[] = [];
  private caughtAnims: {
    x: number;
    y: number;
    width: number;
    height: number;
    imageElement: HTMLImageElement;
    t: number; // elapsed ms
    duration: number; // total ms
  }[] = [];

  // Game state
  score = 0;
  timer = 0;
  isPaused = false;
  isGameOver = false;
  gameSpeed: number;
  spawnTimer = 0;

  // Sizing
  canvasCssWidth = 0;
  canvasCssHeight = 0;

  // External state sync
  onUpdateState: (state: {
    score: number;
    timer: number;
    gameOver: boolean;
  }) => void;

  // Loop
  rafId: number | null = null;
  lastTime = 0;

  // Images
  basketImage: HTMLImageElement;
  imgCache = new Map<string, HTMLImageElement>();

  // Handlers
  handleResize = () => {
    this.setupCanvas();
    this.draw();
  };

  handleTouchStart = (e: TouchEvent) => {
    if (this.isPaused || this.isGameOver || e.touches.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    this.handleDrag(e.touches[0].clientX - rect.left);
    e.preventDefault();
  };

  handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    this.handleDrag(e.touches[0].clientX - rect.left);
    e.preventDefault();
  };

  handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
  };

  constructor(
    canvas: HTMLCanvasElement,
    config: GameConfig,
    onUpdateState: (state: {
      score: number;
      timer: number;
      gameOver: boolean;
    }) => void
  ) {
    console.log("Creating game instance");
    this.canvas = canvas;
    // Try to get desynchronized context, fallback to normal if it fails
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      console.log("Creating game instance 1");
      const possibleCtx = canvas.getContext("2d", {
        desynchronized: true,
      } as any);
      if (possibleCtx && possibleCtx instanceof CanvasRenderingContext2D) {
        ctx = possibleCtx;
      }
    } catch (e) {
      console.log("Creating game instance 2");
      ctx = null;
    }
    if (!ctx) {
      console.log("Creating game instance 3");
      ctx = canvas.getContext("2d");
    }
    this.ctx = ctx;
    this.config = config;
    this.onUpdateState = onUpdateState;

    this.gameSpeed = this.config.gameSpeed.base;

    this.basket = {
      x: 0,
      y: 0,
      width: this.config.basket.width,
      height: this.config.basket.height,
      targetX: 0,
      basketImage: this.config.basket.basketImage,
    };

    this.basketImage = this.getImage(this.basket.basketImage);

    this.setupCanvas();
    this.reset();
  }

  // Public API -------------------------------------------------
  start() {
    if (this.rafId != null) return;
    this.isPaused = false;
    this.toggleListeners(true);
    this.handleResize();
    this.startLoop();
  }

  stop() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.toggleListeners(false);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (!this.isPaused || this.isGameOver) return;
    this.isPaused = false;
    this.startLoop();
  }

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.canvas.removeEventListener("touchstart", this.handleTouchStart);
    this.canvas.removeEventListener("touchmove", this.handleTouchMove);
    this.canvas.removeEventListener("touchend", this.handleTouchEnd);
    this.canvas.removeEventListener("touchcancel", this.handleTouchEnd);
    this.onUpdateState({
      score: this.score,
      timer: this.timer,
      gameOver: true,
    });
  }

  reset() {
    this.items = [];
    this.floatingTexts = [];
    this.caughtAnims = [];
    this.score = 0;
    this.timer = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameSpeed = this.config.gameSpeed.base;
    this.spawnTimer = 0;
    this.onUpdateState({
      score: this.score,
      timer: this.timer,
      gameOver: this.isGameOver,
    });
  }

  // Internals -------------------------------------------------
  private startLoop() {
    // Initialize lastTime here to prevent a large dt on the first frame
    this.lastTime = performance.now();
    const step = (t: number) => {
      if (this.isPaused || this.isGameOver) {
        this.rafId = null;
        return;
      }
      // --- CHANGE: Clamping dt to avoid physics bugs if the tab is inactive for a long time ---
      const dt = Math.min(100, t - this.lastTime); // Clamp at 100ms (10 FPS)
      this.lastTime = t;
      this.update(dt);
      this.draw();
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  private toggleListeners(add: boolean) {
    const opts: AddEventListenerOptions = { passive: false };
    if (add) {
      window.addEventListener("resize", this.handleResize);
      this.canvas.addEventListener("touchstart", this.handleTouchStart, opts);
      this.canvas.addEventListener("touchmove", this.handleTouchMove, opts);
      this.canvas.addEventListener("touchend", this.handleTouchEnd, opts);
      this.canvas.addEventListener("touchcancel", this.handleTouchEnd, opts);
    } else {
      window.removeEventListener("resize", this.handleResize);
      this.canvas.removeEventListener("touchstart", this.handleTouchStart);
      this.canvas.removeEventListener("touchmove", this.handleTouchMove);
      this.canvas.removeEventListener("touchend", this.handleTouchEnd);
      this.canvas.removeEventListener("touchcancel", this.handleTouchEnd);
    }
  }

  private getImage(src: string): HTMLImageElement {
    let img = this.imgCache.get(src);
    if (!img) {
      img = new Image();
      img.src = src;
      this.imgCache.set(src, img);
    }
    return img;
  }

  // Layout ----------------------------------------------------
  setupCanvas() {
    console.log("Setting up canvas");
    const dpr = window.devicePixelRatio || 1;
    const width = document.body.offsetWidth;
    const height = document.body.offsetHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = true;
      if ("imageSmoothingQuality" in this.ctx) {
        (this.ctx as any).imageSmoothingQuality = "low";
      }
    }

    this.basket.x = (width - this.basket.width) / 2;
    this.basket.y = height - this.config.basket.initialYOffset;
    this.basket.targetX = this.basket.x;

    const oldH = this.canvasCssHeight || height;
    const hRatio = height / oldH;
    this.items.forEach((it) => (it.y *= hRatio));
    this.floatingTexts.forEach((p) => (p.y *= hRatio));

    this.canvasCssWidth = width;
    this.canvasCssHeight = height;
  }

  // Update & mechanics ---------------------------------------
  update(dtMs: number) {
    if (this.isPaused || this.isGameOver) return;

    const dt = dtMs / 1000; // Convert delta time to seconds for physics calculations

    // --- FIX #1: Time-based basket movement for consistent feel on all refresh rates ---
    const smoothingFactor = 15; // Adjust this value for snappier/smoother movement
    this.basket.x +=
      (this.basket.targetX - this.basket.x) * smoothingFactor * dt;

    // Time & speed
    this.timer += dt;
    this.gameSpeed =
      this.config.gameSpeed.base +
      this.timer / this.config.gameSpeed.accelerationFactor;

    // Items
    this.items.forEach((it) => (it.y += it.speed * this.gameSpeed * dt));

    // Floating texts
    this.floatingTexts = this.floatingTexts.filter((p) => {
      p.y -= 30 * dt;
      p.alpha -= dtMs / p.lifetime;
      return p.alpha > 0;
    });

    this.checkCollisions(dt); // Pass dt to collision check

    // Advance caught item animations
    this.caughtAnims = this.caughtAnims.filter((a) => {
      a.t += dtMs;
      return a.t < a.duration;
    });

    this.spawnItems(dtMs);
    this.removeOffScreenItems();

    this.onUpdateState({
      score: this.score,
      timer: this.timer,
      gameOver: this.isGameOver,
    });
  }

  spawnItems(dtMs: number) {
    this.spawnTimer += dtMs / 1000;
    const spawnInterval =
      1 / (this.gameSpeed * this.config.item.spawnIntervalFactor);
    if (this.spawnTimer <= spawnInterval) return;

    this.spawnTimer = 0;
    const rand = Math.random() * 100;
    const w = this.config.item.width;
    const h = this.config.item.height;
    const x = Math.random() * (this.canvasCssWidth - w);

    let cum = 0;
    for (const cfg of this.config.item.items) {
      cum += cfg.spawnChance;
      if (rand < cum) {
        const img = this.getImage(cfg.image);
        this.items.push({
          x,
          y: -h,
          width: w,
          height: h,
          type: cfg.type,
          value: cfg.value,
          speed: cfg.speed,
          deduct: cfg.deduct,
          image: cfg.image,
          imageElement: img,
        });
        break;
      }
    }
  }

  checkCollisions(dt: number) {
    // Receive dt as an argument
    // --- FIX #3: More efficient array removal using a reverse loop and splice ---
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const itemBottom = it.y + it.height;
      const basketTop = this.basket.y;

      // --- FIX #2: Time-based collision check to prevent "tunneling" on low FPS ---
      const itemPreviousBottom = itemBottom - it.speed * this.gameSpeed * dt;
      const isTouchingTop =
        itemBottom >= basketTop && itemPreviousBottom < basketTop;

      const overlap = Math.max(
        0,
        Math.min(it.x + it.width, this.basket.x + this.basket.width) -
          Math.max(it.x, this.basket.x)
      );
      const halfInside = overlap >= it.width / 2;

      if (isTouchingTop && halfInside) {
        if (it.type === ItemType.Bomb) {
          this.gameOver();
          continue; // Keep bomb to render momentarily
        }

        this.score += it.value;
        this.floatingTexts.push({
          x: it.x + it.width / 2,
          y: it.y + it.height / 2,
          text: `+${it.value}`,
          alpha: 1,
          lifetime: 1000,
        });

        sendPostMessage("CATCH_ITEM_SOUND");

        if (it.imageElement) {
          this.caughtAnims.push({
            x: it.x,
            y: it.y,
            width: it.width,
            height: it.height,
            imageElement: it.imageElement,
            t: 0,
            duration: 200, // ms
          });
        }
        this.items.splice(i, 1); // Remove collected item
        continue;
      }

      if (it.type === ItemType.Point && it.y > this.canvasCssHeight) {
        this.score = Math.max(
          0,
          this.score - (it.deduct ?? this.config.item.defaultDeduct)
        );
        this.items.splice(i, 1); // Remove missed item
      }
    }
  }

  removeOffScreenItems() {
    // --- FIX #3: More efficient array removal ---
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (
        it.type !== ItemType.Bomb &&
        it.y > this.canvasCssHeight + it.height
      ) {
        this.items.splice(i, 1);
      }
    }
  }

  // Input -----------------------------------------------------
  handleDrag(x: number) {
    // --- FIX #1: handleDrag now only sets the target, update() handles the movement ---
    this.basket.targetX = Math.max(
      0,
      Math.min(
        x - this.basket.width / 2,
        this.canvasCssWidth - this.basket.width
      )
    );
  }

  // Easing helpers for animations
  private easeOutQuad(p: number) {
    return 1 - (1 - p) * (1 - p);
  }

  // Rendering -------------------------------------------------
  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvasCssWidth, this.canvasCssHeight);

    // Items (active falling)
    for (const it of this.items) {
      if (it.imageElement && it.imageElement.complete) {
        const ratio = it.imageElement.width / it.imageElement.height;
        const dw = it.width;
        const dh = dw / ratio;
        // --- OPTIMIZATION: Use integer coordinates for faster rendering ---
        ctx.drawImage(it.imageElement, it.x | 0, it.y | 0, dw, dh);
      }
    }

    // Caught item animations
    for (const a of this.caughtAnims) {
      const img = a.imageElement;
      if (!img.complete) continue;
      const p = Math.min(1, a.t / a.duration);
      const alpha = 1 - p;
      const scale = 1 - 0.4 * this.easeOutQuad(p);
      const lift = 25 * this.easeOutQuad(p);

      const ratio = img.width / img.height;
      const dw = a.width;
      const dh = dw / ratio;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate((a.x + dw / 2) | 0, (a.y + dh / 2 + lift) | 0);
      ctx.scale(scale, scale);
      ctx.drawImage(img, (-dw / 2) | 0, (-dh / 2) | 0, dw, dh);
      ctx.restore();
    }

    // Basket
    if (this.basketImage.complete) {
      const ratio = this.basketImage.width / this.basketImage.height;
      const dw = this.basket.width;
      const dh = dw / ratio;
      ctx.drawImage(
        this.basketImage,
        this.basket.x | 0,
        this.basket.y | 0,
        dw,
        dh
      );
    }

    // Floating text
    ctx.save();
    ctx.fillStyle = "#6ACE7F";
    ctx.font = "700 16px 'Agdasima', sans-serif";
    ctx.textAlign = "center";
    for (const p of this.floatingTexts) {
      ctx.globalAlpha = p.alpha;
      ctx.fillText(p.text, p.x | 0, p.y | 0);
    }
    ctx.restore();
  }
}
