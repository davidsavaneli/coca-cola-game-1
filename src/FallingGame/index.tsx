/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useEffect, useState, useCallback } from "react";
import { Game } from "./game";
import { defaultConfig } from "./config";
import { SoundManager } from "./sound";

import LoadingScreen from "./screens/LoaderScreen";
import StartGameScreen from "./screens/StartGameScreen";
import GameScreen from "./screens/GameScreen";
import GameOverScreen from "./screens/GameOverScreen";

import styles from "./styles.module.css";

import bgImgSrc from "./assets/images/background.webp";
import logoSrc from "./assets/images/logo.svg";
import playIconSrc from "./assets/images/play-btn-icon.svg";
import soundOnIconSrc from "./assets/images/sound-on-icon.svg";
import soundOffIconSrc from "./assets/images/sound-off-icon.svg";
import playAgainIconSrc from "./assets/images/play-again-icon.svg";

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);
  const soundRef = useRef<SoundManager | null>(new SoundManager());

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);

  const sendPostMessage = (eventName: string, payload: any = null) => {
    window.postMessage({ event: eventName, payload: payload });
  };

  sendPostMessage("GET_SCORE", score);

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
    const MIN_LOADER_MS = 500;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

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
      const startedAt = performance.now();

      const urls = new Set<string>();
      // UI assets
      urls.add(bgImgSrc);
      urls.add(logoSrc);
      urls.add(playIconSrc);
      urls.add(soundOnIconSrc);
      urls.add(soundOffIconSrc);
      urls.add(playAgainIconSrc);
      // Game assets from config
      urls.add(defaultConfig.basket.basketImage);
      defaultConfig.item.items.forEach((it) => urls.add(it.image));

      await preloadImages([...urls]);

      // Warm up audio files (no playback yet)
      try {
        await soundRef.current?.warmup();
      } catch {
        // ignore
      }

      try {
        // Load commonly used font variants
        await Promise.all([
          document.fonts.load("700 16px 'Agdasima'"),
          document.fonts.load("900 30px 'Nunito'"),
        ]);
        await document.fonts.ready;
      } catch {
        // ignore font load errors
      }

      // minimum loader time
      const elapsed = performance.now() - startedAt;
      const remain = Math.max(0, MIN_LOADER_MS - elapsed);
      if (remain > 0) await sleep(remain);

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

    const game = new Game(
      canvas,
      defaultConfig,
      handleUpdateState,
      soundRef.current ?? undefined
    );
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
      console.log(score);
      gameRef.current?.stop();
      gameRef.current = null;
    }
  }, [gameOver, score]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const sound = soundRef.current;
      if (sound) {
        // Unlock audio on first toggle, then play/stop immediately
        sound.preload().then(() => {
          sound.setMuted(next);
          if (next) sound.stopTheme();
          else sound.playTheme();
        });
      }
      return next;
    });
  }, []);

  const handleStartGame = useCallback(() => {
    gameRef.current?.start();
    setGameOver(false);
    setStarted(true);
  }, []);

  const handleCloseGame = useCallback(() => {
    gameRef.current?.stop();
    setStarted(false);
    setGameOver(false);
    soundRef.current?.stopTheme();
    setMuted(true);
  }, []);

  const handleRestartGame = useCallback(() => {
    gameRef.current?.reset();
    gameRef.current?.start();
    setGameOver(false);
    setStarted(true);
  }, []);

  // const handlePauseGame = useCallback(() => {
  //   gameRef.current?.pause();
  // }, []);

  // const handleResumeGame = useCallback(() => {
  //   gameRef.current?.resume();
  // }, []);

  return (
    <div className={styles.scene}>
      {/* <div style={{ position: "absolute", zIndex: 5 }}>
        <button onClick={handlePauseGame}>pause</button>
        <button onClick={handleResumeGame}>resume</button>
        <button onClick={handleRestartGame}>restart</button>
        <button onClick={handleCloseGame}>stop</button>
        <button onClick={handleStartGame}>start</button>
      </div> */}

      {started && <div className={styles.backdrop}></div>}

      <img src={bgImgSrc} alt="" className={styles.bgImage} />

      {(started || gameOver) && (
        <>
          <img src={logoSrc} alt="Logo" className={styles.logo} />
          <div className={styles.scoreBox}>
            <div className={styles.score}>{score}</div>
            <div className={styles.scoreLabel}>Points</div>
          </div>
        </>
      )}

      {!assetsLoaded ? (
        <LoadingScreen />
      ) : !started ? (
        <StartGameScreen
          onStart={handleStartGame}
          muted={muted}
          onToggleMute={handleToggleMute}
          onHowToPlay={() => console.log("onHowToPlay")}
        />
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
