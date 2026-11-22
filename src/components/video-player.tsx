"use client";

import { useRef, useState } from "react";

export function VideoPlayer({ postId, demo = false }: { postId: string; demo?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const position = useRef(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function load() {
    if (!video.current) return;
    const element = video.current;
    if (element.currentTime) position.current = element.currentTime;
    setLoading(true);
    setError(false);
    try {
      let url = "/demo-preview.webm";
      if (!demo) {
        const response = await fetch(`/posts/${postId}/video`, { cache: "no-store" });
        if (!response.ok) throw new Error("Video is temporarily unavailable.");
        ({ url } = await response.json() as { url: string });
      }
      element.src = url;
      setStarted(true);
      await element.play().catch(() => {});
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return <div className="media-player">
    <video ref={video} className="post-video" controls={started} preload="none" poster={demo ? "/entropy-hero.webp" : `/posts/${postId}/thumbnail`}
      aria-label={demo ? "Demo video preview" : "Post recording"} onError={() => setError(true)} onLoadedMetadata={() => {
        if (video.current && position.current < video.current.duration) video.current.currentTime = position.current;
      }} />
    {(!started || error) && <button type="button" className="button media-player-button" disabled={loading} onClick={load}>
      {loading ? "Loading video…" : error ? "Retry video" : "Play video"}
    </button>}
    {error && <p role="alert">The recording could not load.</p>}
  </div>;
}
