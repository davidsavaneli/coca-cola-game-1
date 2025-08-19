import type { RefObject } from "react";
import styles from "../styles.module.css";

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>;
}

const GameScreen = ({ canvasRef }: Props) => (
  <canvas ref={canvasRef} className={styles.canvas} />
);

export default GameScreen;
