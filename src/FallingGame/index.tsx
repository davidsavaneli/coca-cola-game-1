import { useRef, useEffect, useState, useCallback } from "react";
import { Game } from "./game";
import { motion, AnimatePresence } from "framer-motion";

import LoadingScreen from "./screens/LoaderScreen";
import StartGameScreen from "./screens/StartGameScreen";
import GameScreen from "./screens/GameScreen";
import GameOverScreen from "./screens/GameOverScreen";

import styles from "./styles.module.css";

import logoSrc from "./assets/images/logo.svg";
import playIconSrc from "./assets/images/play-btn-icon.svg";
import playAgainIconSrc from "./assets/images/play-again-icon.svg";
import type { GameConfig } from "./types";

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [config, setConfig] = useState<GameConfig | null>(null);

  const CONFIG_URL =
    "https://cocacolaloyaltytest.azurewebsites.net/api/Game/config/df?Id=34";

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

  useEffect(() => {
    let cancelled = false;

    type ApiResponse = {
      isError: boolean;
      errorMessage: string | null;
      response: GameConfig;
    };

    const sanitizeConfig = (raw: GameConfig): GameConfig => ({
      ...raw,
      basket: { ...raw.basket },
      item: {
        ...raw.item,
        items: raw.item.items.map((it) => ({
          ...it,
          deduct: (it as any).deduct == null ? undefined : it.deduct,
        })),
      },
      gameSpeed: { ...raw.gameSpeed },
    });

    const preloadImages = (urls: string[]) =>
      Promise.all(
        urls.map(
          (url) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = url;
            })
        )
      ).then(() => void 0);

    const preload = async () => {
      let effectiveConfig: GameConfig | null = null;
      try {
        const res = await fetch(CONFIG_URL, { cache: "no-store" });
        if (res.ok) {
          const data: ApiResponse = await res.json();
          if (!data.isError && data.response) {
            effectiveConfig = sanitizeConfig(data.response);
            if (!cancelled) setConfig(effectiveConfig);
          }
        }
      } catch {
        // ignore fetch errors; without remote config we won't start the game
      }

      if (!effectiveConfig) {
        // Without remote config, keep showing the loader
        return;
      }

      const urls = new Set<string>();
      urls.add(logoSrc);
      urls.add(playIconSrc);
      urls.add(playAgainIconSrc);
      urls.add(effectiveConfig.backgroundImage);
      urls.add(effectiveConfig.basket.basketImage);
      effectiveConfig.item.items.forEach((it) => urls.add(it.image));

      await preloadImages([...urls]);

      try {
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

      if (!cancelled) setAssetsLoaded(true);
    };

    preload();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!config) return;

    const game = new Game(canvas, config, handleUpdateState);
    gameRef.current = game;
    game.start();

    return () => {
      gameRef.current?.stop();
      gameRef.current = null;
    };
  }, [started, gameOver, handleUpdateState, config]);

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

  // const handlePauseGame = useCallback(() => {
  //   gameRef.current?.pause();
  // }, []);

  // const handleResumeGame = useCallback(() => {
  //   gameRef.current?.resume();
  // }, []);

  return (
    <div className={styles.scene}>
      {config && (
        <img src={config.backgroundImage} alt="" className={styles.bgImage} />
      )}

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
