/**
 * Đường dẫn model 3D — nguồn CC0, xem `public/models/CREDITS.md`. Đổi model chỉ cần sửa ở
 * đây, không đụng component nào khác (SPEC.md §5.3: "5-6 vỏ nhà gốc... tránh rigging").
 */

export const ROOM_MODEL_URLS = {
  floor: "/models/room/floorFull.glb",
  wall: "/models/room/wall.glb",
  bed: "/models/room/bedSingle.glb",
  desk: "/models/room/desk.glb",
  chair: "/models/room/chairDesk.glb",
  bookcase: "/models/room/bookcaseOpenLow.glb",
  lamp: "/models/room/lampRoundTable.glb",
  sideTable: "/models/room/sideTable.glb",
  rug: "/models/room/rugRectangle.glb",
  plant: "/models/room/plantSmall1.glb",
} as const;

export type RoomModelKey = keyof typeof ROOM_MODEL_URLS;

/**
 * Model nhân vật theo giai đoạn (SPEC.md §4.8) — chỉ giai đoạn 1 có model thật, các giai đoạn
 * sau thêm dần khi nhân vật thật sự tới cấp đó (§5.3: "đồ chỉ đến khi đủ điểm", không phải rơi
 * theo thời gian). `characterModelForStage` dùng tạm giai đoạn gần nhất đã có model.
 */
export const CHARACTER_MODEL_URLS_BY_STAGE: Readonly<Record<number, string>> = {
  1: "/models/characters/stage-1.glb",
};

export function characterModelForStage(stage: number): string {
  const available = Object.keys(CHARACTER_MODEL_URLS_BY_STAGE).map(Number);
  const bestAvailable = available.filter((s) => s <= stage).sort((a, b) => b - a)[0];
  return CHARACTER_MODEL_URLS_BY_STAGE[bestAvailable ?? Math.min(...available)];
}
