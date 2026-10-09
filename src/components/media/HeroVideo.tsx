export default function HeroVideo() {
  return (
    <section className="relative overflow-hidden" aria-label="Facility video">
      <video
        className="h-[42vh] min-h-[240px] w-full object-cover sm:h-[52vh]"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/gallery/hero-poster.svg"
      >
        <source src="/videos/facility.mp4" type="video/mp4" />
        <source src="/videos/facility.webm" type="video/webm" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal/40 via-transparent to-charcoal" />
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-charcoal/70 px-4 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/15 backdrop-blur">
        Facility tour · mute on
      </div>
    </section>
  );
}
