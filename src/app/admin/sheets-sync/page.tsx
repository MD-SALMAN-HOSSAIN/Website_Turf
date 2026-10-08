"use client";

import { useEffect, useState } from "react";
import { todayIso } from "@/lib/utils";

interface SyncHealth {
  configured: boolean;
  sheetId: string | null;
  serviceAccount: string | null;
  totalBookings: number;
  bookingsLast24h: number;
}

export default function AdminSheetsSyncPage() {
  const [health, setHealth] = useState<SyncHealth | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/sync/sheets")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not read sync status.");
        return response.json() as Promise<SyncHealth>;
      })
      .then(setHealth)
      .catch(() => {
        setMessage?.(() => ({ type: "error", text: "Could not read sync status." }));
      });
  }, []);

  async function run(mode: "batch" | "incremental" | "export") {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/sync/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: json.error ?? "Sync failed." });
        return;
      }
      if (mode === "export") {
        const blob = new Blob([json.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `turfhub-bookings-${todayIso()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setMessage({ type: "ok", text: `Exported ${json.count} bookings as CSV.` });
        return;
      }
      setMessage({
        type: "ok",
        text:
          mode === "batch"
            ? `Batch push complete — ${json.appended} bookings appended to Google Sheets.`
            : `Incremental push complete — ${json.appended} recent bookings appended.`,
      });
    } catch {
      setMessage({ type: "error", text: "Network error during sync." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Google Sheets sync</h1>
        <p className="mt-1 text-sm text-white/50">
          Push bookings to your spreadsheet for reporting and record-keeping.
        </p>
      </div>

      {!health ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-surface-raised" />
          <div className="h-24 animate-pulse rounded-xl bg-surface-raised" />
        </div>
      ) : (
        <>
          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Connection health</h3>
              <span
                className={
                  health.configured
                    ? "rounded-full bg-neon/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-neon ring-1 ring-neon/40"
                    : "rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-300 ring-1 ring-red-500/30"
                }
              >
                {health.configured ? "Configured" : "Not configured"}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Spreadsheet ID</dt>
                <dd className="font-mono text-xs text-white/80">
                  {health.sheetId ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Service account</dt>
                <dd className="font-mono text-xs text-white/80">
                  {health.serviceAccount ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Total bookings</dt>
                <dd className="font-medium">{health.totalBookings}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Bookings last 24h</dt>
                <dd className="font-medium">{health.bookingsLast24h}</dd>
              </div>
            </dl>
            {!health.configured && (
              <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY
                in your .env file to enable live sync to Google Sheets.
              </p>
            )}
          </div>

          <div className="surface-card p-5">
            <h3 className="font-display text-sm font-semibold">Push to spreadsheet</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !health.configured}
                onClick={() => run("incremental")}
                className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                Push last 24h
              </button>
              <button
                type="button"
                disabled={busy || !health.configured}
                onClick={() => run("batch")}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/15 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Full batch push
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run("export")}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/15 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
            {busy && (
              <p className="mt-3 text-xs text-white/50">Working… folders in progress</p>
            )}
          </div>

          {message && (
            <div
              className={
                message.type === "ok"
                  ? "rounded-xl bg-neon/10 px-4 py-3 text-sm text-neon ring-1 ring-neon/40"
                  : "rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30"
              }
            >
              {message.text}
            </div>
          )}
        </>
      )}
    </div>
  );
}