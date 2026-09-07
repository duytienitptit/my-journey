"use client";

import type { StatKey } from "@/core/types";

/** Tên/emoji hiển thị cho ba chỉ số — mỗi màn tự có bản nhỏ này (đúng quy ước đã có ở
 *  components/week/StatBars.tsx và components/stats/MonthlyTrend.tsx), không có bảng dùng chung. */
export const STAT_META: Record<StatKey, { name: string; emoji: string }> = {
  mind: { name: "Mind", emoji: "📚" },
  health: { name: "Health", emoji: "💪" },
  spirit: { name: "Spirit", emoji: "🧘" },
};

const STATS: readonly StatKey[] = ["mind", "health", "spirit"];

/** Chọn một trong ba chỉ số — dùng chung cho form Nhãn và Thói quen (SPEC.md §4.2: "bắt buộc
 *  gắn với đúng một chỉ số"). */
export function StatPicker({ value, onChange }: { value: StatKey; onChange: (s: StatKey) => void }) {
  return (
    <div className="flex gap-1.5">
      {STATS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors ${
            value === s ? "bg-foreground text-background" : "bg-surface-muted text-foreground/60"
          }`}
        >
          {STAT_META[s].emoji} {STAT_META[s].name}
        </button>
      ))}
    </div>
  );
}
