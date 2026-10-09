"use client";

import { useState } from "react";
import Image from "next/image";
import type { Pitch } from "@/types/booking";
import { cn, formatBdt } from "@/lib/utils";

interface PitchSelectorProps {
  pitches: Pitch[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}

export default function PitchSelector({
  pitches,
  selectedSlug,
  onSelect,
}: PitchSelectorProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">Pick a pitch</h2>
        <span className="text-sm text-white/50">{pitches.length} arenas available</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {pitches.map((pitch) => {
          const active = pitch.slug === selectedSlug;
          const imageFailed = failedImages.has(pitch.slug);
          return (
            <button
              key={pitch.id}
              type="button"
              onClick={() => onSelect(pitch.slug)}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-surface text-left ring-1 transition-all duration-200",
                active
                  ? "ring-2 ring-neon shadow-glow"
                  : "ring-white/10 hover:ring-neon/50 hover:-translate-y-0.5"
              )}
            >
              <div className="relative h-32 w-full overflow-hidden bg-surface-raised">
                {pitch.imageUrl && !imageFailed ? (
                  <Image
                    src={pitch.imageUrl}
                    alt={pitch.name}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                    onError={() =>
                      setFailedImages((prev) => new Set(prev).add(pitch.slug))
                    }
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon/20 via-surface-raised to-surface-raised">
                    <span className="text-4xl">
                      {pitch.sport === "Football"
                        ? "⚽"
                        : pitch.sport === "Swimming"
                          ? "🏊"
                          : "🏟️"}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
                {active && (
                  <span className="absolute left-3 top-3 rounded-full bg-neon px-2.5 py-0.5 text-xs font-bold text-charcoal">
                    Selected
                  </span>
                )}
                <span className="absolute bottom-3 left-3 rounded-lg bg-charcoal/80 px-2 py-0.5 text-xs font-semibold text-neon">
                  {pitch.sport.toUpperCase()}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-semibold">{pitch.name}</h3>
                  <span className="shrink-0 font-display text-base font-bold text-neon">
                    {formatBdt(pitch.ratePerHour)}
                    <span className="text-xs font-medium text-white/50">/hr</span>
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/50">{pitch.dimensions}</p>
                {pitch.description && (
                  <p className="mt-2 text-xs leading-relaxed text-white/60">
                    {pitch.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}