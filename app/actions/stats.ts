"use server";

import { now } from "@/core/clock";
import { unlockedRoomItems, type RoomItemCatalogEntry } from "@/core/engine/room";
import { foldTimeline } from "@/core/engine/timeline";
import type { StatKey } from "@/core/types";
import { getEngineRawData, getRoomItemsCatalog } from "@/db/queries";

export type ComputedStats = {
  levelByStat: Record<StatKey, number>;
  stage: number;
  unlockedItems: RoomItemCatalogEntry[];
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
  };
}
