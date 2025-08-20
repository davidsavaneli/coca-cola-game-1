import type { RefObject } from "react";
import styles from "../styles.module.css";
import { motion } from "framer-motion";

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>;
}

const GameScreen = ({ canvasRef }: Props) => (
  <motion.canvas
    ref={canvasRef}
    className={styles.canvas}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
  />
);

export default GameScreen;
