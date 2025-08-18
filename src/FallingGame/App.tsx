import { useRef, useEffect, useState, useCallback } from "react";
import { Game } from "./game";
import { defaultConfig } from "./config";
import StartGameScreen from "./screens/StartGameScreen";
import GameOverScreen from "./screens/GameOverScreen";
import LoadingScreen from "./screens/LoadingScreen";
import GameScreen from "./screens/GameScreen";

import styles from "./styles.module.css";

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);

  const [isPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleUpdateState = useCallback(
    ({ score, gameOver }: { score: number; gameOver: boolean }) => {
      setScore(score);
      setGameOver(gameOver);
    },
    []
  );

  // Static 200ms loader without preloading assets
  useEffect(() => {
    const id = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(id);
  }, []);

  // Initialize and start the game after start & assets loaded
  useEffect(() => {
    if (!hasStarted || !isLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas, defaultConfig, handleUpdateState);
    gameRef.current = game;
    game.start();

    return () => {
      gameRef.current?.stop();
      gameRef.current = null;
    };
  }, [hasStarted, isLoaded, handleUpdateState]);

  const handleStart = () => {
    if (!isLoaded) return;
    setHasStarted(true);
  };

  const canInteract = !!(hasStarted && isLoaded && !isPaused && !gameOver);

  return (
    <div className={styles.scene}>
      {!isLoaded && <LoadingScreen />}
      {isLoaded && !hasStarted && (
        <StartGameScreen onStart={handleStart} isLoaded={isLoaded} />
      )}
      {hasStarted && (
        <GameScreen
          canvasRef={canvasRef}
          gameRef={gameRef}
          score={score}
          canInteract={canInteract}
        />
      )}
      {gameOver && (
        <GameOverScreen onRestart={() => window.location.reload()} />
      )}
    </div>
  );
};

export default App;
