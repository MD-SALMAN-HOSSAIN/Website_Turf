"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MediaManager() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [order, setOrder] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/media");
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not load media.");
      }
      setMedia((json.media ?? []) as MediaItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load media.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function notify(message: string) {
    setToast(message);
    load();
    setTimeout(() => setToast(null), 3000);
  }

  async function uploadImage() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch("/api/admin/upload?folder=media", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error((uploadJson as { error?: string }).error ?? "Upload failed.");
      }
      const url = (uploadJson as { url: string }).url;
      const createResponse = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          alt,
          caption,
          order,
          active: true,
        }),
      });
      const createJson = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error((createJson as { error?: string }).error ?? "Could not save media.");
      }
      setFile(null);
      setAlt("");
      setCaption("");
      setOrder(media.length);
      notify("Image uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(item: MediaItem) {
    try {
      const response = await fetch("/api/admin/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not update.");
      }
      notify(item.active ? "Image hidden." : "Image is now visible.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function remove(item: MediaItem) {
    if (!window.confirm("Delete this image permanently?")) return;
    try {
      const response = await fetch(`/api/admin/media?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not delete.");
      }
      notify("Image deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  async function updateOrder(item: MediaItem, newOrder: number) {
    try {
      const response = await fetch("/api/admin/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, order: newOrder }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not reorder.");
      }
      notify("Order updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reorder.");
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="surface-card p-4">
        <h2 className="font-display text-lg font-semibold">Add new picture</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm text-white/70">
              Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-neon file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-charcoal hover:file:bg-neon-soft"
              />
            </label>
            {preview && (
              <div className="relative h-40 w-full overflow-hidden rounded-xl ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <label className="block text-sm text-white/70">
              Alt text
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="e.g. Swimming pool"
                className="mt-1 block w-full rounded-xl bg-transparent px-3 py-2 text-sm ring-1 ring-white/15 focus:outline-none focus:ring-neon/40"
              />
            </label>
            <label className="block text-sm text-white/70">
              Caption
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. 25m pool · 2-hour sessions"
                className="mt-1 block w-full rounded-xl bg-transparent px-3 py-2 text-sm ring-1 ring-white/15 focus:outline-none focus:ring-neon/40"
              />
            </label>
            <label className="block text-sm text-white/70">
              Order
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full rounded-xl bg-transparent px-3 py-2 text-sm ring-1 ring-white/15 focus:outline-none focus:ring-neon/40"
              />
            </label>
            <button
              type="button"
              disabled={uploading || !file}
              onClick={uploadImage}
              className="rounded-xl bg-neon px-4 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload & Add"}
            </button>
          </div>
        </div>
      </div>

      <div className="surface-card p-4">
        <h2 className="font-display text-lg font-semibold">Media library</h2>
        {loading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-raised" />
            ))}
          </div>
        ) : media.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">No media items yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {media.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                <div className="relative aspect-video w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.alt || ""}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-2">
                  {item.caption && (
                    <p className="text-xs text-white/80">{item.caption}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-white/60">
                      Order
                      <input
                        type="number"
                        defaultValue={item.order}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val !== item.order) {
                            updateOrder(item, val);
                          }
                        }}
                        className="w-16 rounded bg-transparent px-1 py-0.5 text-xs ring-1 ring-white/15"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleActive(item)}
                      className={cn(
                        "ml-auto rounded-lg px-2 py-0.5 text-xs font-medium ring-1 transition",
                        item.active
                          ? "text-white/70 ring-white/15 hover:text-white"
                          : "text-neon ring-neon/40 hover:bg-neon/10"
                      )}
                    >
                      {item.active ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="rounded-lg px-2 py-0.5 text-xs font-medium text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}