"use client";

import styles from "../post.module.css";

export default function EvmLink({
  chain,
  widgetId,
  children,
}: {
  chain: string;
  widgetId: string;
  children: React.ReactNode;
}) {
  function handleClick() {
    const iframe = document.getElementById(widgetId) as HTMLIFrameElement | null;
    if (!iframe) return;
    iframe.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      iframe.contentWindow?.postMessage({ type: "highlight-chain", chain }, "*");
    }, 500);
  }

  return (
    <button type="button" onClick={handleClick} className={styles.evmLink}>
      {children}
    </button>
  );
}
