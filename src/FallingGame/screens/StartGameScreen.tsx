import styles from "../styles.module.css";
import playIconSrc from "../assets/images/play-btn-icon.svg";
// import soundOnIconSrc from "../assets/images/sound-on-icon.svg";
// import soundOffIconSrc from "../assets/images/sound-off-icon.svg";

interface Props {
  onStart: () => void;
  muted?: boolean;
  onToggleMute?: () => void;
  onHowToPlay?: () => void;
}

const StartGameScreen = ({
  onStart,
  //   muted,
  //   onToggleMute,
  onHowToPlay,
}: Props) => (
  <>
    <div className={styles.startGameScreen}>
      <button className={styles.playBtn} onClick={onStart}>
        <img src={playIconSrc} alt="Play" className={styles.playBtnIcon} />
        <p className={styles.playBtnLabel}>play</p>
      </button>
      <div className={styles.howToPlayBtn} onClick={onHowToPlay}>
        How to play?
      </div>
      {/* <img
        src={muted ? soundOffIconSrc : soundOnIconSrc}
        alt={muted ? "Sounf off" : "Sound on"}
        className={styles.muteUnmuteIcon}
        onClick={onToggleMute}
      /> */}
    </div>
  </>
);

export default StartGameScreen;
