"use client";

import { GltfModel } from "./GltfModel";
import { ROOM_MODEL_URLS } from "./models";
import { RoomShellV2TrialFurniture } from "./RoomShellV2Trial";
import { footprintForChapter, totalWidthOf } from "./shells/footprint";
import {
  BalconyZone,
  BookcaseZone,
  CoatRackZone,
  DeskZone,
  DiningZone,
  GardenCluster,
  GrassGround,
  KitchenZone,
  LivingZone,
  PlantZone,
  Rug,
  SecondBedZone,
  SleepZone,
  StairsZone,
} from "./shells/zones";

/**
 * Vỏ nhà theo chương — SPEC.md §4.9, §5.3 ("5-6 vỏ nhà gốc, mỗi vỏ vài biến thể"), mốc 5.
 *
 * Toạ độ: X sang phải, Z đi vào trong phòng (âm), Y lên trên — GIỮ NGUYÊN quy ước từ mốc 1.
 * Chương 1 dùng ĐÚNG các số đã có từ mốc 1 (đã đối chiếu lại bằng đại số, không đổi một mm nào)
 * — mọi chương sau chỉ CỘNG THÊM vào một phòng ngày càng lớn, không đụng lại đồ Chương 1.
 *
 * 5 vỏ nhà gốc (bậc kích thước, `footprint.ts`): 3×3 (Ch.1-2) → 4×4 (Ch.3-5) → 5-6×4 (Ch.6-8) →
 * 7×4 (Ch.9) → 7×4 + sân rộng dần (Ch.10-12). Biến thể trong mỗi bậc: đổi tường sau (cửa sổ →
 * cửa kính lớn), thêm góc bếp/khách/ăn/cầu thang/sân vườn — đúng tinh thần "đổi nội thất, mở
 * thêm phòng, đổi cảnh ngoài cửa sổ" ở §5.3, không phải 12 model phòng rời nhau.
 *
 * Vị trí đo theo bbox thật của từng model (script tạm, kỹ thuật lặp lại từ mốc 3) — vẫn cần soi
 * bằng mắt qua trình duyệt sau khi dựng, hình học 3D đặt mù theo số không bao giờ đúng 100% ngay
 * lần đầu (bài học mốc 1/mốc 3, xem CLAUDE.md).
 */

function FloorTiles({ width, depth }: { width: number; depth: number }) {
  const tiles = [];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      tiles.push(<GltfModel key={`floor-${x}-${z}`} url={ROOM_MODEL_URLS.floor} position={[x, 0, -z]} />);
    }
  }
  return <>{tiles}</>;
}

type BackWallKind = "wall" | "window" | "slide";

function BackWall({ width, depth, kind }: { width: number; depth: number; kind: BackWallKind }) {
  const url =
    kind === "window" ? ROOM_MODEL_URLS.wallWindow : kind === "slide" ? ROOM_MODEL_URLS.wallWindowSlide : ROOM_MODEL_URLS.wall;
  return <GltfModel url={url} position={[0, 0, -depth]} scale={[width, 1, 1]} />;
}

function LeftWall({ depth }: { depth: number }) {
  return (
    <GltfModel url={ROOM_MODEL_URLS.wall} position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[depth, 1, 1]} />
  );
}

/** Dãy nhà xa mờ phía sau cửa kính lớn (Chương 8+, "view thành phố", §4.9) — khối màu phẳng
 *  đơn giản, không phải model tải thêm, cao hơn hẳn tường (1.29) đểló lên trên nhìn từ camera
 *  trên cao. Đặt xa hẳn phía sau tường sau, không cần đúng vị trí tuyệt đối. */
function CitySkyline({ interiorDepth }: { interiorDepth: number }) {
  const buildings: { x: number; h: number; w: number; color: string }[] = [
    { x: -1.5, h: 4.2, w: 1.3, color: "#93a5b8" },
    { x: 0.3, h: 5.6, w: 1.5, color: "#7c8fa3" },
    { x: 2.2, h: 3.6, w: 1.1, color: "#a3b3c4" },
    { x: 3.7, h: 6.2, w: 1.4, color: "#8695a8" },
    { x: 5.4, h: 4.8, w: 1.2, color: "#93a5b8" },
    { x: 6.8, h: 3.9, w: 1.0, color: "#7c8fa3" },
  ];
  const z = -interiorDepth - 4;
  return (
    <>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, z - (i % 2) * 1.2]}>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshStandardMaterial color={b.color} />
        </mesh>
      ))}
    </>
  );
}

// THỬ NGHIỆM — bật/tắt bằng đúng một hằng số này để dễ so sánh trước/sau hoặc gỡ hoàn toàn nếu
// chủ dự án không ưng (xem RoomShellV2Trial.tsx). Chỉ ảnh hưởng Chương 1.
const V2_TRIAL_CHAPTER_1 = true;

