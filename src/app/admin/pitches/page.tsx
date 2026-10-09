"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PitchFormModal from "@/components/admin/PitchFormModal";
import { cn, formatBdt, formatHourRange } from "@/lib/utils";
import {
  DEFAULT_CLOSING,
  DEFAULT_OPENING,
  getPitchSlotConfig,
} from "@/lib/slot-calculator";
import type { Pitch } from "@/types/booking";

function sportEmoji(sport: string) {
  const value = sport.trim().toLowerCase();
  if (value === "football" || value === "futsal") return "⚽";
  if (value === "swimming") return "🏊";
  if (value === "badminton") return "🏸";
  if (value === "tennis") return "🎾";
  if (value === "basketball") return "🏀";
  return "🏟️";
}

export default function AdminCourtsPage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pitch | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/pitches");
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not load courts.");
      }
      setPitches((json.pitches ?? []) as Pitch[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load courts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function notify(message: string) {
    setToast(message);
    setModalOpen(false);
    setEditing(null);
    load();
    setTimeout(() => setToast(null), 3000);
  }

  async function toggleActive(pitch: Pitch) {
    setBusyId(pitch.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/pitches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pitch.id, active: !pitch.active }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not update the court.");
      }
      notify(pitch.active ? "Court hidden from the site." : "Court is now live.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the court.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(pitch: Pitch) {
    if (!window.confirm(`Delete "${pitch.name}" permanently?`)) return;
    setBusyId(pitch.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/pitches?id=${encodeURIComponent(pitch.id)}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not delete the court.");
      }
      notify("Court deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the court.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Courts &amp; pricing</h1>
          <p className="mt-1 text-sm text-white/50">
            Add courts, edit the home-page cards, change prices, and show or hide
            each facility. Changes go live on the website instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/slots"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white"
          >
            Per-date rates →
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="rounded-xl bg-neon px-4 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft"
          >
            + Add court
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl bg-neon/10 px-4 py-2 text-sm font-medium text-neon ring-1 ring-neon/40">
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-surface-raised" />
          <div className="h-40 animate-pulse rounded-2xl bg-surface-raised" />
        </div>
      )}

      {!loading && pitches.length === 0 && (
        <div className="surface-card p-10 text-center">
          <p className="text-sm text-white/60">
            No courts yet. Click <span className="text-neon">Add court</span> to
            create your first facility.
          </p>
        </div>
      )}

      {!loading && pitches.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {pitches.map((pitch) => {
            const config = getPitchSlotConfig(pitch, DEFAULT_OPENING, DEFAULT_CLOSING);
            const slotHours = config.slotMinutes / 60;
            const imageFailed = failedImages.has(pitch.id);
            return (
              <div
                key={pitch.id}
                className="surface-card flex flex-col gap-4 p-4 sm:flex-row"
              >
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-surface-raised ring-1 ring-white/10 sm:w-40">
                  {pitch.imageUrl && !imageFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pitch.imageUrl}
                      alt={pitch.name}
                      className="h-full w-full object-cover"
                      onError={() =>
                        setFailedImages((prev) => new Set(prev).add(pitch.id))
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">
                      {sportEmoji(pitch.sport)}
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-lg bg-charcoal/80 px-2 py-0.5 text-[10px] font-semibold text-neon">
                    {pitch.sport.toUpperCase()}
                  </span>
                  {!pitch.active && (
                    <span className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Hidden
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-base font-semibold">{pitch.name}</h2>
                    <span className="shrink-0 font-display text-sm font-bold text-neon">
                      {formatBdt(pitch.ratePerSlot)}
                      <span className="text-[11px] font-medium text-white/50">/slot</span>
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/50">
                    {pitch.dimensions || "—"} · {slotHours} hr slots ·{" "}
                    {formatHourRange(config.opening, config.closing)}
                  </p>
                  {pitch.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/60">
                      {pitch.description}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(pitch);
                        setModalOpen(true);
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId === pitch.id}
                      onClick={() => toggleActive(pitch)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition disabled:opacity-50",
                        pitch.active
                          ? "text-white/70 ring-white/15 hover:text-white"
                          : "text-neon ring-neon/40 hover:bg-neon/10"
                      )}
                    >
                      {pitch.active ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === pitch.id}
                      onClick={() => remove(pitch)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PitchFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSaved={notify}
      />
    </div>
  );
}
