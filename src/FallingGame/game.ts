import type { FloatingText, Basket, Item, GameConfig } from "./types";

export class Game {
  // Rendering
  ctx: CanvasRenderingContext2D | null;
  canvas: HTMLCanvasElement;

  // Config & state
  config: GameConfig;
  basket: Basket;
  items: Item[] = [];
  floatingTexts: FloatingText[] = [];
  // Track caught item animations (drop + fade-out)
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
    this.canvas = canvas;
    // Hint the browser for lower-latency canvas swaps in WebView environments
    this.ctx = canvas.getContext("2d", {
      desynchronized: true,
    } as any) as CanvasRenderingContext2D | null;
    this.config = config;
    this.onUpdateState = onUpdateState;

    this.gameSpeed = this.config.gameSpeed.base;

    // Basket
    this.basket = {
      x: 0,
      y: 0,
      width: this.config.basket.width,
      height: this.config.basket.height,
      targetX: 0,
      basketImage: this.config.basket.basketImage,
    };

    // Images
    this.basketImage = this.getImage(this.basket.basketImage);

    // Prepare audio elements

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
    // Disable input immediately on game over
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
    this.lastTime = performance.now();
    const step = (t: number) => {
      if (this.isPaused || this.isGameOver) {
        this.rafId = null;
        return;
      }
      const dt = t - this.lastTime;
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
    const dpr = window.devicePixelRatio || 1;
    const width = document.body.offsetWidth;
    const height = document.body.offsetHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Prefer speed over quality to keep frames steady on mobile WebViews
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

    const dt = dtMs / 1000;
    // Smooth basket
    this.basket.x += (this.basket.targetX - this.basket.x) * 0.1;

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

    this.checkCollisions();

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

  checkCollisions() {
    this.items = this.items.filter((it) => {
      const itemBottom = it.y + it.height;
      const basketTop = this.basket.y;
      const isTouchingTop =
        itemBottom >= basketTop &&
        itemBottom - it.speed * this.gameSpeed * (1 / 60) < basketTop;

      const overlap = Math.max(
        0,
        Math.min(it.x + it.width, this.basket.x + this.basket.width) -
          Math.max(it.x, this.basket.x)
      );
      const halfInside = overlap >= it.width / 2;

      if (isTouchingTop && halfInside) {
        if (it.type === "bomb") {
          this.gameOver();
          return true; // keep bomb to render momentarily
        }
        // Score and visual feedback
        this.score += it.value;
        this.floatingTexts.push({
          x: it.x + it.width / 2,
          y: it.y + it.height / 2,
          text: `+${it.value}`,
          alpha: 1,
          lifetime: 1000,
        });
        // no catch sound

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
        return false; // remove collected item from active list
      }

      if (it.type === "point" && it.y > this.canvasCssHeight + it.height) {
        this.score = Math.max(
          0,
          this.score - (it.deduct ?? this.config.item.defaultDeduct)
        );
        // Emit a drop sound only once per miss
        sendPostMessage("DROP_ITEM_SOUND");
        return false;
      }

      return true;
    });
  }

  removeOffScreenItems() {
    this.items = this.items.filter(
      (it) => it.type === "bomb" || it.y < this.canvasCssHeight + it.height
    );
  }

  // Input -----------------------------------------------------
  handleDrag(x: number) {
    const target = Math.max(
      0,
      Math.min(
        x - this.basket.width / 2,
        this.canvasCssWidth - this.basket.width
      )
    );
    this.basket.x += (target - this.basket.x) * 0.2;
    this.basket.targetX = target;
  }

  // Easing helpers for animations
  private easeOutQuad(p: number) {
    return 1 - (1 - p) * (1 - p);
  }

  // Audio helpers --------------------------------------------
  // Audio removed: no-op stubs retained for clarity (none)

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
        ctx.drawImage(it.imageElement, it.x, it.y, dw, dh);
      }
    }

    // Caught item animations (drop + fade-out)
    for (const a of this.caughtAnims) {
      const img = a.imageElement;
      if (!img.complete) continue;
      const p = Math.min(1, a.t / a.duration);
      const alpha = 1 - p; // fade out
      const scale = 1 - 0.4 * this.easeOutQuad(p); // scale down from 1 -> ~0.6
      const lift = 25 * this.easeOutQuad(p); // progressive downward motion

      const ratio = img.width / img.height;
      const dw = a.width;
      const dh = dw / ratio;

      ctx.save();
      ctx.globalAlpha = alpha;
      // Translate to center, apply scale and progressive downward shift
      ctx.translate(a.x + dw / 2, a.y + dh / 2 + lift);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }

    // Basket
    if (this.basketImage.complete) {
      const ratio = this.basketImage.width / this.basketImage.height;
      const dw = this.basket.width;
      const dh = dw / ratio;
      ctx.drawImage(this.basketImage, this.basket.x, this.basket.y, dw, dh);
    }

    // Floating text
    for (const p of this.floatingTexts) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = "#6ACE7F";
      ctx.font = "700 16px 'Agdasima', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    }
  }
}

// Local helper to communicate with host/container
const sendPostMessage = (eventName: string, payload: any = null) => {
  window.postMessage({ event: eventName, payload });
};
