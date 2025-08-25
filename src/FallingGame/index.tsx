import { useRef, useEffect, useState, useCallback } from "react";
import { Game } from "./game";
import { defaultConfig } from "./config";
import { motion, AnimatePresence } from "framer-motion";

import LoadingScreen from "./screens/LoaderScreen";
import StartGameScreen from "./screens/StartGameScreen";
import GameScreen from "./screens/GameScreen";
import GameOverScreen from "./screens/GameOverScreen";

import styles from "./styles.module.css";

import bgImgSrc from "./assets/images/background.webp";
import logoSrc from "./assets/images/logo.svg";
import playIconSrc from "./assets/images/play-btn-icon.svg";
import playAgainIconSrc from "./assets/images/play-again-icon.svg";

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);

  const sendPostMessage = (eventName: string, payload: any = null) => {
    window.postMessage({ event: eventName, payload: payload });
  };

  const handleUpdateState = useCallback(
    ({ score, gameOver }: { score: number; gameOver: boolean }) => {
      setScore(score);
      setGameOver(gameOver);
    },
    []
  );

  // Preload images and fonts before showing StartGameScreen
  useEffect(() => {
    let cancelled = false;

    // minimum loader time
    // const MIN_LOADER_MS = 500;
    // const sleep = (ms: number) =>
    //   new Promise<void>((resolve) => setTimeout(resolve, ms));

    const preloadImages = (urls: string[]) =>
      Promise.all(
        urls.map(
          (url) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = url;
            })
        )
      ).then(() => void 0);

    const preload = async () => {
      // minimum loader time
      // const startedAt = performance.now();

      const urls = new Set<string>();
      // UI assets
      urls.add(bgImgSrc);
      urls.add(logoSrc);
      urls.add(playIconSrc);
      urls.add(playAgainIconSrc);
      // Game assets from config
      urls.add(defaultConfig.basket.basketImage);
      defaultConfig.item.items.forEach((it) => urls.add(it.image));

      await preloadImages([...urls]);

      try {
        // Load commonly used font variants across multiple sizes
        const sizes = Array.from(new Set([14, 16, 20, 24, 30, 56])).map(
          (n) => `${n}px`
        );

        await Promise.all(
          sizes.flatMap((sz) => [
            document.fonts.load(`700 ${sz} 'Agdasima'`),
            document.fonts.load(`900 ${sz} 'Nunito'`),
            document.fonts.load(`600 ${sz} 'Nunito'`),
          ])
        );
        await document.fonts.ready;
      } catch {
        // ignore font load errors
      }

      // minimum loader time
      // const elapsed = performance.now() - startedAt;
      // const remain = Math.max(0, MIN_LOADER_MS - elapsed);
      // if (remain > 0) await sleep(remain);

      if (!cancelled) setAssetsLoaded(true);
    };

    preload();
    return () => {
      cancelled = true;
    };
  }, []);

  // Create/start the game whenever the canvas is mounted (started && !gameOver)
  useEffect(() => {
    if (!started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas, defaultConfig, handleUpdateState);
    gameRef.current = game;
    game.start();

    return () => {
      gameRef.current?.stop();
      gameRef.current = null;
    };
  }, [started, gameOver, handleUpdateState]);

  // When game over, ensure any running game is stopped and cleared
  useEffect(() => {
    if (gameOver) {
      sendPostMessage("GAME_OVER", score);
      gameRef.current?.stop();
      gameRef.current = null;
    }
  }, [gameOver, score]);

  const handleStartGame = useCallback(() => {
    setTimeout(() => {
      gameRef.current?.start();
      setGameOver(false);
      setStarted(true);
    }, 150);
  }, []);

  const handleCloseGame = useCallback(() => {
    setTimeout(() => {
      gameRef.current?.stop();
      setStarted(false);
      setGameOver(false);
    }, 150);
  }, []);

  const handleRestartGame = useCallback(() => {
    setTimeout(() => {
      gameRef.current?.reset();
      gameRef.current?.start();
      setGameOver(false);
      setStarted(true);
    }, 150);
  }, []);

  const handlePauseGame = useCallback(() => {
    gameRef.current?.pause();
  }, []);

  const handleResumeGame = useCallback(() => {
    gameRef.current?.resume();
  }, []);

  return (
    <div className={styles.scene}>
      {/* <div style={{ position: "absolute", zIndex: 5 }}>
        <button onClick={handlePauseGame}>pause</button>
        <button onClick={handleResumeGame}>resume</button>
        <button onClick={handleRestartGame}>restart</button>
        <button onClick={handleCloseGame}>stop</button>
        <button onClick={handleStartGame}>start</button>
      </div> */}
      <img
        src={defaultConfig.backgroundImage}
        alt=""
        className={styles.bgImage}
      />

      <AnimatePresence mode="wait">
        {started && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {(started || gameOver) && (
        <>
          <motion.img
            src={logoSrc}
            alt="Logo"
            className={styles.logo}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.div
            className={styles.scoreBox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          >
            <div className={styles.score}>{score}</div>
            <div className={styles.scoreLabel}>Points</div>
          </motion.div>
        </>
      )}

      {!assetsLoaded ? (
        <LoadingScreen />
      ) : !started ? (
        <StartGameScreen onStart={handleStartGame} />
      ) : gameOver ? (
        <GameOverScreen
          onRestart={handleRestartGame}
          onCloseGame={handleCloseGame}
        />
      ) : (
        <GameScreen canvasRef={canvasRef} />
      )}
    </div>
  );
};

export default Index;
