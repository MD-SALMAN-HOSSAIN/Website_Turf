import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  siteName: string;
}

export default function Header({ siteName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-charcoal/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon text-charcoal shadow-glow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M6 15V7.5l6 3.4L18 7.5V15l-6 3.4L6 15z" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            {siteName}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 sm:flex">
          <a href="#book" className="transition hover:text-neon">
            Book a slot
          </a>
          <Link href="/track" className="transition hover:text-neon">
            Find my booking
          </Link>
          <Link href="/admin/dashboard" className="rounded-lg px-3 py-1.5 ring-1 ring-white/15 transition hover:text-neon">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <a
            href="#book"
            className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft sm:hidden"
          >
            Book
          </a>
          <a
            href="#book"
            className="hidden rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft sm:inline-block"
          >
            Book now
          </a>
        </div>
      </div>
    </header>
  );
}