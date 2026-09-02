/**
 * Đồ đạc mở khoá theo cấp — SPEC.md §4.8: "Mỗi lần lên cấp = một món đồ mới trong phòng."
 * Hàm thuần: (danh mục đồ, cấp hiện tại mỗi chỉ số) → những món đã mở khoá.
 */

import type { StatKey } from "../types";

export type RoomItemCatalogEntry = {
  id: number;
  stat: StatKey;
  modelKey: string;
  unlockLevel: number;
};

/** Những món đã mở khoá — cấp hiện tại của chỉ số ≥ unlockLevel của món đó. Tụt cấp thì món biến mất (§4.1). */
export function unlockedRoomItems(
  catalog: readonly RoomItemCatalogEntry[],
  levelByStat: Readonly<Record<StatKey, number>>,
): RoomItemCatalogEntry[] {
  return catalog.filter((item) => levelByStat[item.stat] >= item.unlockLevel);
}
