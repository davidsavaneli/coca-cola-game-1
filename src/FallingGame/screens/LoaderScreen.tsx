import styles from "../styles.module.css";

const LoadingScreen = () => (
  <div className={styles.loadingScreen}>
    <div className={styles.spinner} />
  </div>
);

export default LoadingScreen;
