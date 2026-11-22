"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { reserveVideo } from "@/app/posts/video-actions";
import { videoRules, type VideoType } from "@/lib/media";

function previewFrame(file: File) {
  return new Promise<string | null | undefined>((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    let readable = false;
    const timer = window.setTimeout(() => finish(readable ? null : undefined), 10_000);
    function finish(result: string | null | undefined) {
      window.clearTimeout(timer);
      video.onloadeddata = video.onloadedmetadata = video.onerror = null;
      video.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(result);
    }
    video.preload = "auto";
    video.onloadedmetadata = () => {
      readable = video.videoWidth > 0 && Number.isFinite(video.duration) && video.duration > 0;
      if (!readable) finish(undefined);
    };
    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(320 / video.videoWidth, 180 / video.videoHeight, 1);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) { finish(null); return; }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      finish(canvas.toDataURL("image/jpeg", 0.75).split(",")[1] || null);
    };
    video.onerror = () => finish(undefined);
    video.src = url;
  });
}

function storageEndpoint(url: string) {
  const storage = new URL(url);
  if (storage.hostname.endsWith(".supabase.co") && !storage.hostname.endsWith(".storage.supabase.co")) {
    storage.hostname = storage.hostname.replace(".supabase.co", ".storage.supabase.co");
  }
  return new URL("/storage/v1/upload/resumable", storage).toString();
}

export function VideoUpload({ type, existing, onChange }: {
  type: VideoType; existing: boolean;
  onChange: (state: { path?: string; busy: boolean; invalid: boolean }) => void;
}) {
  const rules = videoRules[type];
  const input = useRef<HTMLInputElement>(null);
  const upload = useRef<Upload | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "complete" | "failed" | "invalid">("idle");
  const [message, setMessage] = useState("");

  function fail(reason: string, invalid = false) {
    setStatus(invalid ? "invalid" : "failed");
    setMessage(reason);
    onChange({ busy: false, invalid: true });
  }

  async function start(selection: File, retry = false) {
    setStatus("uploading");
    setMessage("");
    onChange({ busy: true, invalid: false });
    if (retry && upload.current) {
      upload.current.start();
      return;
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) { fail("Upload service is unavailable."); return; }
    if (selection.type !== "video/mp4" || !/\.mp4$/i.test(selection.name) || selection.size < 1 || selection.size > rules.maxBytes) {
      fail(`Choose a non-empty MP4 file no larger than ${rules.limit}.`, true);
      return;
    }
    try {
      const poster = await previewFrame(selection);
      if (poster === undefined) {
        fail("This recording could not be read. Export it as H.264 MP4 and select it again.", true);
        return;
      }
      const path = await reserveVideo(type, selection.size, poster);
      if (!path) { fail("Could not start the upload. Try again."); return; }
      const client = createBrowserClient(url, key);
      upload.current = new Upload(selection, {
        endpoint: storageEndpoint(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || url),
        chunkSize: 6 * 1024 ** 2,
        metadata: { bucketName: rules.bucket, objectName: path, contentType: "video/mp4", cacheControl: "60" },
        headers: { apikey: key },
        retryDelays: [0, 1000, 3000],
        storeFingerprintForResuming: false,
        onBeforeRequest: async (request) => {
          const { data } = await client.auth.getSession();
          if (data.session) request.setHeader("Authorization", `Bearer ${data.session.access_token}`);
        },
        onProgress: (uploaded, total) => setProgress(Math.floor(uploaded / total * 100)),
        onSuccess: () => {
          setStatus("complete");
          onChange({ path, busy: false, invalid: false });
        },
        onError: () => fail("Upload interrupted. Retry to continue without losing your post text."),
      });
      upload.current.start();
    } catch {
      fail("Could not start the upload. Try again.");
    }
  }

  return <fieldset className="panel stack">
    <legend>{rules.label}{type === "combo" ? " (optional)" : ""}</legend>
    <p id="video-hint" className="muted">MP4 with H.264 video and optional AAC audio, up to {rules.limit}. {existing && "A recording is already attached."}</p>
    <label htmlFor="post-recording">Select video file</label>
    <input ref={input} id="post-recording" type="file" accept="video/mp4,.mp4" aria-describedby="video-hint" disabled={status === "uploading"}
      onChange={(event) => {
        const selection = event.target.files?.[0];
        if (!selection) return;
        upload.current = null;
        setFile(selection);
        setProgress(0);
        void start(selection);
      }} />
    {file && <p className="muted">{file.name}</p>}
    {status === "uploading" && <progress aria-label="Upload progress" value={progress} max={100}>{progress}%</progress>}
    {status === "complete" && <p role="status">Upload complete.</p>}
    {message && <p role="alert">{message}</p>}
    {file && status !== "uploading" && <div className="row">
      {status === "failed" && <button className="button secondary" type="button" onClick={() => start(file, true)}>Retry upload</button>}
      <button className="button secondary" type="button" onClick={() => {
        if (input.current) input.current.value = "";
        upload.current = null;
        setFile(null);
        setStatus("idle");
        setMessage("");
        onChange({ busy: false, invalid: false });
      }}>Clear selection</button>
    </div>}
  </fieldset>;
}
