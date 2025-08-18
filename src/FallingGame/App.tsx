/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useEffect, useState, useCallback } from "react";
import { Game } from "./game";
import { defaultConfig } from "./config";
import StartGameScreen from "./screens/StartGameScreen";
import GameOverScreen from "./screens/GameOverScreen";
import LoadingScreen from "./screens/LoadingScreen";

import styles from "./styles.module.css";

import bgImgSrc from "./assets/images/background.webp";
import logoSrc from "./assets/images/logo.svg";

// Helper to preload images
const preloadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

// Helper to load a font
const loadFont = async (name: string, weight: string) => {
  await document.fonts.load(`${weight} 14px '${name}'`);
};

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());

  const handleUpdateState = useCallback(
    ({ score, gameOver }: { score: number; gameOver: boolean }) => {
      setScore(score);
      setGameOver(gameOver);
    },
    []
  );

  // Animate loop
  const animate = useCallback((time: number) => {
    if (
      !gameRef.current ||
      gameRef.current.isPaused ||
      gameRef.current.gameOver
    ) {
      animationFrameIdRef.current = null;
      return;
    }
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    gameRef.current.update(deltaTime);
    gameRef.current.draw();
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, []);

  // Preload all assets before showing game
  useEffect(() => {
    const loadAssets = async () => {
      const startTime = performance.now();
      try {
        await loadFont("Nunito", "900");

        const images = [
          bgImgSrc,
          defaultConfig.bag.basketImage,
          ...defaultConfig.item.items.map((i) => i.image),
        ];

        const map = new Map<string, HTMLImageElement>();
        await Promise.all(
          images.map(async (src) => {
            const img = await preloadImage(src);
            map.set(src, img);
          })
        );

        setPreloadedImages(map);

        const elapsed = performance.now() - startTime;
        if (elapsed < 200) {
          await new Promise((resolve) => setTimeout(resolve, 200 - elapsed));
        }

        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load assets", err);
      }
    };

    loadAssets();
  }, []);

  // Initialize game after start & assets loaded
  useEffect(() => {
    if (!hasStarted || !isLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    gameRef.current = new Game(
      canvas,
      defaultConfig,
      handleUpdateState,
      preloadedImages
    );
    lastTimeRef.current = performance.now();
    animationFrameIdRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      gameRef.current?.setupCanvas();
      gameRef.current?.draw();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameIdRef.current)
        cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [hasStarted, isLoaded, animate, handleUpdateState, preloadedImages]);

  const handleStart = () => {
    if (!isLoaded) return;
    setHasStarted(true);
  };

  // Pause / Resume handlers
  const handlePause = () => {
    if (!gameRef.current) return;
    gameRef.current.isPaused = true;
    setIsPaused(true);
  };

  const handleResume = () => {
    if (!gameRef.current) return;
    gameRef.current.isPaused = false;
    setIsPaused(false);
    lastTimeRef.current = performance.now();
    if (!animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  };

  // Basket drag & drop
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (
      !gameRef.current ||
      gameRef.current.isPaused ||
      gameRef.current.gameOver
    )
      return;

    const handleMouseMove = (event: MouseEvent) => {
      gameRef.current?.handleDrag(event.clientX);
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (
      !gameRef.current ||
      gameRef.current.isPaused ||
      gameRef.current.gameOver
    )
      return;
    if (e.touches.length !== 1) return;

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        gameRef.current?.handleDrag(event.touches[0].clientX);
      }
    };
    const handleTouchEnd = () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <div className={styles.scene}>
      {!isLoaded && <LoadingScreen />}
      {isLoaded && !hasStarted && (
        <StartGameScreen onStart={handleStart} isLoaded={isLoaded} />
      )}
      {hasStarted && (
        <>
          <img src={bgImgSrc} alt="" className={styles.bgImage} />
          <div className={styles.startGameBackdrop}></div>
          <img src={logoSrc} alt="Logo" className={styles.logo} />
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
          <div className={styles.scoreBox}>
            <div className={styles.score}>{score}</div>
            <div className={styles.scoreLabel}>Points</div>
          </div>
        </>
      )}
      {gameOver && (
        <GameOverScreen onRestart={() => window.location.reload()} />
      )}
    </div>
  );
};

export default App;
