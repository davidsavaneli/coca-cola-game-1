import styles from "../styles.module.css";
import playIconSrc from "../assets/images/play-btn-icon.svg";
import { motion } from "framer-motion";

interface Props {
  onStart: () => void;
  onHowToPlay?: () => void;
}

const StartGameScreen = ({ onStart, onHowToPlay }: Props) => (
  <>
    <div className={styles.startGameScreen}>
      <motion.button
        className={styles.playBtn}
        onClick={onStart}
        whileTap={{
          scale: 0.9,
          transition: { duration: 0.1, ease: "easeOut" },
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <img src={playIconSrc} alt="Play" className={styles.playBtnIcon} />
        <p className={styles.playBtnLabel}>play</p>
      </motion.button>

      <motion.div
        className={styles.howToPlayBtn}
        onClick={onHowToPlay}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
      >
        <motion.div
          whileTap={{
            scale: 0.9,
            transition: { duration: 0.1, ease: "easeOut" },
          }}
        >
          How to play?
        </motion.div>
      </motion.div>
    </div>
  </>
);

export default StartGameScreen;
