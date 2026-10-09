"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatBdt, formatHourRange } from "@/lib/utils";
import {
  DEFAULT_CLOSING,
  DEFAULT_OPENING,
  getPitchSlotConfig,
} from "@/lib/slot-calculator";
import type { Pitch } from "@/types/booking";

export default function AdminPitchPricesPage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/pitches");
      const json = await response.json();
      if (!response.ok) throw new Error((json as { error?: string }).error ?? "Could not load pitches.");
      const list = (json.pitches ?? []) as Pitch[];
      setPitches(list);
      setRates(Object.fromEntries(list.map((pitch) => [pitch.id, String(pitch.ratePerHour)])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pitches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const pitch of pitches) {
      const value = rates[pitch.id];
      map[pitch.id] = value !== undefined && Number(value) !== pitch.ratePerHour;
    }
    return map;
  }, [pitches, rates]);

  async function save(pitch: Pitch) {
    setSavingId(pitch.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/pitches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pitch.id, ratePerHour: Number(rates[pitch.id]) }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not save the price.");
      }
      setToast(`Price updated for ${pitch.name}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the price.");
    } finally {
      setSavingId(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Pitch prices</h1>
          <p className="mt-1 text-sm text-white/50">
            Edit the hourly rate of every facility — slot prices update instantly across the site.
          </p>
        </div>
        <Link
          href="/admin/slots"
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white"
        >
          Per-date slot rates →
        </Link>
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

      <div className="space-y-3">
        {loading && (
          <div>
            <div className="h-24 animate-pulse rounded-xl bg-surface-raised" />
            <div className="mt-3 h-24 animate-pulse rounded-xl bg-surface-raised" />
          </div>
        )}

        {!loading &&
          pitches.map((pitch) => {
            const config = getPitchSlotConfig(
              pitch,
              DEFAULT_OPENING,
              DEFAULT_CLOSING
            );
            const slotHours = config.slotMinutes / 60;
            const previewRate = Number(rates[pitch.id] ?? pitch.ratePerHour);
            const slotPrice = Math.round((Number.isFinite(previewRate) ? previewRate : pitch.ratePerHour) * slotHours);

            return (
              <div key={pitch.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-base font-semibold">{pitch.name}</h2>
                      <span className="rounded-full bg-neon/10 px-2 py-0.5 text-[10px] font-bold uppercase text-neon ring-1 ring-neon/40">
                        {pitch.sport}
                      </span>
                      {!pitch.active && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/60 ring-1 ring-white/20">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-white/60">
                      {slotHours} hr slots · {formatHourRange(config.opening, config.closing)}
                    </p>
                    <p className="mt-1 text-sm text-white/50">
                      Current slot price:{" "}
                      <span className="font-semibold text-neon">
                        {formatBdt(Math.round(pitch.ratePerHour * slotHours))}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                        Price per hour (BDT)
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={rates[pitch.id] ?? ""}
                        onChange={(event) =>
                          setRates((prev) => ({ ...prev, [pitch.id]: event.target.value }))
                        }
                        className="w-40 rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
                      />
                    </label>
                    <div className="rounded-xl bg-surface-raised px-4 py-2.5 text-center ring-1 ring-white/10">
                      <span className="block text-[10px] uppercase tracking-wide text-white/50">
                        Per slot
                      </span>
                      <span className="font-display text-sm font-bold text-neon">
                        {formatBdt(Number.isFinite(slotPrice) ? slotPrice : 0)}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={savingId === pitch.id || !dirty[pitch.id]}
                      onClick={() => save(pitch)}
                      className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === pitch.id ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {!loading && pitches.length === 0 && !error && (
          <div className="surface-card p-10 text-center">
            <p className="text-sm text-white/60">
              No facilities found. Run <code className="text-neon">npm run db:seed</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
