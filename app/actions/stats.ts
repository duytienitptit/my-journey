"use server";

import { now } from "@/core/clock";
import { unlockedRoomItems, type RoomItemCatalogEntry } from "@/core/engine/room";
import { foldTimeline } from "@/core/engine/timeline";
import type { StreakInfo, StreakMilestoneEvent } from "@/core/engine/types";
import type { StatKey } from "@/core/types";
import { getEngineRawData, getRoomItemsCatalog } from "@/db/queries";

export type ComputedStats = {
  levelByStat: Record<StatKey, number>;
  stage: number;
  unlockedItems: RoomItemCatalogEntry[];
  /** Chuỗi ngày-đạt, tính TỚI HẾT HÔM QUA (§4.6/R5) — hiện ở góc màn chính (§5.1), mốc 4. */
  dayAchievedStreak: StreakInfo;
  /** TOÀN BỘ mốc chuỗi đã chạm từ trước tới giờ (cả ngày-đạt lẫn nhật ký), luôn tăng dần theo
   *  ngày — client tự so sánh độ dài mảng để phát hiện "vừa chạm mốc mới" (useComputedStats),
   *  y hệt cách phát hiện lên cấp. Không lưu XP nào ở đây (§8.1) — chỉ để hiện ăn mừng. */
  streakMilestoneEvents: readonly StreakMilestoneEvent[];
};

/**
 * Tính lại TOÀN BỘ từ bản ghi thô (§8.1) — không cache. Gọi sau bất kỳ hành động nào có thể
 * đổi XP (hoàn thành phiên, ghi bù, chấm thói quen, đóng ngày) để phát hiện lên/tụt cấp.
 */
export async function getComputedStatsAction(): Promise<ComputedStats> {
  const [raw, catalog] = await Promise.all([getEngineRawData(), getRoomItemsCatalog()]);
  const result = foldTimeline(raw, now());
  return {
    levelByStat: result.levelByStat,
    stage: result.stage,
    unlockedItems: unlockedRoomItems(catalog, result.levelByStat),
    dayAchievedStreak: result.dayAchievedStreak,
    streakMilestoneEvents: result.events.streakMilestones,
  };
}
