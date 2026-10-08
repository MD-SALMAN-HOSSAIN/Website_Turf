"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { SiteConfig } from "@/types/settings";

interface SettingsFormProps {
  onSaved?: (message: string) => void;
}

export default function SettingsForm({ onSaved }: SettingsFormProps) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load settings.");
        return response.json() as Promise<{ config: SiteConfig }>;
      })
      .then((json) => setConfig(json.config))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed."))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await response.json();
      if (!response.ok) {
        setError((json as { error?: string }).error ?? "Could not save settings.");
        return;
      }
      setConfig((json as { config: SiteConfig }).config);
      onSaved?.("Settings saved.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-xl bg-surface-raised" />
        ))}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="surface-card p-8 text-center text-sm text-red-300">{error}</div>
    );
  }

  const textClass =
    "w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Website name
          </label>
          <input
            type="text"
            value={config.siteName}
            onChange={(event) => update("siteName", event.target.value)}
            className={textClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Tagline
          </label>
          <input
            type="text"
            value={config.tagline ?? ""}
            onChange={(event) => update("tagline", event.target.value)}
            className={textClass}
          />
        </div>
      </div>

      <div className="surface-card p-5">
        <h3 className="font-display text-sm font-semibold">Notice bar</h3>
        <label className="mt-3 flex items-center justify-between gap-4">
          <span className="text-sm text-white/70">Show announcement ticker</span>
          <input
            type="checkbox"
            checked={config.noticeEnabled}
            onChange={(event) => update("noticeEnabled", event.target.checked)}
            className="h-4 w-4 accent-neon"
          />
        </label>
        <textarea
          value={config.noticeText ?? ""}
          onChange={(event) => update("noticeText", event.target.value)}
          rows={2}
          placeholder="e.g. Night slots open till 11 PM…"
          className={textClass + " mt-3 resize-none"}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
          Address
        </label>
        <input
          type="text"
          value={config.address ?? ""}
          onChange={(event) => update("address", event.target.value)}
          className={textClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Phone
          </label>
          <input
            type="text"
            value={config.phone ?? ""}
            onChange={(event) => update("phone", event.target.value)}
            className={textClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Emergency phone
          </label>
          <input
            type="text"
            value={config.emergencyPhone ?? ""}
            onChange={(event) => update("emergencyPhone", event.target.value)}
            className={textClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Email
          </label>
          <input
            type="email"
            value={config.email ?? ""}
            onChange={(event) => update("email", event.target.value)}
            className={textClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Maps link
          </label>
          <input
            type="url"
            value={config.mapsUrl ?? ""}
            onChange={(event) => update("mapsUrl", event.target.value)}
            className={textClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Opening time
          </label>
          <input
            type="time"
            value={config.openingTime}
            onChange={(event) => update("openingTime", event.target.value)}
            className={textClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
            Closing time
          </label>
          <input
            type="time"
            value={config.closingTime}
            onChange={(event) => update("closingTime", event.target.value)}
            className={textClass}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-neon px-6 py-2.5 font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}