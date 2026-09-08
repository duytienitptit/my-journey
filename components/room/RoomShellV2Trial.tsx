"use client";

/**
 * THỬ NGHIỆM phong cách 3D chi tiết hơn — chủ dự án chê phòng hiện tại "trông đồ hoạ rất cũ...
 * các khối vuông vức", chọn hướng "tìm pack đồ hoạ khác chi tiết hơn" + "thử nhỏ trước" (một
 * vòng AskUserQuestion, xem CLAUDE.md). File này CHỈ thay đồ đạc của Chương 1 bằng pack
 * Quaternius (CC0, public/models/room-v2/, xem CREDITS.md) — tường/sàn/nhân vật GIỮ NGUYÊN,
 * đúng tinh thần "thử một phần trước khi làm cả 12 chương".
 *
 * Vị trí lấy THEO ĐÚNG anchor gốc ở `shells/zones.tsx` (SleepZone/DeskZone/BookcaseZone/
 * PlantZone/Rug cho Chương 1) — chỉ đổi offset/scale/rotation riêng cho từng model mới vì
 * pivot/tỉ lệ gốc của Quaternius khác hẳn Kenney (đo bằng mắt qua trình duyệt, không đoán).
 *
 * KHÔNG phải kiến trúc cuối cùng — nếu chủ dự án ưng, việc tiếp theo là sáp nhập vào
 * `zones.tsx`/`ROOM_MODEL_URLS` thật cho cả 12 chương, không phải giữ file thử nghiệm này mãi.
 */

import { GltfModel } from "./GltfModel";
import { ROOM_MODEL_URLS_V2_TRIAL } from "./models";

const FLOOR_TOP_Y = 0.05;

export function RoomShellV2TrialFurniture() {
  return (
    <group>
      {/* Giường đơn — góc trước-trái (0,0), giống SleepZone gốc. */}
      <GltfModel
        url={ROOM_MODEL_URLS_V2_TRIAL.bed}
        position={[0.75, FLOOR_TOP_Y, -0.85]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.34}
      />
      <GltfModel
        url={ROOM_MODEL_URLS_V2_TRIAL.sideTable}
        position={[1.7, FLOOR_TOP_Y, -0.25]}
        scale={0.4}
      />

      {/* Bàn học + ghế + đèn — góc sau-phải (3,-3), giống DeskZone gốc. */}
      <GltfModel
        url={ROOM_MODEL_URLS_V2_TRIAL.desk}
        position={[2.55, FLOOR_TOP_Y, -2.8]}
        rotation={[0, Math.PI, 0]}
        scale={0.42}
      />
      <GltfModel
        url={ROOM_MODEL_URLS_V2_TRIAL.chair}
        position={[2.35, FLOOR_TOP_Y, -2.25]}
        rotation={[0, Math.PI / 6, 0]}
        scale={0.4}
      />
      <GltfModel
        url={ROOM_MODEL_URLS_V2_TRIAL.lamp}
        position={[2.9, FLOOR_TOP_Y + 0.38, -2.55]}
        scale={0.3}
      />

      {/* Kệ sách — góc sau-trái (0,-3), giống BookcaseZone gốc. */}
      <GltfModel
        url={ROOM_MODEL_URLS_V2_TRIAL.bookcase}
        position={[0.55, FLOOR_TOP_Y, -2.75]}
        scale={0.35}
      />

      {/* Cây — góc trước-phải (3,0), giống PlantZone gốc. */}
      <GltfModel url={ROOM_MODEL_URLS_V2_TRIAL.plant} position={[2.7, FLOOR_TOP_Y, -0.3]} scale={0.4} />

      {/* Thảm — giữa phòng, giống Rug gốc (anchor [0.75,-2.1]). */}
      <GltfModel
        url={ROOM_MODEL_URLS_V2_TRIAL.rug}
        position={[1.4, FLOOR_TOP_Y + 0.005, -1.8]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.42}
      />
    </group>
  );
}
