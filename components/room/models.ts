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
  // Tải cùng đợt mốc 1 nhưng chưa lắp — dùng từ mốc 5 (vỏ nhà theo chương, §4.9).
  wallWindow: "/models/room/wallWindow.glb",
  wallCorner: "/models/room/wallCorner.glb",
  doorway: "/models/room/doorway.glb",
  pottedPlant: "/models/room/pottedPlant.glb",
  // Mới tải ở mốc 5 — xem public/models/CREDITS.md.
  wallWindowSlide: "/models/room/wallWindowSlide.glb",
  kitchenCabinet: "/models/room/kitchenCabinet.glb",
  kitchenSink: "/models/room/kitchenSink.glb",
  kitchenFridgeSmall: "/models/room/kitchenFridgeSmall.glb",
  tableCoffee: "/models/room/tableCoffee.glb",
  loungeChair: "/models/room/loungeChair.glb",
  loungeSofa: "/models/room/loungeSofa.glb",
  televisionModern: "/models/room/televisionModern.glb",
  cabinetTelevision: "/models/room/cabinetTelevision.glb",
  bedDouble: "/models/room/bedDouble.glb",
  stairs: "/models/room/stairs.glb",
  table: "/models/room/table.glb",
  chairRounded: "/models/room/chairRounded.glb",
  coatRackStanding: "/models/room/coatRackStanding.glb",
} as const;

export type RoomModelKey = keyof typeof ROOM_MODEL_URLS;

/** Sân vườn (Chương 10-12, §4.9) — xem public/models/CREDITS.md. */
export const GARDEN_MODEL_URLS = {
  tree: "/models/garden/tree_detailed.glb",
  bush: "/models/garden/plant_bushDetailed.glb",
  flowerYellow: "/models/garden/flower_yellowA.glb",
  flowerRed: "/models/garden/flower_redA.glb",
} as const;

/**
 * Đồ đạc mở khoá theo cấp (SPEC.md §4.8, §5.3) — 12 món đầu, mốc 3. Khoá của map này TRÙNG
 * `room_items.model_key` trong DB (xem db/seed.ts) — đổi tên file ở đây thì phải đổi cả seed.
 */
export const ROOM_ITEM_MODEL_URLS: Readonly<Record<string, string>> = {
  books: "/models/room-items/books.glb",
  lampSquareFloor: "/models/room-items/lampSquareFloor.glb",
  bookcaseOpen: "/models/room-items/bookcaseOpen.glb",
  bookcaseClosedWide: "/models/room-items/bookcaseClosedWide.glb",
  rugRound: "/models/room-items/rugRound.glb",
  bench: "/models/room-items/bench.glb",
  pillowLong: "/models/room-items/pillowLong.glb",
  plantSmall3: "/models/room-items/plantSmall3.glb",
  pillowBlueLong: "/models/room-items/pillowBlueLong.glb",
  loungeChairRelax: "/models/room-items/loungeChairRelax.glb",
  plantSmall2: "/models/room-items/plantSmall2.glb",
  bear: "/models/room-items/bear.glb",
};

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
