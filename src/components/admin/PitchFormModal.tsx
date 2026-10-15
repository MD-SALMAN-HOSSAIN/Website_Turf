"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { formatBdt, readJson } from "@/lib/utils";
import type { Pitch } from "@/types/booking";

interface PitchFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Pitch | null;
  onSaved: (message: string) => void;
}

const SPORT_SUGGESTIONS = ["Football", "Swimming", "Futsal", "Badminton", "Tennis", "Basketball"];

function sportEmoji(sport: string) {
  const value = sport.trim().toLowerCase();
  if (value === "football" || value === "futsal") return "⚽";
  if (value === "swimming") return "🏊";
  if (value === "badminton") return "🏸";
  if (value === "tennis") return "🎾";
  if (value === "basketball") return "🏀";
  return "🏟️";
}

export default function PitchFormModal({
  open,
  onClose,
  initial,
  onSaved,
}: PitchFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sport, setSport] = useState(initial?.sport ?? "Football");
  const [dimensions, setDimensions] = useState(initial?.dimensions ?? "");
  const [rate, setRate] = useState(String(initial?.ratePerSlot ?? 0));
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setSport(initial?.sport ?? "Football");
    setDimensions(initial?.dimensions ?? "");
    setRate(String(initial?.ratePerSlot ?? 0));
    setOrder(String(initial?.order ?? 0));
    setDescription(initial?.description ?? "");
    setImageUrl(initial?.imageUrl ?? "");
    setActive(initial?.active ?? true);
    setFile(null);
    setFilePreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, initial]);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!open) return null;

  const preview = filePreview ?? (imageUrl.trim() || null);

  async function uploadImage(): Promise<string | null> {
    if (!file) return imageUrl.trim();
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const json = await readJson<{ url?: string; error?: string }>(response);
    if (!response.ok) {
      throw new Error(
        json?.error ??
          (response.status === 413
            ? "That image is too large to upload. Please use one under 4 MB."
            : "Could not upload the image.")
      );
    }
    return (json as { url: string }).url;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const uploadedUrl = await uploadImage();
      const payload = {
        name: name.trim(),
        sport: sport.trim(),
        dimensions: dimensions.trim(),
        description: description.trim(),
        imageUrl: uploadedUrl ?? "",
        ratePerSlot: Number(rate),
        order: Number(order),
        active,
      };

      const response = await fetch("/api/admin/pitches", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initial ? { id: initial.id, ...payload } : payload),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not save the court.");
      }
      onSaved(initial ? "Court updated." : "Court added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the court.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-surface p-6 shadow-card sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-bold">
            {initial ? "Edit court" : "Add court"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 ring-1 ring-white/15 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Court name
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Swimming Pool"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Sport
              </span>
              <input
                type="text"
                list="sport-suggestions"
                value={sport}
                onChange={(event) => setSport(event.target.value)}
                placeholder="Football"
                className={inputClass}
              />
              <datalist id="sport-suggestions">
                {SPORT_SUGGESTIONS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Dimensions
              </span>
              <input
                type="text"
                value={dimensions}
                onChange={(event) => setDimensions(event.target.value)}
                placeholder="25m × 12m"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Price/slot (BDT)
              </span>
              <input
                type="number"
                min={0}
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Display order
              </span>
              <input
                type="number"
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Card description
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Lanes open 6:00 AM to 10:00 PM in 2-hour sessions."
              className={inputClass}
            />
          </label>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Card picture
            </span>
            <div className="flex gap-3">
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-surface-raised ring-1 ring-white/10">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Court preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">
                    {sportEmoji(sport)}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-neon file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-charcoal hover:file:bg-neon-soft"
                />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(event) => {
                    setImageUrl(event.target.value);
                    setFile(null);
                  }}
                  placeholder="…or paste an image URL"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-white/40">
              Upload a photo (max 4 MB) or paste a link. Square/landscape images look best.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="h-4 w-4 accent-neon"
            />
            Show this court on the website
          </label>

          <div className="rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white/70 ring-1 ring-white/10">
            Card shows{" "}
            <span className="font-semibold text-neon">
              {formatBdt(Math.max(0, Math.round(Number(rate) || 0)))}
            </span>{" "}
            per slot
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-neon py-2.5 font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : initial ? "Save changes" : "Add court"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
