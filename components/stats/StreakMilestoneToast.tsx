"use client";

import { Confetti } from "@/components/timer/Confetti";
import type { StreakMilestoneEvent } from "@/core/engine/types";

const KIND_LABEL: Record<StreakMilestoneEvent["kind"], string> = {
  dayAchieved: "day streak",
  journal: "day journal streak",
};
const KIND_EMOJI: Record<StreakMilestoneEvent["kind"], string> = { dayAchieved: "🔥", journal: "📔" };

/**
 * Ăn mừng chạm mốc chuỗi (SPEC.md §4.6, mốc 4) — CHỈ số + tính từ, không phải câu chữ trách móc
 * (§4.12/R3 còn chờ chủ dự án duyệt riêng, tách khỏi phần này). Cùng cơ chế Confetti với
 * LevelUpToast.tsx, đặt thấp hơn một chút để không đè lên nhau nếu cả hai cùng xảy ra một lúc
 * (hiếm nhưng có thể — ví dụ ghi bù nhiều ngày cùng lúc vừa lên cấp vừa chạm mốc chuỗi).
 */
export function StreakMilestoneToast({ notice }: { notice: StreakMilestoneEvent | null }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-44 flex justify-center">
        <Confetti active={notice !== null} />
      </div>
      {notice && (
        <div className="absolute left-1/2 top-44 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-lg">
          {KIND_EMOJI[notice.kind]} {notice.milestone}-{KIND_LABEL[notice.kind]}
        </div>
      )}
    </>
  );
}
