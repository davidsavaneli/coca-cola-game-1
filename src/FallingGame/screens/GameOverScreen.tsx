import styles from "../styles.module.css";
import playAgainIconSrc from "../assets/images/play-again-icon.svg";
import wellPlayedSrc from "../assets/images/well-played.webp";
import glowEffectSrc from "../assets/images/glow-effect.png";
import noAttemptsIconSrc from "../assets/images/no-attempts-icon.svg"; // <-- added no attempts icon
import { motion } from "framer-motion";

interface Props {
  noAttempts?: boolean; // <-- added optional prop
  onRestart: () => void;
  onCloseGame: () => void;
}

const GameOverScreen = ({ onRestart, onCloseGame, noAttempts }: Props) => (
  <div className={styles.gameOverScreen}>
    {noAttempts ? (
      <motion.div
        className={styles.noAttemptsMessage}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
      >
        <img
          src={noAttemptsIconSrc}
          alt="No Attempts"
          className={styles.noAttemptsIcon}
        />
        <p className={styles.noAttemptsText}>
          You don't have remaining attempts
        </p>
      </motion.div>
    ) : (
      <motion.div
        className={styles.playAgainBtnBox}
        whileTap={{
          scale: 0.9,
          transition: { duration: 0.1, ease: "easeOut" },
        }}
      >
        <motion.button
          className={styles.playAgainBtn}
          onClick={onRestart}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
        >
          <img
            src={playAgainIconSrc}
            alt="Play Again"
            className={styles.playBtnIcon}
          />
          <p className={styles.playBtnLabel}>play again</p>
        </motion.button>
      </motion.div>
    )}

    <motion.div
      className={styles.closeGameBtn}
      onClick={onCloseGame}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
    >
      <motion.div
        whileTap={{
          scale: 0.9,
          transition: { duration: 0.1, ease: "easeOut" },
        }}
      >
        Close Game
      </motion.div>
    </motion.div>

    <motion.div
      className={styles.wellPlayedImgBox}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
    >
      <img
        src={wellPlayedSrc}
        alt="Well Played"
        className={styles.wellPlayedImg}
      />
    </motion.div>

    <motion.img
      src={glowEffectSrc}
      alt="Glow Effect"
      className={styles.glowEffect}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
    />
  </div>
);

export default GameOverScreen;
