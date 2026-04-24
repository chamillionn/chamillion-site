"use client";

import { Component, Suspense, type ReactNode } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Tweet as ReactTweet } from "react-tweet";
import { tweetIdFromUrl } from "./extensions/tweet";
import styles from "./editor.module.css";

/**
 * Error boundary local — si `react-tweet` falla (red, tweet borrado,
 * suspensión inesperada), mostramos un fallback en lugar de crashear todo
 * el editor.
 */
class TweetErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[tweet-view] render failed:", err);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function TweetView({ node }: NodeViewProps) {
  const url = (node.attrs.url as string) || "";
  const id = tweetIdFromUrl(url);

  const fallback = (
    <div className={styles.tweetError}>
      No se pudo cargar el tweet.{" "}
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          Abrir en X
        </a>
      )}
    </div>
  );

  return (
    <NodeViewWrapper
      as="div"
      data-type="tweet"
      data-url={url}
      className={styles.tweetWrap}
    >
      <div className={styles.tweetLabel}>𝕏 TWEET</div>
      <div className={styles.tweetCard} data-theme="dark">
        {id ? (
          <TweetErrorBoundary fallback={fallback}>
            <Suspense
              fallback={
                <div className={styles.tweetError}>Cargando tweet…</div>
              }
            >
              <ReactTweet id={id} />
            </Suspense>
          </TweetErrorBoundary>
        ) : (
          <div className={styles.tweetError}>
            URL de tweet no válida: {url || "(vacía)"}
          </div>
        )}
      </div>
      {url && (
        <a
          className={styles.tweetLink}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {url}
        </a>
      )}
    </NodeViewWrapper>
  );
}
