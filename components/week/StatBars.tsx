import { STAT_KEYS, type StatKey } from "@/core/types";

const STAT_LABEL: Record<StatKey, { emoji: string; name: string }> = {
  mind: { emoji: "📚", name: "Mind" },
  health: { emoji: "💪", name: "Health" },
  spirit: { emoji: "🧘", name: "Spirit" },
};

/** Ba thanh theo chỉ số — SPEC.md §5.2 ("để tôi thấy ngay mảng nào bị bỏ bê"). */
export function StatBars({ countByStat }: { countByStat: Record<StatKey, number> }) {
  const max = Math.max(1, ...STAT_KEYS.map((s) => countByStat[s]));
  return (
    <div className="flex items-end justify-center gap-6 px-2 pt-2">
      {STAT_KEYS.map((stat) => {
        const count = countByStat[stat];
        const heightPct = Math.max(6, (count / max) * 100);
        return (
          <div key={stat} className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground/70">{count}</span>
            <div className="flex h-28 w-10 items-end rounded-full bg-surface-muted">
              <div
                className="w-full rounded-full bg-foreground/70 transition-all"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-lg">{STAT_LABEL[stat].emoji}</span>
            <span className="text-xs font-medium text-foreground/50">{STAT_LABEL[stat].name}</span>
          </div>
        );
      })}
    </div>
  );
}
