"use client";

import styles from "./Loading.module.css";

type Props = {
  message?: string;
};

export default function Loading({ message = "Loading" }: Props) {
  return (
    <div className={styles.loading}>
      <span className={styles["loading-text"]}>{message}</span>
      <div className={styles["loading-dots"]}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
