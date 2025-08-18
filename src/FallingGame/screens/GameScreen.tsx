import type { RefObject } from "react";
import styles from "../styles.module.css";

import bgImgSrc from "../assets/images/background.webp";
import logoSrc from "../assets/images/logo.svg";
import type { Game } from "../game";

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>;
  gameRef: RefObject<Game | null>;
  score: number;
  canInteract: boolean;
}

const GameScreen = ({ canvasRef, gameRef, score, canInteract }: Props) => {
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canInteract) return;

    const pointerId = e.pointerId;
    const onMove = (event: PointerEvent) => {
      if (event.pointerId === pointerId) {
        gameRef.current?.handleDrag(event.clientX);
      }
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId === pointerId) {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    e.currentTarget.setPointerCapture?.(pointerId);
    e.preventDefault();
  };

  return (
    <>
      <img src={bgImgSrc} alt="" className={styles.bgImage} />
      <div className={styles.startGameBackdrop}></div>
      <img src={logoSrc} alt="Logo" className={styles.logo} />
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
      />
      <div className={styles.scoreBox}>
        <div className={styles.score}>{score}</div>
        <div className={styles.scoreLabel}>Points</div>
      </div>
    </>
  );
};

export default GameScreen;
