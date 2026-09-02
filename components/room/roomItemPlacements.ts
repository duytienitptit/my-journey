/**
 * Vị trí đặt 12 món đồ mở khoá theo cấp trong phòng Chương 1 — tách riêng khỏi
 * `RoomShell.tsx` (đồ đạc CỐ ĐỊNH) vì tập này thay đổi theo cấp, không phải hằng số phòng.
 *
 * Toạ độ cùng hệ với RoomShell.tsx: X sang phải, Z đi vào trong phòng (âm), Y lên trên. Ba khu
 * vực trong phòng 3×3: góc học (Mind, quanh bàn/kệ sách hiện có), góc tập (Health, giữa-phải
 * phòng, khoảng trống trước đây chỉ có cây), góc nghỉ (Spirit, gần giường).
 *
 * Số liệu đặt MÙ theo bounding-box thật (đo bằng script, không đoán) rồi soi lại bằng mắt qua
 * trình duyệt — y hệt cách làm RoomShell.tsx ở mốc 1. Chỉnh ở đây nếu chồng lấn.
 */

import type { StatKey } from "@/core/types";

export type RoomItemPlacement = {
  modelKey: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

const FLOOR_TOP_Y = 0.05;

export const ROOM_ITEM_PLACEMENTS: Readonly<Record<StatKey, readonly RoomItemPlacement[]>> = {
  mind: [
    // Lv1 — trên mặt bàn, cạnh đèn.
    { modelKey: "books", position: [2.4, FLOOR_TOP_Y + 0.3844, -2.75], rotation: [0, 0, 0] },
    // Lv2 — đèn cây đứng cạnh kệ sách nhỏ có sẵn. Z kéo ra -2.65 (không phải -2.9, sát tường)
    // để không chồng vào bookcaseOpen (Lv3, x:0.75-1.15) — đo bbox thật thấy hai món này từng
    // đè lên nhau gần hết chiều cao khi cùng nằm sát tường (bắt gặp lúc soi phòng ở mốc 3).
    { modelKey: "lampSquareFloor", position: [0.65, FLOOR_TOP_Y, -2.65], rotation: [0, 0, 0] },
    // Lv3 — nối dài kệ sách nhỏ có sẵn (bookcaseOpenLow tại x≈0.25-0.65).
    { modelKey: "bookcaseOpen", position: [0.75, FLOOR_TOP_Y, -2.85], rotation: [0, 0, 0] },
    // Lv4 — "cả bức tường sách" (§4.8), đối diện góc học, không chạm bàn (bàn bắt đầu x≈1.88).
    { modelKey: "bookcaseClosedWide", position: [0.65, FLOOR_TOP_Y, -2.55], rotation: [0, -Math.PI / 2, 0] },
  ],
  health: [
    // Lv1 — thảm tập ở khoảng trống giữa-phải phòng.
    { modelKey: "rugRound", position: [2.1, FLOOR_TOP_Y + 0.001, -1.0], rotation: [0, 0, 0] },
    // Lv2 — ghế/bench nhỏ cạnh thảm.
    { modelKey: "bench", position: [2.65, FLOOR_TOP_Y, -1.2], rotation: [0, Math.PI / 2, 0] },
    // Lv3 — đệm sàn cạnh thảm.
    { modelKey: "pillowLong", position: [1.75, FLOOR_TOP_Y, -0.75], rotation: [0, Math.PI / 4, 0] },
    // Lv4 — cây nhỏ, sức sống.
    { modelKey: "plantSmall3", position: [2.85, FLOOR_TOP_Y, -1.5], rotation: [0, 0, 0] },
  ],
  // Bốn món dưới đây từng đặt quanh (1.5-1.75, -0.15) — "chân giường" đọc theo nghĩa đen — và
  // đè thẳng lên sideTable có sẵn (cũng ở đúng x≈1.75,z≈-0.15) lẫn lên nhau. Đo bbox thật
  // (script, không đoán) rồi xếp lại quanh MỘT dải trống thật sự: khoảng trống bên trái giường
  // (x:0-0.54, giữa tường trái và mép giường) cộng khoảng hở sau đầu giường trước
  // bookcaseClosedWide (z:-1.75~-1.23) — bắt gặp lúc soi phòng ở mốc 3.
  spirit: [
    // Lv1 — gối dài, vẫn ở khe hẹp giữa mép giường và sideTable (x:1.11-1.54) nhưng xoay dọc
    // theo Z để lọt vừa, không đè lên sideTable.
    { modelKey: "pillowBlueLong", position: [1.3, FLOOR_TOP_Y, -0.18], rotation: [0, Math.PI / 2, 0] },
    // Lv2 — "góc ngồi yên" (§5.3), chuyển sang dải trống bên trái giường (từng đè lên giường).
    { modelKey: "loungeChairRelax", position: [0.5, FLOOR_TOP_Y, -1.0], rotation: [0, Math.PI, 0] },
    // Lv3 — cây cạnh góc ngồi yên (đi theo Lv2 khi ghế dời chỗ, giữa ghế và gấu bông Lv4).
    { modelKey: "plantSmall2", position: [0.27, FLOOR_TOP_Y, -1.22], rotation: [0, 0, 0] },
    // Lv4 — gấu bông nhỏ, sau đầu giường (dải trống trước bookcaseClosedWide).
    { modelKey: "bear", position: [0.05, FLOOR_TOP_Y, -1.45], rotation: [0, 0, 0] },
  ],
};
