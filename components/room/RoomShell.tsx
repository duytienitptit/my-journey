"use client";

import { GltfModel } from "./GltfModel";
import { ROOM_MODEL_URLS } from "./models";

/**
 * Bố cục Chương 1 — "Phòng trọ nhỏ" (SPEC.md §4.9). Phòng 3×3 đơn vị, mở hai mặt (không tường
 * trước/phải, không trần) để camera luôn nhìn được vào trong — kiểu diorama, không phải hộp kín.
 *
 * Toạ độ: X sang phải, Z đi vào trong phòng (âm), Y lên trên. Góc phòng ở (0,0,0); tường sau ở
 * Z=-3, tường trái ở X=0. Mặt sàn (floorFull) có bề dày 0.05 nên mặt trên ở Y=0.05 — mọi đồ vật
 * đặt trên sàn dùng `FLOOR_TOP_Y`, không phải 0, kẻo lún nửa khối vào sàn.
 *
 * Các số dưới đây đến từ bounding-box thật của từng model (đo bằng script, không đoán) — xem
 * ghi chú cạnh mỗi món. Vẫn cần soi bằng mắt qua trình duyệt sau khi dựng — hình học 3D đặt mù
 * theo số không bao giờ đúng 100% ngay lần đầu.
 */

const FLOOR_TOP_Y = 0.05;
const ROOM_WIDTH = 3; // dọc trục X
const ROOM_DEPTH = 3; // dọc trục Z (âm)

export function RoomShell() {
  const floorTiles = [];
  for (let x = 0; x < ROOM_WIDTH; x++) {
    for (let z = 0; z < ROOM_DEPTH; z++) {
      floorTiles.push(
        <GltfModel
          key={`floor-${x}-${z}`}
          url={ROOM_MODEL_URLS.floor}
          position={[x, 0, -z]}
        />,
      );
    }
  }

  return (
    <group>
      {floorTiles}

      {/* Tường sau (Z=-3, rộng X:[0,3]) — 1 tấm wall kéo dài scale.x=3 thay vì ghép 3 tấm rời,
          tránh sai số ghép mối modular khi không thể xem trước bằng mắt. */}
      <GltfModel url={ROOM_MODEL_URLS.wall} position={[0, 0, -ROOM_DEPTH]} scale={[ROOM_WIDTH, 1, 1]} />
      {/* Tường trái (X=0, sâu Z:[-3,0]) — cùng tấm wall, xoay 90° quanh Y rồi kéo dài. */}
      <GltfModel
        url={ROOM_MODEL_URLS.wall}
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[ROOM_DEPTH, 1, 1]}
      />

      {/* Giường đơn — áp tường trái, góc gần cửa ra vào (bbox gốc ~1.62×0.51×1.89). */}
      <GltfModel url={ROOM_MODEL_URLS.bed} position={[0.15, FLOOR_TOP_Y, -0.1]} />

      {/* Bàn nhỏ cạnh giường. */}
      <GltfModel
        url={ROOM_MODEL_URLS.sideTable}
        position={[1.75, FLOOR_TOP_Y, -0.15]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* Bàn học — áp tường sau, bên phải phòng. Nhân vật ngồi vào đây khi nhãn thuộc Mind. */}
      <GltfModel
        url={ROOM_MODEL_URLS.desk}
        position={[2.6, FLOOR_TOP_Y, -2.85]}
        rotation={[0, Math.PI, 0]}
      />
      <GltfModel
        url={ROOM_MODEL_URLS.chair}
        position={[2.3, FLOOR_TOP_Y, -2.35]}
        rotation={[0, Math.PI, 0]}
      />
      {/* Đèn bàn — đặt trên mặt bàn (Y = sàn + chiều cao bàn 0.3844). Bàn sau khi xoay 180° và
          dời vị trí có chân đế thật ở X:[1.88,2.61] Z:[-3.03,-2.47] — đèn phải nằm trong khoảng
          đó, không phải X=2.85 (từng rơi ra ngoài mép bàn, trôi lửng bên cạnh). */}
      <GltfModel
        url={ROOM_MODEL_URLS.lamp}
        position={[2.2, FLOOR_TOP_Y + 0.3844, -2.9]}
      />

      {/* Kệ sách nhỏ — góc còn lại, đối diện giường. Lớn dần theo cấp Mind (§4.8: "kệ sách nhỏ
          → kệ lớn"), đây là phiên bản nhỏ nhất, cấp 0. */}
      <GltfModel url={ROOM_MODEL_URLS.bookcase} position={[0.25, FLOOR_TOP_Y, -2.8]} />

      {/* Thảm giữa phòng. */}
      <GltfModel
        url={ROOM_MODEL_URLS.rug}
        position={[0.75, FLOOR_TOP_Y + 0.01, -2.1]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* Cây nhỏ — góc trước, chỗ camera dễ thấy. Nguồn Spirit đầu tiên trong phòng. */}
      <GltfModel url={ROOM_MODEL_URLS.plant} position={[2.7, FLOOR_TOP_Y, -0.3]} />
    </group>
  );
}
