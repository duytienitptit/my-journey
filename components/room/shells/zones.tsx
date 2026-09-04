"use client";

import { GltfModel } from "../GltfModel";
import { GARDEN_MODEL_URLS, ROOM_MODEL_URLS } from "../models";

/**
 * Cụm đồ tái dùng được cho 5 vỏ nhà (mốc 5, SPEC.md §4.9, §5.3) — mỗi cụm nhận một điểm neo
 * `[x, z]` (góc phòng thật, world space, Y luôn tính từ FLOOR_TOP_Y) rồi tự đặt đồ theo đúng
 * offset đã đo bbox thật (script tạm, kỹ thuật lặp lại từ mốc 3 — xem RoomShell.tsx cũ).
 *
 * Quy ước xoay: đồ ÁP TƯỜNG SAU dùng `rotation={[0,Math.PI,0]}` và neo đặt Ở NGAY MÉP TƯỜNG —
 * cách này đã dùng đúng cho desk/chair ở Chương 1 (xem SleepDeskShell bên dưới), kiểm chứng lại
 * bằng mắt qua trình duyệt sau khi dựng, không giả định đúng 100% chỉ từ số đo.
 */

const FLOOR_TOP_Y = 0.05;

// ─── Chương 1-2: nguyên khối đồ Chương 1, giữ Y NGUYÊN VĂN — xem RoomShell.tsx bản gốc ───────

