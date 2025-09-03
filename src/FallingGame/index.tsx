import { useRef, useEffect, useState, useCallback } from "react";
import { Game } from "./game";
import { motion, AnimatePresence } from "framer-motion";

import LoadingScreen from "./screens/LoaderScreen";
import StartGameScreen from "./screens/StartGameScreen";
import GameScreen from "./screens/GameScreen";
import GameOverScreen from "./screens/GameOverScreen";

import styles from "./styles.module.css";

import logoSrc from "./assets/images/logo.svg";
import { audioManager } from "./audio/AudioManager";
import { useGameSetup, useCatchSoundListener } from "./hooks.ts";
import { sendPostMessage, encryptScore } from "./helpers.ts";

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);
  const [muted, setMuted] = useState<boolean>(true);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);

  const { assetsLoaded, config, noAttempts, decrementTries } = useGameSetup();

  const handleUpdateState = useCallback(
    ({ score, gameOver }: { score: number; gameOver: boolean }) => {
      setScore(score);
      setGameOver(gameOver);
    },
    []
  );

  useCatchSoundListener(muted);

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
      decrementTries(1);

      sendPostMessage("GAME_OVER", encryptScore(score));

      audioManager.stopLoop();
      if (!muted) audioManager.play("gameover");

      gameRef.current?.stop();
      gameRef.current = null;
    }
  }, [gameOver, score, muted, decrementTries]);

  const handleStartGame = useCallback(() => {
    setTimeout(() => {
      void audioManager.resume();
      if (!muted) {
        audioManager.startLoop("theme");
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
      if (!muted) {
        audioManager.startLoop("theme");
      }
    }, 150);
  }, [muted]);

  const handleToggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      audioManager.setMuted(next);
      if (next) {
        audioManager.stopLoop();
      } else {
        audioManager.startLoop("theme");
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
          noAttempts={noAttempts}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      ) : gameOver ? (
        <GameOverScreen
          onRestart={handleRestartGame}
          onCloseGame={handleCloseGame}
          noAttempts={noAttempts}
        />
      ) : (
        <GameScreen canvasRef={canvasRef} />
      )}
    </div>
  );
};

export default Index;
