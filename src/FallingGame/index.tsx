import { useRef, useEffect, useState, useCallback } from "react";
import { Game } from "./game";
import { motion, AnimatePresence } from "framer-motion";
import CryptoJS from "crypto-js";

import LoadingScreen from "./screens/LoaderScreen";
import StartGameScreen from "./screens/StartGameScreen";
import GameScreen from "./screens/GameScreen";
import GameOverScreen from "./screens/GameOverScreen";

import styles from "./styles.module.css";

import logoSrc from "./assets/images/logo.svg";
import playIconSrc from "./assets/images/play-btn-icon.svg";
import playAgainIconSrc from "./assets/images/play-again-icon.svg";
import type { GameConfig } from "./types";
import gameOverSoundUrl from "./assets/sounds/game_over.mp3";
import gameThemeSoundUrl from "./assets/sounds/game_theme_sound.mp3";
import catchSoundUrl from "./assets/sounds/catch_sound.mp3";

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);
  const themeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState<boolean>(true);
  const catchAudioPoolRef = useRef<HTMLAudioElement[]>([]);
  const catchAudioIndexRef = useRef<number>(0);

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [tries, setTries] = useState<number>(() => {
    const raw = localStorage.getItem("tryCount");
    return raw ? parseInt(raw, 10) || 0 : 0;
  });

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
        if (!res.ok) {
          sendPostMessage("CONFIG_ERROR");
          return;
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

  // Prepare theme audio element once
  useEffect(() => {
    if (!themeAudioRef.current) {
      const a = new Audio(gameThemeSoundUrl);
      a.preload = "auto";
      a.loop = true;
      a.volume = 0.6;
      themeAudioRef.current = a;
    }
    // Prepare catch sound pool once
    if (catchAudioPoolRef.current.length === 0) {
      const poolSize = 4;
      for (let i = 0; i < poolSize; i++) {
        const a = new Audio(catchSoundUrl);
        a.preload = "auto";
        a.volume = 0.6;
        catchAudioPoolRef.current.push(a);
      }
    }
    return () => {
      if (themeAudioRef.current) {
        themeAudioRef.current.pause();
        themeAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Listen for in-game messages (e.g., CATCH_ITEM_SOUND)
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const evt = e?.data?.event;
      if (evt === "CATCH_ITEM_SOUND") {
        if (muted) return;
        const pool = catchAudioPoolRef.current;
        if (!pool.length) return;
        const i = catchAudioIndexRef.current;
        catchAudioIndexRef.current = (i + 1) % pool.length;
        const a = pool[i];
        try {
          a.currentTime = 0;
          void a.play();
        } catch {
          // ignore play errors
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [muted]);

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
      // decrement tries on every game over
      const current = parseInt(localStorage.getItem("tryCount") || "0", 10);
      const next = Math.max(0, (Number.isFinite(current) ? current : 0) - 1);
      localStorage.setItem("tryCount", String(next));
      setTries(next);

      sendPostMessage("GAME_OVER", encryptScore(score, ENCRYPT_KEY));
      // here i want play gameover sound
      try {
        const gameOverSound = new Audio(gameOverSoundUrl);
        void gameOverSound.play();
      } catch {
        // ignore play errors (e.g., autoplay policies)
      }

      // Pause theme on game over
      try {
        themeAudioRef.current?.pause();
      } catch {
        // ignore pause errors
      }

      gameRef.current?.stop();
      gameRef.current = null;
    }
  }, [gameOver, score]);

  const handleStartGame = useCallback(() => {
    setTimeout(() => {
      // Start theme if not muted (user gesture)
      if (!muted && themeAudioRef.current) {
        themeAudioRef.current.loop = true;
        try {
          void themeAudioRef.current.play();
        } catch {
          // ignore play errors
        }
      }
      // Warm-up catch sound (unlock on mobile)
      if (catchAudioPoolRef.current.length > 0) {
        const a = catchAudioPoolRef.current[0];
        const prevVol = a.volume;
        a.volume = 0;
        const p = a.play();
        if (p && typeof (p as Promise<void>).then === "function") {
          (p as Promise<void>)
            .then(() => {
              a.pause();
              a.currentTime = 0;
              a.volume = prevVol;
            })
            .catch(() => {
              a.volume = prevVol;
            });
        } else {
          a.pause();
          a.currentTime = 0;
          a.volume = prevVol;
        }
      }
      gameRef.current?.start();
      setGameOver(false);
      setStarted(true);
    }, 150);
  }, [muted]);

  const handleCloseGame = useCallback(() => {
    setTimeout(() => {
      sendPostMessage("CLOSE_GAME");
      // gameRef.current?.stop();
      // setStarted(false);
      // setGameOver(false);
    }, 150);
  }, []);

  const handleRestartGame = useCallback(() => {
    setTimeout(() => {
      gameRef.current?.reset();
      gameRef.current?.start();
      setGameOver(false);
      setStarted(true);
      // Resume theme if not muted
      if (!muted && themeAudioRef.current) {
        try {
          void themeAudioRef.current.play();
        } catch {
          // ignore play errors
        }
      }
    }, 150);
  }, [muted]);

  const handleToggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      const a = themeAudioRef.current;
      if (a) {
        if (next) {
          // becoming muted
          try {
            a.pause();
            a.currentTime = 0;
          } catch {
            // ignore pause errors
          }
        } else {
          // becoming unmuted
          try {
            void a.play();
          } catch {
            // ignore play errors
          }
        }
      }
      return next;
    });
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
        <StartGameScreen
          onStart={handleStartGame}
          onHowToPlay={() => sendPostMessage("HOW_TO_PLAY")}
          noAttempts={tries <= 0}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      ) : gameOver ? (
        <GameOverScreen
          onRestart={handleRestartGame}
          onCloseGame={handleCloseGame}
          noAttempts={tries <= 0}
        />
      ) : (
        <GameScreen canvasRef={canvasRef} />
      )}
    </div>
  );
};

export default Index;

const CONFIG_URL = import.meta.env.VITE_GAME_CONFIG_URL;
const ENCRYPT_KEY = import.meta.env.VITE_ENCRYPT_KEY;

const encryptScore = (score: number, key: string): string => {
  return CryptoJS.AES.encrypt(score.toString(), key).toString();
};

const sendPostMessage = (eventName: string, payload: any = null) => {
  window.postMessage({ event: eventName, payload: payload });
};
