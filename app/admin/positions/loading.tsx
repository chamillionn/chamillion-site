import styles from "../loading.module.css";

export default function PositionsLoading() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.heading} />
      <div className={styles.bar} />
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader} />
        <div className={styles.tableRow} />
        <div className={styles.tableRow} />
        <div className={styles.tableRow} />
        <div className={styles.tableRow} />
      </div>
    </div>
  );
}
