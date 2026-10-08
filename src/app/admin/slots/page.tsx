"use client";

import { useCallback, useEffect, useState } from "react";
import SlotBlockerModal from "@/components/admin/SlotBlockerModal";
import { formatDateShort, formatHourRange } from "@/lib/utils";
import type { Pitch, SlotOverride } from "@/types/booking";

export default function AdminSlotsPage() {
  const [overrides, setOverrides] = useState<SlotOverride[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SlotOverride | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overridesResponse, availabilityResponse] = await Promise.all([
        fetch("/api/admin/block-slot"),
        fetch("/api/slots/availability"),
      ]);
      const overridesJson = await overridesResponse.json();
      const availabilityJson = await availabilityResponse.json();
      setOverrides(overridesJson.overrides ?? []);
      setPitches(availabilityJson.pitches ?? []);
    } catch {
      setOverrides([]);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Slot manager</h1>
          <p className="mt-1 text-sm text-white/50">
            Block maintenance hours or adjust rates for a specific pitch and date.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="rounded-xl bg-neon px-4 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft"
        >
          + New slot rule
        </button>
      </div>

      {toast && (
        <div className="rounded-xl bg-neon/10 px-4 py-2 text-sm font-medium text-neon ring-1 ring-neon/40">
          {toast}
        </div>
      )}

      <div className="space-y-3">
        {loading && (
          <div>
            <div className="h-14 animate-pulse rounded-xl bg-surface-raised" />
            <div className="mt-3 h-14 animate-pulse rounded-xl bg-surface-raised" />
          </div>
        )}

        {!loading && overrides.length === 0 && (
          <div className="surface-card p-10 text-center">
            <p className="text-3xl">🧹</p>
            <p className="mt-2 text-sm text-white/60">
              No slot overrides yet. Block a maintenance window or set a custom rate.
            </p>
          </div>
        )}

        {!loading &&
          overrides.map((override) => (
            <div
              key={override.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold">
                    {override.pitch?.name ?? "Pitch"}
                  </span>
                  <span
                    className={
                      override.isBlocked
                        ? "rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300 ring-1 ring-red-500/30"
                        : "rounded-full bg-neon/10 px-2 py-0.5 text-[10px] font-bold uppercase text-neon ring-1 ring-neon/40"
                    }
                  >
                    {override.isBlocked ? "Blocked" : "Rate override"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/70">
                  {formatDateShort(override.date)} ·{" "}
                  {formatHourRange(override.startTime, override.endTime)}
                  {override.isBlocked && override.reason && (
                    <span className="text-white/50"> · {override.reason}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {override.rateOverride != null && (
                  <span className="text-sm font-semibold text-neon">
                    ৳{override.rateOverride.toLocaleString()}/hr
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditing(override);
                    setModalOpen(true);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
      </div>

      <SlotBlockerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        pitches={pitches}
        initial={editing}
        onSaved={notify}
        onDeleted={() => setOverrides((prev) => prev.filter((item) => item.id !== editing?.id))}
      />
    </div>
  );
}