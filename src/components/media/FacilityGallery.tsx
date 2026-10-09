import Image from "next/image";

const MEDIA: { src: string; alt: string; caption: string }[] = [
  {
    src: "/images/gallery/pool.svg",
    alt: "Swimming pool lanes",
    caption: "25m pool · 2-hour sessions",
  },
  {
    src: "/images/gallery/turf.svg",
    alt: "FIFA 7-a-side turf",
    caption: "FIFA-standard turf",
  },
  {
    src: "/images/gallery/floodlights.svg",
    alt: "Floodlit night play",
    caption: "Floodlights till late",
  },
  {
    src: "/images/gallery/changing.svg",
    alt: "Changing rooms and showers",
    caption: "Changing rooms & showers",
  },
  {
    src: "/images/gallery/reception.svg",
    alt: "Reception and lounge",
    caption: "Reception & lounge",
  },
  {
    src: "/images/gallery/parking.svg",
    alt: "Free parking area",
    caption: "Free parking",
  },
];

export default function FacilityGallery() {
  return (
    <section id="media" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <span className="inline-block rounded-full bg-neon/10 px-3 py-1 text-xs font-semibold text-neon ring-1 ring-neon/30">
        Media
      </span>
      <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
        Inside the facility
      </h2>
      <p className="mt-2 max-w-xl text-sm text-white/60">
        A look at the pool, the turf, and everything around it before you book
        your slot.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {MEDIA.map((item) => (
          <figure
            key={item.src}
            className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10"
          >
            <div className="relative aspect-video w-full">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-xs font-medium text-white">
              {item.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
