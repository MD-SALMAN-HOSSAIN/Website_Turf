"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PitchSelector from "@/components/booking/PitchSelector";
import DateStripPicker from "@/components/booking/DateStripPicker";
import SlotGrid from "@/components/booking/SlotGrid";
import FloatingBookingBar from "@/components/booking/FloatingBookingBar";
import BookingModal from "@/components/booking/BookingModal";
import { addDaysIso, todayIso } from "@/lib/utils";
import type { AvailabilityResponse, TimeSlot } from "@/types/booking";

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [date, setDate] = useState(todayIso());
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selected, setSelected] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadAvailability = useCallback(async (dateKey: string, slug?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date: dateKey });
      if (slug) params.set("pitch", slug);
      const response = await fetch(`/api/slots/availability?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Could not load slots.");
      }
      setData(json as AvailabilityResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load slots.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailability(date, selectedSlug ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, selectedSlug]);

  useEffect(() => {
    setSelected([]);
    setModalOpen(false);
  }, [date, data?.pitch.id]);

  const dates = useMemo(
    () => Array.from({ length: 8 }, (_, index) => addDaysIso(todayIso(), index)),
    []
  );

  const selectedPitch = data?.pitches.find((pitch) => pitch.slug === selectedSlug) ?? data?.pitch ?? null;
  const total = useMemo(() => selected.reduce((sum, slot) => sum + slot.price, 0), [selected]);

  const toggleSlot = useCallback((slot: TimeSlot) => {
    setSelected((prev) => {
      const exists = prev.some((item) => item.id === slot.id);
      if (exists) return prev.filter((item) => item.id !== slot.id);
      return [...prev, slot].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
  }, []);

  const handleSuccess = useCallback(
    (code: string) => {
      router.push(`/booking/success?code=${code}`);
    },
    [router]
  );

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-neon/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 text-center sm:pt-20">
          <span className="inline-block rounded-full bg-neon/10 px-3 py-1 text-xs font-semibold text-neon ring-1 ring-neon/30">
            {date === todayIso() ? "Slots open today" : "Book in under a minute"}
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Book your pitch.
            <br />
            <span className="text-glow text-neon">Play your game.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
            {data?.pitch.name ?? "TurfHub"} — FIFA 7-a-side, futsal, and box
            cricket arenas with floodlights, changing rooms, and free parking.
            Reserve a slot in seconds.
          </p>
          <div className="mt-6 flex justify-center gap-8 text-sm">
            <div>
              <p className="font-display text-lg font-bold text-neon">3</p>
              <p className="text-xs text-white/50">Pitches</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="font-display text-lg font-bold text-neon">24/7</p>
              <p className="text-xs text-white/50">Floodlights</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="font-display text-lg font-bold text-neon">Free</p>
              <p className="text-xs text-white/50">Parking & water</p>
            </div>
          </div>
        </div>
      </section>

      <section id="book" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-36 pt-4">
        <div className="space-y-12">
          <PitchSelector
            pitches={data?.pitches ?? []}
            selectedSlug={data?.pitch.slug ?? ""}
            onSelect={(slug) => {
              setSelectedSlug(slug);
              setSelected([]);
            }}
          />
          <DateStripPicker dates={dates} selectedDate={date} onSelect={setDate} />
          <SlotGrid
            periods={data?.periods ?? []}
            selected={selected}
            onToggle={toggleSlot}
            loading={loading}
            error={error}
          />
        </div>
      </section>

      {selected.length > 0 && (
        <FloatingBookingBar
          pitchName={data?.pitch.name ?? ""}
          date={date}
          slots={selected}
          onClear={() => setSelected([])}
          onBook={() => setModalOpen(true)}
        />
      )}

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pitch={selectedPitch}
        date={date}
        slots={selected}
        total={total}
        onSuccess={handleSuccess}
      />
    </>
  );
}