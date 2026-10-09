"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

const MAX_BYTES = 200 * 1024 * 1024;

interface HeroVideoFormProps {
  onSaved?: (message: string) => void;
}

export default function HeroVideoForm({ onSaved }: HeroVideoFormProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/hero-video")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the video.");
        return response.json() as Promise<{ url: string | null }>;
      })
      .then((json) => setUrl(json.url))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const currentUrl = filePreview ?? url;

  function pickFile(next: File | null) {
    setError(null);
    if (next && next.size > MAX_BYTES) {
      setError("Video must be 200 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
      return;
    }
    setFile(next);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/hero-video", { method: "POST", body });
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not upload the video.");
      }
      setUrl((json as { url: string | null }).url);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSaved?.("Hero video updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the video.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!url) return;
    setRemoving(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("remove", "true");
      const response = await fetch("/api/admin/hero-video", { method: "POST", body });
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not remove the video.");
      }
      setUrl(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSaved?.("Hero video removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the video.");
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-surface-raised" />;
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card max-w-2xl space-y-4 p-5">
      <div>
        <h2 className="font-display text-lg font-bold">Top page video</h2>
        <p className="mt-1 text-sm text-white/50">
          This video plays in the hero banner at the top of the home page.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
        {currentUrl ? (
          <video
            src={currentUrl}
            className="h-56 w-full object-cover"
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center text-sm text-white/40">
            No video uploaded yet
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-neon file:px-3 file:py-2 file:text-sm file:font-semibold file:text-charcoal hover:file:bg-neon-soft"
        />
        <p className="text-[11px] text-white/40">
          Standard MP4, WEBM, or OGG only. Maximum size 200 MB. Uploading a new video
          automatically removes the previous one.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || !file}
          className="rounded-xl bg-neon px-6 py-2.5 font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Uploading…" : file ? "Upload and replace" : "Save video"}
        </button>
        {url && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-300 ring-1 ring-red-400/30 transition hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {removing ? "Removing…" : "Remove video"}
          </button>
        )}
      </div>
    </form>
  );
}