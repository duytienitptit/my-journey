"use client";

import type { SeasonKey } from "@/core/engine/seasons";
import { GltfModel } from "./GltfModel";
import { GARDEN_MODEL_URLS, SEASONAL_MODEL_URLS } from "./models";
import type { ChapterFootprint } from "./shells/footprint";

type Props = {
  season: SeasonKey;
  footprint: ChapterFootprint;
};

// Cùng mốc sàn với mọi đồ đạc khác trong phòng (roomItemPlacements.ts, shells/zones.tsx) — sàn
// THẬT có độ dày, mặt trên nằm ở y=0.05 chứ không phải y=0. Bỏ qua bước này làm hoa Tết (model
// gốc đã có translation nội bộ y=-0.05, xem public/models/garden) chìm gần hết vào sàn, gần như
// vô hình — bắt gặp lúc soi bằng mắt (cây Giáng sinh vẫn thấy được vì đủ cao để phần chìm không
// đáng kể, nhưng hoa nhỏ thì mất hẳn).
const FLOOR_TOP_Y = 0.05;

// Nature Kit dựng hoa ở tỉ lệ THẬT NHỎ (rải làm cỏ/hoa dại ngoài sân, §4.9 mốc 5) — phóng to lên
// thành một chậu/cụm hoa thấy rõ trong nhà, không phải chấm li ti gần như vô hình ở khoảng cách
// camera phòng thường đứng (bắt gặp lúc soi bằng mắt: scale=1 gần như không thấy gì).
const TET_FLOWER_SCALE = 2.5;

/**
 * Mùa thật + ngày lễ — SPEC.md §5.3, mốc 8b. Chỉ Tết và Giáng sinh có VẬT THỂ riêng (nắng
 * hè/mùa mưa chỉ đổi tông màu ánh sáng, xem RoomScene.tsx#SceneAtmosphere) — đặt gần góc-trước
 * bên trái sàn, đối xứng với vị trí vật phẩm hiếm (RareItems.tsx ở giữa-trước, nhân vật ở
 * góc-sau-phải) để không chồng lấn ba nhóm này lên nhau.
 */
export function SeasonalDecor({ season, footprint }: Props) {
  const position: [number, number, number] = [
    footprint.interiorWidth * 0.35,
    FLOOR_TOP_Y,
    -footprint.interiorDepth * 0.35,
  ];

  if (season === "christmas") {
    return <GltfModel url={SEASONAL_MODEL_URLS.christmasTree} position={position} />;
  }

  if (season === "tet") {
    // Không có asset Tết thật (lồng đèn/hoa mai/hoa đào) trong pack CC0 nào tìm được — dùng lại
    // hoa vàng/đỏ có sẵn từ Nature Kit (mốc 5, GARDEN_MODEL_URLS) gợi hoa mai/hoa đào, cắm
    // "trong nhà" ở vị trí này thay vì ngoài sân. Xem public/CREDITS.md.
    return (
      <group position={position}>
        <GltfModel url={GARDEN_MODEL_URLS.flowerYellow} position={[0, 0, 0]} scale={TET_FLOWER_SCALE} />
        <GltfModel url={GARDEN_MODEL_URLS.flowerRed} position={[0.18, 0, 0.09]} scale={TET_FLOWER_SCALE} />
      </group>
    );
  }

  return null;
}
