import Link from "next/link";
import type { FooterData } from "@/types/settings";

export default function Footer({
  siteName,
  openingTime,
  closingTime,
  address,
  phone,
  emergencyPhone,
  email,
  mapsUrl,
}: FooterData) {
  const hours = `${openingTime} – ${closingTime}`;

  return (
    <footer className="border-t border-white/10 bg-charcoal-deep">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon text-charcoal">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M6 15V7.5l6 3.4L18 7.5V15l-6 3.4L6 15z" />
              </svg>
            </div>
            <span className="font-display text-lg font-bold">{siteName}</span>
          </div>
          <p className="mt-3 text-sm text-white/50">
            Premium pitches and a swimming pool for football and family
            sessions. Book online in seconds.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-neon">
            Operating hours
          </h3>
          <p className="mt-3 text-sm text-white/70">Open daily, {hours}</p>
          <p className="mt-1 text-sm text-white/70">Day · Evening · Night slots</p>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-neon">
            Visit us
          </h3>
          {address && <p className="mt-3 text-sm text-white/70">{address}</p>}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-neon hover:underline"
            >
              Get directions →
            </a>
          )}
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-neon">
            Contact
          </h3>
          {phone && (
            <p className="mt-3 text-sm text-white/70">
              Reservations:{" "}
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-neon">
                {phone}
              </a>
            </p>
          )}
          {emergencyPhone && (
            <p className="mt-1 text-sm text-white/70">
              Emergency:{" "}
              <a
                href={`tel:${emergencyPhone.replace(/\s/g, "")}`}
                className="hover:text-neon"
              >
                {emergencyPhone}
              </a>
            </p>
          )}
          {email && (
            <p className="mt-1 text-sm text-white/70">
              Email:{" "}
              <a href={`mailto:${email}`} className="hover:text-neon">
                {email}
              </a>
            </p>
          )}
          <Link
            href="/track"
            className="mt-2 inline-block text-sm font-medium text-neon hover:underline"
          >
            Track your booking →
          </Link>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>
      <div className="sr-only">{email}</div>
    </footer>
  );
}