export function RoomShell({ chapter = 1 }: { chapter?: number }) {
  const fp = footprintForChapter(chapter);
  const { interiorWidth, interiorDepth, outdoorWidth } = fp;
  const backWallKind: BackWallKind = chapter === 1 ? "wall" : chapter <= 7 ? "window" : "slide";
  const useV2Trial = V2_TRIAL_CHAPTER_1 && chapter === 1;

  // Đồ CHUNG cho mọi chương ≥ 1 — y hệt Chương 1, không đổi khi phòng lớn dần (§5.3: đồ chỉ
  // ĐẾN theo chương, không có món nào của chương trước bị dọn đi).
  const core = useV2Trial ? (
    <RoomShellV2TrialFurniture />
  ) : (
    <>
      <SleepZone anchor={[0, 0]} double={chapter >= 6} />
      <DeskZone corner={[interiorWidth, -interiorDepth]} />
      <BookcaseZone corner={[0, -interiorDepth]} />
      <PlantZone corner={[interiorWidth, 0]} potted={chapter >= 6} />
    </>
  );

  return (
    <group>
      <FloorTiles width={interiorWidth} depth={interiorDepth} />
      <BackWall width={interiorWidth} depth={interiorDepth} kind={backWallKind} />
      <LeftWall depth={interiorDepth} />
      {chapter >= 8 && <CitySkyline interiorDepth={interiorDepth} />}

      {core}

      {/* Chương 1-2: đúng ba món — giường, bàn học, kệ sách, không hơn (SPEC.md §4.9 Chương 1-2).
          Thảm Chương 1 đã có SẴN trong RoomShellV2TrialFurniture khi bật thử nghiệm — bỏ qua ở
          đây để không chồng hai thảm. */}
      {chapter <= 2 && !useV2Trial && <Rug anchor={[0.75, -2.1]} />}

      {/* Chương 3+: phòng rộng hơn — thảm to hơn cho vừa không gian mới. */}
      {chapter >= 3 && <Rug anchor={[1.1, -2.8]} wide />}

      {/* Chương 4+: bếp nhỏ — "Studio" (§4.9). */}
      {chapter >= 4 && <KitchenZone corner={[2.3, -interiorDepth]} />}

      {/* Chương 5: ban công mở, phía +X (§4.9 "Studio có ban công"). */}
      {chapter === 5 && <BalconyZone anchor={[interiorWidth + 0.5, -2]} />}

      {/* Chương 6+: góc khách (sofa + TV), áp tường trái phía sau khu ngủ (§4.9 "Căn hộ"). */}
      {chapter >= 6 && <LivingZone anchor={[0.1, -2.3]} />}

      {/* Chương 7+: phòng ngủ thứ hai (§4.9 "Căn hộ 2 phòng ngủ"). */}
      {chapter >= 7 && <SecondBedZone anchor={[2.9, -2.7]} />}

      {/* Chương 9+: bàn ăn + cầu thang trang trí + móc áo — "Nhà phố" (§4.9), cần bề rộng 7. */}
      {chapter >= 9 && (
        <>
          <DiningZone anchor={[3.6, -1.1]} />
          <StairsZone anchor={[6.3, -0.5]} />
          <CoatRackZone anchor={[6.6, -0.15]} />
        </>
      )}

      {/* Chương 5: nền ban công lát SÀN (không phải cỏ — ban công không phải bãi cỏ), không có
          cụm cây (một cây trên ban công studio nhỏ thì vô lý, cây/bụi/hoa để dành cho sân §4.9). */}
      {chapter === 5 && (
        <GrassGround anchor={[interiorWidth, 0]} size={[outdoorWidth, interiorDepth]} color="#e4c9a0" />
      )}

      {/* Chương 10-12: sân/vườn cỏ thật, mở rộng dần về phía +X (§4.9 "có sân" → "có vườn").
          Cụm cây đầu tiên đặt CÁCH mép trong ít nhất 2 đơn vị, Z gần 0 (phía trước) — bắt gặp
          lúc soi mốc 5: đặt sát mép + gần góc bàn học (corner=[interiorWidth,-interiorDepth])
          trông như cây đè lên nhân vật do phối cảnh camera lùi xa dần theo phòng lớn. */}
      {chapter >= 10 && (
        <>
          <GrassGround anchor={[interiorWidth, 0]} size={[outdoorWidth, interiorDepth]} />
          <GardenCluster anchor={[interiorWidth + 2, -1]} />
          {chapter >= 11 && <GardenCluster anchor={[interiorWidth + 3.5, -2.5]} />}
          {chapter >= 12 && <GardenCluster anchor={[interiorWidth + 5, -1]} />}
        </>
      )}
    </group>
  );
}

export function totalRoomWidth(chapter: number): number {
  return totalWidthOf(footprintForChapter(chapter));
}
