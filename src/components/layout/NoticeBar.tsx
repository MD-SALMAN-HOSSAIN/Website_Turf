interface NoticeBarProps {
  text: string | null;
  enabled: boolean;
}

export default function NoticeBar({ text, enabled }: NoticeBarProps) {
  if (!enabled || !text) return null;

  return (
    <div className="overflow-hidden bg-neon text-charcoal">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-2">
        <span className="mr-3 flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-charcoal" />
        <div className="no-scrollbar flex-1 overflow-hidden whitespace-nowrap">
          <div className="animate-marquee inline-block font-semibold" style={{ paddingRight: "3rem" }}>
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}