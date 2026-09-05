import type { ChapterCardView } from "@/app/actions/library";

function formatVnd(n: number): string {
  return `${n.toLocaleString("en-US")} ₫`;
}

function formatDayKeyLong(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Một khung trong hành lang — SPEC.md §5.4: hình hài cuối chương, nhà, tổng phiên, ngày chạm
 *  chương, mốc tài sản cao nhất, những dòng đã viết. */
export function ChapterCard({ card }: { card: ChapterCardView }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/40">
            Chapter {card.chapter}
          </p>
          <h2 className="text-lg font-bold text-foreground">{card.name}</h2>
        </div>
        {card.isCurrent && (
          <span className="shrink-0 rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground/70">
            Current
          </span>
        )}
      </div>

      <p className="text-sm text-foreground/50">Reached {formatDayKeyLong(card.reachedAtDayKey)}</p>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-foreground/70">
        <span>{card.stageLabel}</span>
        <span>
          {card.totalSessions} session{card.totalSessions === 1 ? "" : "s"}
        </span>
        {card.peakNetWorthVnd !== null && <span>Peak: {formatVnd(card.peakNetWorthVnd)}</span>}
      </div>

      {card.journalExcerpts.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-foreground/10 pt-3">
          {card.journalExcerpts.map((text, i) => (
            <blockquote key={i} className="text-sm italic text-foreground/60 line-clamp-2">
              {text}
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}
