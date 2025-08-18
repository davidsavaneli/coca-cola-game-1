import styles from "../styles.module.css";

import bgImgSrc from "../assets/images/background.webp";
import playBtnIconSrc from "../assets/images/play-btn-icon.svg";
import soundOnIconSrc from "../assets/images/sound-on-icon.svg";

interface Props {
  onStart: () => void;
  isLoaded: boolean;
}

const StartGameScreen = ({ onStart, isLoaded }: Props) => (
  <>
    <img src={bgImgSrc} alt="" className={styles.bgImage} />
    <div className={styles.startGameScreen}>
      <button className={styles.playBtn} onClick={onStart} disabled={!isLoaded}>
        <img src={playBtnIconSrc} alt="" className={styles.playBtnIcon} />
        <p className={styles.playBtnLabel}>play</p>
      </button>
      <div
        className={styles.howToPlayBtn}
        onClick={() => console.log("How to play?")}
      >
        How to play?
      </div>
      <img
        src={soundOnIconSrc}
        alt=""
        className={styles.muteUnmuteIcon}
        onClick={() => console.log("Mute / Unmute")}
      />
    </div>
  </>
);

export default StartGameScreen;
