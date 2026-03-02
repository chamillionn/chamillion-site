import styles from "../loading.module.css";

export default function PlatformsLoading() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.heading} />
      <div className={styles.grid}>
        <div className={styles.card} />
        <div className={styles.card} />
        <div className={styles.card} />
      </div>
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader} />
        <div className={styles.tableRow} />
        <div className={styles.tableRow} />
      </div>
    </div>
  );
}
