import { useRef, useEffect, useState, useCallback } from "react";
import type { RefObject } from "react";
import { Game } from "./game";
import { defaultConfig } from "./config";
import GameOverScreen from "./screens/GameOverScreen";
import GameScreen from "./screens/GameScreen";
import StartGameScreen from "./screens/StartGameScreen";

import styles from "./styles.module.css";
import bgImgSrc from "./assets/images/background.webp";
import logoSrc from "./assets/images/logo.svg";

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);

  const handleUpdateState = useCallback(
    ({ score, gameOver }: { score: number; gameOver: boolean }) => {
      setScore(score);
      setGameOver(gameOver);
    },
    []
  );

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
      console.log(score);
      gameRef.current?.stop();
      gameRef.current = null;
    }
  }, [gameOver, score]);

  const handleStart = useCallback(() => {
    setGameOver(false);
    setStarted(true);
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

      {!started ? (
        <StartGameScreen
          onStart={handleStart}
          muted={true}
          onToggleMute={() => console.log("onToggleMute")}
          onHowToPlay={() => console.log("onHowToPlay")}
        />
      ) : gameOver ? (
        <GameOverScreen
          onRestart={() => {
            setGameOver(false);
            setStarted(true);
          }}
          onCloseGame={() => console.log("onCloseGame")}
          noAttempts={true}
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
