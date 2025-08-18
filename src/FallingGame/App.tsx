import React, { useRef, useEffect, useState, useCallback } from "react";
import { Game } from "./game";
import { defaultConfig } from "./config";
import StartGameScreen from "./screens/StartGameScreen";
import GameOverScreen from "./screens/GameOverScreen";

import styles from "./styles.module.css";

import bgImgSrc from "./assets/images/background.webp";

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const gameRef = useRef<Game | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const handleUpdateState = useCallback(
    ({ score, gameOver }: { score: number; gameOver: boolean }) => {
      setScore(score);
      setGameOver(gameOver);
    },
    []
  );

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

  useEffect(() => {
    if (!hasStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    gameRef.current = new Game(canvas, defaultConfig, handleUpdateState);
    lastTimeRef.current = performance.now();
    animationFrameIdRef.current = requestAnimationFrame(animate);

    const handleResize = () => gameRef.current?.setupCanvas();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameIdRef.current)
        cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [hasStarted, animate, handleUpdateState]);

  const handlePauseResume = () => {
    if (gameRef.current) {
      const newPausedState = !isPaused;
      gameRef.current.isPaused = newPausedState;
      setIsPaused(newPausedState);
      if (!newPausedState) {
        lastTimeRef.current = performance.now();
        if (!animationFrameIdRef.current) {
          animationFrameIdRef.current = requestAnimationFrame(animate);
        }
      }
    }
  };

  const handleRestart = () => {
    gameRef.current?.resetGame();
    setGameOver(false);
    setIsPaused(false);
    lastTimeRef.current = performance.now();
    if (!animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  };

  const handleMouseDown = () => {
    if (
      gameRef.current &&
      !gameRef.current.isPaused &&
      !gameRef.current.gameOver
    ) {
      const handleMouseMove = (event: MouseEvent) =>
        gameRef.current?.handleDrag(event.clientX);
      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (
      e.touches.length === 1 &&
      gameRef.current &&
      !gameRef.current.isPaused &&
      !gameRef.current.gameOver
    ) {
      const handleTouchMove = (event: TouchEvent) => {
        if (gameRef.current && event.touches.length === 1)
          gameRef.current.handleDrag(event.touches[0].clientX);
      };
      const handleTouchEnd = () => {
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }
  };

  return (
    <div className={styles.scene}>
      {!hasStarted && <StartGameScreen onStart={() => setHasStarted(true)} />}
      {hasStarted && (
        <>
          <img src={bgImgSrc} alt="" className={styles.bgImage} />
          <div className={styles.startGameBackdrop}></div>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
          <div className={styles.score}>Score: {score}</div>
          <button className={styles.pauseResumeBtn} onClick={handlePauseResume}>
            {isPaused ? "Resume" : "Pause"}
          </button>
        </>
      )}
      {gameOver && <GameOverScreen onRestart={handleRestart} />}
    </div>
  );
};

export default App;
