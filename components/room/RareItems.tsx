"use client";

import { GltfModel } from "./GltfModel";
import { RARE_ITEM_MODEL_URLS } from "./models";
import type { ChapterFootprint } from "./shells/footprint";

export type ReceivedRareItemView = { itemKey: string };

type Props = {
  items: readonly ReceivedRareItemView[];
  footprint: ChapterFootprint;
};

// Một hàng nhỏ gần giữa-trước sàn — vùng này ít khả năng đã có đồ nội thất áp tường sẵn (đồ đạc
// trong RoomShell.tsx/roomItemPlacements.ts đa số áp SÁT TƯỜNG, tức Z rất âm hoặc X gần 0/mép).
// Tỉ lệ theo footprint (không phải toạ độ tuyệt đối) để không tràn ra ngoài phòng nhỏ (Chương 1).
const SLOT_FRACTIONS: readonly [number, number][] = [
  [0.45, 0.18],
  [0.58, 0.14],
  [0.7, 0.18],
];

// Cube Pets (public/CREDITS.md) dựng ở tỉ lệ RIÊNG của pack đó — to hơn hẳn Furniture Kit/Mini
// Characters đang dùng cho phần còn lại của phòng (đo bằng mắt: một con mèo cỡ NGUYÊN BẢN cao
// gần gấp đôi nhân vật). Co lại để trông như một con thú cưng thật đứng cạnh người, không phải
// quái vật.
const RARE_ITEM_SCALE = 0.28;

// Cùng mốc sàn với mọi đồ đạc khác (roomItemPlacements.ts, shells/zones.tsx) — sàn có độ dày,
// mặt trên ở y=0.05, không phải y=0.
const FLOOR_TOP_Y = 0.05;

/**
 * Vật phẩm hiếm đã nhận — SPEC.md §5.3, mốc 8b. Cộng dồn (không bao giờ mất, khác đồ mở khoá
 * theo cấp ở RoomItems.tsx vốn có thể biến mất khi tụt cấp) — "chỉ đến", không ai lấy lại được.
 */
export function RareItems({ items, footprint }: Props) {
  if (items.length === 0) return null;
  return (
    <group>
      {items.map((item, i) => {
        const url = RARE_ITEM_MODEL_URLS[item.itemKey];
        if (!url) return null; // item_key lạ trong DB — bỏ qua, không crash
        const [fx, fz] = SLOT_FRACTIONS[i % SLOT_FRACTIONS.length];
        return (
          <GltfModel
            key={`${item.itemKey}-${i}`}
            url={url}
            position={[footprint.interiorWidth * fx, FLOOR_TOP_Y, -footprint.interiorDepth * fz]}
            scale={RARE_ITEM_SCALE}
          />
        );
      })}
    </group>
  );
}
