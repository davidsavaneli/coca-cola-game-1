import styles from "../styles.module.css";

import bgImgSrc from "../assets/images/background.webp";

const LoadingScreen = () => (
  <>
    <img src={bgImgSrc} alt="" className={styles.bgImage} />
    <div className={styles.startGameBackdrop}></div>
    <div className={styles.loadingScreen}>
      <div>
        <div className={styles.spinner}></div>
        <p className={styles.loadingLabel}>Loading...</p>
      </div>
    </div>
  </>
);

export default LoadingScreen;