/** Góc trước-trái (0,0) — giường đơn/đôi + bàn cạnh giường. */
export function SleepZone({ anchor, double = false }: { anchor: [number, number]; double?: boolean }) {
  const [ax, az] = anchor;
  return (
    <group>
      <GltfModel url={double ? ROOM_MODEL_URLS.bedDouble : ROOM_MODEL_URLS.bed} position={[ax + 0.15, FLOOR_TOP_Y, az - 0.1]} />
      <GltfModel
        url={ROOM_MODEL_URLS.sideTable}
        position={[ax + 1.75, FLOOR_TOP_Y, az - 0.15]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );
}

/** Góc sau-phải (wallX, wallZ) — bàn học + ghế + đèn, đúng số đã dùng ở Chương 1. */
export function DeskZone({ corner }: { corner: [number, number] }) {
  const [cx, cz] = corner;
  return (
    <group>
      <GltfModel url={ROOM_MODEL_URLS.desk} position={[cx - 0.4, FLOOR_TOP_Y, cz + 0.15]} rotation={[0, Math.PI, 0]} />
      <GltfModel
        url={ROOM_MODEL_URLS.chair}
        position={[cx - 0.7, FLOOR_TOP_Y, cz + 0.65]}
        rotation={[0, Math.PI, 0]}
      />
      <GltfModel url={ROOM_MODEL_URLS.lamp} position={[cx - 0.8, FLOOR_TOP_Y + 0.3844, cz + 0.1]} />
    </group>
  );
}

/** Góc sau-trái (0, wallZ) — kệ sách nhỏ, khởi điểm cấp 0 (mốc 3, §4.8). */
export function BookcaseZone({ corner }: { corner: [number, number] }) {
  const [cx, cz] = corner;
  return <GltfModel url={ROOM_MODEL_URLS.bookcase} position={[cx + 0.25, FLOOR_TOP_Y, cz + 0.2]} />;
}

/** Góc trước-phải (wallX, 0) — cây nhỏ, nguồn Spirit đầu tiên trong phòng. */
export function PlantZone({ corner, potted = false }: { corner: [number, number]; potted?: boolean }) {
  const [cx, cz] = corner;
  return (
    <GltfModel
      url={potted ? ROOM_MODEL_URLS.pottedPlant : ROOM_MODEL_URLS.plant}
      position={[cx - 0.3, FLOOR_TOP_Y, cz - 0.3]}
    />
  );
}

export function Rug({ anchor, wide = false }: { anchor: [number, number]; wide?: boolean }) {
  const [ax, az] = anchor;
  return (
    <GltfModel
      url={ROOM_MODEL_URLS.rug}
      position={[ax, FLOOR_TOP_Y + 0.01, az]}
      rotation={[0, Math.PI / 2, 0]}
      scale={wide ? [1, 1, 1.4] : [1, 1, 1]}
    />
  );
}

// ─── Chương 4+: bếp nhỏ áp tường sau (studio trở lên, §4.9) ──────────────────────────────────

/** Bếp nhỏ áp tường sau — 3 món xếp hàng, `corner` là điểm mép tường bên phải cụm bếp. */
export function KitchenZone({ corner }: { corner: [number, number] }) {
  const [cx, cz] = corner;
  return (
    <group>
      <GltfModel
        url={ROOM_MODEL_URLS.kitchenFridgeSmall}
        position={[cx - 0.05, FLOOR_TOP_Y, cz + 0.32]}
        rotation={[0, Math.PI, 0]}
      />
      <GltfModel
        url={ROOM_MODEL_URLS.kitchenCabinet}
        position={[cx - 0.65, FLOOR_TOP_Y, cz + 0.45]}
        rotation={[0, Math.PI, 0]}
      />
      <GltfModel
        url={ROOM_MODEL_URLS.kitchenSink}
        position={[cx - 1.25, FLOOR_TOP_Y, cz + 0.46]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

// ─── Chương 6+: góc khách (sofa + TV) ─────────────────────────────────────────────────────────

/** Sofa quay mặt vào TV cách đó ~1.8m — `anchor` là chân sofa (mép áp tường trái). */
export function LivingZone({ anchor }: { anchor: [number, number] }) {
  const [ax, az] = anchor;
  return (
    <group>
      <GltfModel url={ROOM_MODEL_URLS.loungeSofa} position={[ax, FLOOR_TOP_Y, az]} rotation={[0, Math.PI / 2, 0]} />
      <GltfModel
        url={ROOM_MODEL_URLS.tableCoffee}
        position={[ax + 0.85, FLOOR_TOP_Y, az - 0.3]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <GltfModel
        url={ROOM_MODEL_URLS.cabinetTelevision}
        position={[ax + 1.9, FLOOR_TOP_Y, az - 0.3]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <GltfModel
        url={ROOM_MODEL_URLS.televisionModern}
        position={[ax + 1.9, FLOOR_TOP_Y + 0.31, az - 0.3]}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </group>
  );
}

// ─── Chương 7+: giường phụ (2 phòng ngủ) ──────────────────────────────────────────────────────

export function SecondBedZone({ anchor }: { anchor: [number, number] }) {
  const [ax, az] = anchor;
  return <GltfModel url={ROOM_MODEL_URLS.bed} position={[ax, FLOOR_TOP_Y, az]} rotation={[0, Math.PI / 2, 0]} />;
}

// ─── Chương 9+: bàn ăn + cầu thang (nhà, §4.9) ────────────────────────────────────────────────

export function DiningZone({ anchor }: { anchor: [number, number] }) {
  const [ax, az] = anchor;
  return (
    <group>
      <GltfModel url={ROOM_MODEL_URLS.table} position={[ax, FLOOR_TOP_Y, az]} />
      <GltfModel
        url={ROOM_MODEL_URLS.chairRounded}
        position={[ax + 0.3, FLOOR_TOP_Y, az + 0.35]}
        rotation={[0, Math.PI, 0]}
      />
      <GltfModel
        url={ROOM_MODEL_URLS.chairRounded}
        position={[ax + 0.55, FLOOR_TOP_Y, az - 0.75]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

/** Cầu thang trang trí áp tường trái — ngụ ý tầng trên, không dẫn đi đâu cả. */
export function StairsZone({ anchor }: { anchor: [number, number] }) {
  const [ax, az] = anchor;
  return (
    <GltfModel url={ROOM_MODEL_URLS.stairs} position={[ax, FLOOR_TOP_Y, az]} rotation={[0, Math.PI / 2, 0]} />
  );
}

export function CoatRackZone({ anchor }: { anchor: [number, number] }) {
  const [ax, az] = anchor;
  return <GltfModel url={ROOM_MODEL_URLS.coatRackStanding} position={[ax, FLOOR_TOP_Y, az]} />;
}

// ─── Chương 5: ban công mở (studio có ban công, §4.9) ─────────────────────────────────────────

export function BalconyZone({ anchor }: { anchor: [number, number] }) {
  const [ax, az] = anchor;
  return (
    <group>
      <GltfModel
        url={ROOM_MODEL_URLS.loungeChair}
        position={[ax, FLOOR_TOP_Y, az]}
        rotation={[0, Math.PI / 4, 0]}
      />
      <GltfModel url={ROOM_MODEL_URLS.tableCoffee} position={[ax + 0.7, FLOOR_TOP_Y, az - 0.1]} />
    </group>
  );
}

// ─── Chương 10-12: sân/vườn (§4.9) ─────────────────────────────────────────────────────────────

/** Dải nền ngoài trời — mặt phẳng tô màu cỏ, GIỮ ĐÚNG phong cách "vật liệu màu phẳng" của phòng
 *  (CREDITS.md) thay vì tải thêm model nền cỏ riêng. `size` = [rộng, sâu]. */
/** `color` mặc định xanh cỏ (sân/vườn, Chương 10+) — Chương 5 (ban công) truyền màu gần màu sàn
 *  trong nhà, KHÔNG phải cỏ (ban công lát sàn, không phải bãi cỏ). */
export function GrassGround({
  anchor,
  size,
  color = "#8fb573",
}: {
  anchor: [number, number];
  size: [number, number];
  color?: string;
}) {
  const [ax, az] = anchor;
  return (
    // Y = FLOOR_TOP_Y, NGANG BẰNG mặt sàn trong nhà (floorFull) — hai nền ghép khít không lệch
    // bậc, vì nền ngoài luôn đặt SÁT NGAY mép sàn trong (không chồng lên), xem RoomShell.tsx.
    <mesh position={[ax + size[0] / 2, FLOOR_TOP_Y, az - size[1] / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size[0], size[1]]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/** Một cụm cây + bụi + hoa, `anchor` là gốc cây. Rải thêm bằng cách gọi nhiều lần với anchor khác. */
export function GardenCluster({ anchor }: { anchor: [number, number] }) {
  const [ax, az] = anchor;
  return (
    <group>
      <GltfModel url={GARDEN_MODEL_URLS.tree} position={[ax, 0, az]} />
      <GltfModel url={GARDEN_MODEL_URLS.bush} position={[ax + 0.75, 0, az - 0.2]} />
      <GltfModel url={GARDEN_MODEL_URLS.flowerYellow} position={[ax + 0.5, 0, az + 0.5]} />
      <GltfModel url={GARDEN_MODEL_URLS.flowerRed} position={[ax + 0.85, 0, az + 0.35]} />
    </group>
  );
}
