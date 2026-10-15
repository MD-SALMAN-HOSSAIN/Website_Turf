"use client";

import { useSiteConfig } from "@/components/layout/SiteConfigProvider";

function videoType(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".ogg") || clean.endsWith(".ogv")) return "video/ogg";
  return "video/mp4";
}

export default function HeroVideo() {
  const { heroVideoUrl } = useSiteConfig();
  const src = heroVideoUrl || "/videos/facility.mp4";

  return (
    <section className="relative overflow-hidden" aria-label="Facility video">
      <video
        key={src}
        className="h-[42vh] min-h-[550px] w-full object-cover sm:h-[52vh]"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/gallery/hero-poster.svg"
      >
        <source src={src} type={videoType(src)} />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal/40 via-transparent to-charcoal" />
      
    </section>
  );
}
