"use client";

import { useEffect, useRef } from "react";

interface Props {
  src: string;
  widgetId: string;
  className?: string;
  title?: string;
  loading?: "lazy" | "eager";
}

export default function IframeWidget({ src, widgetId, className, title, loading = "lazy" }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handle(e: MessageEvent) {
      if (e.data?.type === "chamillion-resize" && e.data?.id === widgetId && ref.current) {
        ref.current.style.height = e.data.height + "px";
      }
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [widgetId]);

  return (
    <iframe
      id={widgetId}
      ref={ref}
      src={src}
      loading={loading}
      className={className}
      title={title}
      scrolling="no"
      style={{ overflow: "hidden" }}
    />
  );
}
