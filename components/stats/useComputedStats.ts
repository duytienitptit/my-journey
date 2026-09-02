"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getComputedStatsAction, type ComputedStats } from "@/app/actions/stats";
import { STAT_KEYS, type StatKey } from "@/core/types";

export type LevelUpNotice = { stat: StatKey; fromLevel: number; toLevel: number };

const NOTICE_DURATION_MS = 4000;

/**
 * XP không lưu (§8.1) — không có "sự kiện lên cấp" nào tồn tại sẵn ở server để lắng nghe. Cách
 * duy nhất biết "mình VỪA lên cấp" là so sánh `levelByStat` MỚI với `levelByStat` mình biết
 * TRƯỚC ĐÓ (giữ trong state của phiên trình duyệt này) — gọi `refresh()` sau bất kỳ hành động
 * nào có thể đổi XP (xem DailyScreen.tsx: nối vào useSessionTimer + useEveningRitual).
 */
export function useComputedStats(initial: ComputedStats) {
  const [stats, setStats] = useState(initial);
  const [levelUpNotice, setLevelUpNotice] = useState<LevelUpNotice | null>(null);
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
      setStats(fresh);
    });
  }, []);

  useEffect(() => {
    if (!levelUpNotice) return;
    const timeout = window.setTimeout(() => setLevelUpNotice(null), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [levelUpNotice]);

  return { stats, refresh, levelUpNotice };
}
