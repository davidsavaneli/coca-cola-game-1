import { useRef, useEffect, useState, useCallback } from "react";
import { Game } from "./game";
import { defaultConfig } from "./config";
import GameOverScreen from "./screens/GameOverScreen";

import styles from "./styles.module.css";
import bgImgSrc from "./assets/images/background.webp";
import logoSrc from "./assets/images/logo.svg";

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const handleUpdateState = useCallback(
    ({ score, gameOver }: { score: number; gameOver: boolean }) => {
      setScore(score);
      setGameOver(gameOver);
    },
    []
  );

  // Auto-start game on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas, defaultConfig, handleUpdateState);
    gameRef.current = game;
    game.start();

    return () => {
      gameRef.current?.stop();
      gameRef.current = null;
    };
  }, [handleUpdateState]);

  return (
    <div className={styles.scene}>
      <img src={bgImgSrc} alt="" className={styles.bgImage} />
      <div className={styles.startGameBackdrop}></div>
      <img src={logoSrc} alt="Logo" className={styles.logo} />
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.scoreBox}>
        <div className={styles.score}>{score}</div>
        <div className={styles.scoreLabel}>Points</div>
      </div>

      {gameOver && (
        <GameOverScreen onRestart={() => window.location.reload()} />
      )}
    </div>
  );
};

export default App;
