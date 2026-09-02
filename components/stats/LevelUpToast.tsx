"use client";

import { Confetti } from "@/components/timer/Confetti";
import type { StatKey } from "@/core/types";
import type { LevelUpNotice } from "./useComputedStats";

const STAT_LABEL: Record<StatKey, string> = { mind: "Mind", health: "Health", spirit: "Spirit" };
const STAT_EMOJI: Record<StatKey, string> = { mind: "📚", health: "💪", spirit: "🧘" };

/** Ăn mừng lên cấp — SPEC.md §4.8. Khoảnh khắc chuyển tiếp, không phải bảng số đứng yên (§5.7). */
export function LevelUpToast({ notice }: { notice: LevelUpNotice | null }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-28 flex justify-center">
        <Confetti active={notice !== null} />
      </div>
      {notice && (
        <div className="absolute left-1/2 top-28 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-lg">
          {STAT_EMOJI[notice.stat]} {STAT_LABEL[notice.stat]} leveled up — {notice.toLevel}
        </div>
      )}
    </>
  );
}
