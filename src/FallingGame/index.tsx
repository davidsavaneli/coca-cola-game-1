import { useRef, useEffect, useState, useCallback } from "react";
import type { RefObject } from "react";
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

  const handleStart = useCallback(() => {
    // Only start the game; do not start theme here
    setGameOver(false);
    setStarted(true);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const sound = soundRef.current;
      if (sound) {
        // Unlock audio and then apply mute state + theme playback
        sound.preload().then(() => {
          sound.setMuted(next);
          if (next) sound.stopTheme();
          else sound.playTheme();
        });
      }
      return next;
    });
  }, []);

  return (
    <div className={styles.scene}>
      <Controls gameRef={gameRef} />

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
          onStart={handleStart}
          muted={muted}
          onToggleMute={handleToggleMute}
          onHowToPlay={() => console.log("onHowToPlay")}
        />
      ) : gameOver ? (
        <GameOverScreen
          onRestart={() => {
            setGameOver(false);
            setStarted(true);
          }}
          onCloseGame={() => {
            setStarted(false);
            setGameOver(false);
            soundRef.current?.stopTheme();
            setMuted(true);
          }}
        />
      ) : (
        <GameScreen canvasRef={canvasRef} />
      )}
    </div>
  );
};

export default Index;

const Controls = ({ gameRef }: { gameRef: RefObject<Game | null> }) => {
  const get = () => gameRef.current;
  return (
    <div style={{ position: "absolute", zIndex: 5 }}>
      <button onClick={() => get()?.pause()}>pause</button>
      <button onClick={() => get()?.resume()}>resume</button>
      <button onClick={() => get()?.reset()}>reset</button>
      <button onClick={() => get()?.stop()}>stop</button>
      <button onClick={() => get()?.start()}>start</button>
    </div>
  );
};
