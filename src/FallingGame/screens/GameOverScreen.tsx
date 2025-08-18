import styles from "../styles.module.css";

interface Props {
  onRestart: () => void;
}

const GameOverScreen = ({ onRestart }: Props) => (
  <div className={styles.gameOverScreen}>
    <button className={styles.restartBtn} onClick={onRestart}>
      Restart
    </button>
  </div>
);

export default GameOverScreen;
