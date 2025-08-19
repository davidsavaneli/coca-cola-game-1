import styles from "../styles.module.css";
import playAgainIconSrc from "../assets/images/play-again-icon.svg";
import wellPlayedSrc from "../assets/images/well-played.webp";
import glowEffectSrc from "../assets/images/glow-effect.png";
import noAttemptsIconSrc from "../assets/images/no-attempts-icon.svg"; // <-- added no attempts icon

interface Props {
  noAttempts?: boolean; // <-- added optional prop
  onRestart: () => void;
  onCloseGame: () => void;
}

const GameOverScreen = ({ onRestart, onCloseGame, noAttempts }: Props) => (
  <div className={styles.gameOverScreen}>
    {noAttempts ? (
      <div className={styles.noAttemptsMessage}>
        <img
          src={noAttemptsIconSrc}
          alt="No Attempts"
          className={styles.noAttemptsIcon}
        />
        <p className={styles.noAttemptsText}>
          You don't have remaining attempts
        </p>
      </div>
    ) : (
      <button className={styles.playAgainBtn} onClick={onRestart}>
        <img
          src={playAgainIconSrc}
          alt="Play Again"
          className={styles.playBtnIcon}
        />
        <p className={styles.playBtnLabel}>play again</p>
      </button>
    )}

    <div className={styles.closeGameBtn} onClick={onCloseGame}>
      Close Game
    </div>
    <div className={styles.wellPlayedImgBox}>
      <img
        src={wellPlayedSrc}
        alt="Well Played"
        className={styles.wellPlayedImg}
      />
    </div>
    <img src={glowEffectSrc} alt="Glow Effect" className={styles.glowEffect} />
  </div>
);

export default GameOverScreen;
