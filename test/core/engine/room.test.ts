import { describe, expect, it } from "vitest";
import { unlockedRoomItems, type RoomItemCatalogEntry } from "../../../core/engine/room";

const CATALOG: RoomItemCatalogEntry[] = [
  { id: 1, stat: "mind", modelKey: "books", unlockLevel: 1 },
  { id: 2, stat: "mind", modelKey: "lampSquareFloor", unlockLevel: 2 },
  { id: 3, stat: "health", modelKey: "rugRound", unlockLevel: 1 },
  { id: 4, stat: "spirit", modelKey: "pillowBlueLong", unlockLevel: 1 },
];

describe("core/engine/room — unlockedRoomItems (§4.8)", () => {
  it("cấp 0 khắp nơi — chưa có món nào", () => {
    const unlocked = unlockedRoomItems(CATALOG, { mind: 0, health: 0, spirit: 0 });
    expect(unlocked).toEqual([]);
  });

  it("mind cấp 1 → mở món ngưỡng 1, chưa mở món ngưỡng 2", () => {
    const unlocked = unlockedRoomItems(CATALOG, { mind: 1, health: 0, spirit: 0 });
    expect(unlocked.map((i) => i.modelKey)).toEqual(["books"]);
  });

  it("mind cấp 2 → mở cả hai món mind, không đụng chỉ số khác", () => {
    const unlocked = unlockedRoomItems(CATALOG, { mind: 2, health: 0, spirit: 0 });
    expect(unlocked.map((i) => i.modelKey).sort()).toEqual(["books", "lampSquareFloor"]);
  });

  it("tụt cấp thì món biến mất khỏi danh sách (§4.1: đồ của cấp vừa mất biến khỏi phòng)", () => {
    const atLevel2 = unlockedRoomItems(CATALOG, { mind: 2, health: 0, spirit: 0 });
    const afterDrop = unlockedRoomItems(CATALOG, { mind: 1, health: 0, spirit: 0 });
    expect(atLevel2).toHaveLength(2);
    expect(afterDrop).toHaveLength(1);
    expect(afterDrop.map((i) => i.modelKey)).toEqual(["books"]);
  });

  it("cấp cao hơn ngưỡng nhiều vẫn mở (không cần đúng bằng)", () => {
    const unlocked = unlockedRoomItems(CATALOG, { mind: 10, health: 0, spirit: 0 });
    expect(unlocked.map((i) => i.modelKey).sort()).toEqual(["books", "lampSquareFloor"]);
  });
});
