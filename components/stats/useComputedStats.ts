"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getComputedStatsAction, type ComputedStats } from "@/app/actions/stats";
import type { StreakMilestoneEvent } from "@/core/engine/types";
import { STAT_KEYS, type StatKey } from "@/core/types";

export type LevelUpNotice = { stat: StatKey; fromLevel: number; toLevel: number };

const NOTICE_DURATION_MS = 4000;

/**
 * XP không lưu (§8.1) — không có "sự kiện lên cấp"/"chạm mốc chuỗi" nào tồn tại sẵn ở server để
 * lắng nghe. Cách duy nhất biết "mình VỪA lên cấp / VỪA chạm mốc" là so sánh kết quả MỚI với
 * kết quả mình biết TRƯỚC ĐÓ (giữ trong state của phiên trình duyệt này) — gọi `refresh()` sau
 * bất kỳ hành động nào có thể đổi XP (xem DailyScreen.tsx: nối vào useSessionTimer +
 * useEveningRitual).
 */
export function useComputedStats(initial: ComputedStats) {
  const [stats, setStats] = useState(initial);
  const [levelUpNotice, setLevelUpNotice] = useState<LevelUpNotice | null>(null);
  const [streakMilestoneNotice, setStreakMilestoneNotice] = useState<StreakMilestoneEvent | null>(null);
  // Độ dài chuỗi NGAY TRƯỚC KHI gãy thật — chỉ set lúc current chuyển từ >0 thẳng xuống 0 (gãy
  // thật, không phải "vào nguy hiểm": current GIỮ NGUYÊN lúc vào nguy hiểm, chỉ về 0 khi ngày
  // cứu cũng hỏng — xem core/engine/streaks.ts#advanceDayAchievedStreak). Không cần xét `danger`
  // riêng ở đây vì current chỉ có thể về 0 đúng lúc gãy thật, không có đường nào khác.
  const [streakBrokenNotice, setStreakBrokenNotice] = useState<number | null>(null);
  // Ref chỉ đọc TRONG callback (refresh, sau khi async resolve) — không đọc/ghi lúc render, nên
  // đồng bộ qua effect (chạy sau commit), không phải gán thẳng trong thân hàm (react-hooks/refs).
  const statsRef = useRef(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const refresh = useCallback(() => {
    void getComputedStatsAction().then((fresh) => {
      const prev = statsRef.current;
      for (const stat of STAT_KEYS) {
        if (fresh.levelByStat[stat] > prev.levelByStat[stat]) {
          // Ăn mừng lên cấp (SPEC.md §4.8) — chỉ một thông báo mỗi lần refresh; nếu nhiều chỉ
          // số cùng lên cấp một lúc (hiếm, ví dụ ghi bù nhiều phiên cùng lúc), ưu tiên cái đầu.
          setLevelUpNotice({ stat, fromLevel: prev.levelByStat[stat], toLevel: fresh.levelByStat[stat] });
          break;
        }
      }
      // Ăn mừng mốc chuỗi (SPEC.md §4.6, mốc 4) — mảng streakMilestoneEvents chỉ TĂNG DẦN, phần
      // tử mới luôn nối vào CUỐI theo đúng thứ tự ngày mà foldTimeline duyệt qua (xem
      // timeline.ts) — không cần so khớp từng phần tử, chỉ cần cắt từ độ dài mảng CŨ trở đi.
      const newMilestones = fresh.streakMilestoneEvents.slice(prev.streakMilestoneEvents.length);
      if (newMilestones.length > 0) setStreakMilestoneNotice(newMilestones[0]);
      // Gãy chuỗi THẬT (SPEC.md §4.12/R3, [CHỐT — 2026-09-04], câu chữ đã chủ dự án duyệt) —
      // chỉ báo khi current thật sự về 0 từ >0, không báo lúc chỉ mới "vào nguy hiểm" (current
      // vẫn giữ nguyên lúc đó, xem StreakBrokenToast.tsx).
      if (prev.dayAchievedStreak.current > 0 && fresh.dayAchievedStreak.current === 0) {
        setStreakBrokenNotice(prev.dayAchievedStreak.current);
      }
      setStats(fresh);
    });
  }, []);

  useEffect(() => {
    if (!levelUpNotice) return;
    const timeout = window.setTimeout(() => setLevelUpNotice(null), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [levelUpNotice]);

  useEffect(() => {
    if (!streakMilestoneNotice) return;
    const timeout = window.setTimeout(() => setStreakMilestoneNotice(null), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [streakMilestoneNotice]);

  useEffect(() => {
    if (streakBrokenNotice === null) return;
    const timeout = window.setTimeout(() => setStreakBrokenNotice(null), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [streakBrokenNotice]);

  return { stats, refresh, levelUpNotice, streakMilestoneNotice, streakBrokenNotice };
}
