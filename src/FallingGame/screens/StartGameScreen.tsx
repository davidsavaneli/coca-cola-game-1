import styles from "../styles.module.css";
import playIconSrc from "../assets/images/play-btn-icon.svg";
import { motion } from "framer-motion";
import soundOnIconSrc from "../assets/images/sound-on-icon.svg";
import soundOffIconSrc from "../assets/images/sound-off-icon.svg";

interface Props {
  onStart: () => void;
  onHowToPlay?: () => void;
  noAttempts?: boolean;
  muted?: boolean;
  onToggleMute?: () => void;
}

const StartGameScreen = ({
  onStart,
  onHowToPlay,
  noAttempts,
  muted = true,
  onToggleMute,
}: Props) => (
  <>
    <div className={styles.startGameScreen}>
      {!noAttempts && (
        <motion.button
          className={styles.playBtn}
          onClick={noAttempts ? undefined : onStart}
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
      )}

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
      <img
        src={muted ? soundOffIconSrc : soundOnIconSrc}
        alt={muted ? "Sounf off" : "Sound on"}
        className={styles.muteUnmuteIcon}
        onClick={onToggleMute}
      />
    </div>
  </>
);

export default StartGameScreen;
