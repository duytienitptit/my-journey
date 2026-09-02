"use client";

import { GltfModel } from "./GltfModel";
import { ROOM_ITEM_MODEL_URLS } from "./models";
import { ROOM_ITEM_PLACEMENTS } from "./roomItemPlacements";
import type { StatKey } from "@/core/types";

export type UnlockedRoomItem = { id: number; stat: StatKey; modelKey: string };

type Props = {
  items: readonly UnlockedRoomItem[];
};

/**
 * Đồ đạc mở khoá theo cấp (SPEC.md §4.8) — khác `RoomShell.tsx` (đồ CỐ ĐỊNH của Chương 1), tập
 * này đổi theo `levelByStat` mỗi lần đọc lại, kể cả BIẾN MẤT khi tụt cấp (§4.1).
 */
export function RoomItems({ items }: Props) {
  return (
    <group>
      {items.map((item) => {
        const url = ROOM_ITEM_MODEL_URLS[item.modelKey];
        const placement = ROOM_ITEM_PLACEMENTS[item.stat].find((p) => p.modelKey === item.modelKey);
        if (!url || !placement) return null; // dữ liệu DB không khớp registry cục bộ — bỏ qua, không crash
        return (
          <GltfModel
            key={item.id}
            url={url}
            position={placement.position}
            rotation={placement.rotation}
          />
        );
      })}
    </group>
  );
}
