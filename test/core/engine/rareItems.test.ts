import { describe, expect, it } from "vitest";
import { currentRareItemTriggers, pickRareItemKey, rareItemHits } from "../../../core/engine/rareItems";
import { RARE_ITEM_CHANCE, RARE_ITEM_KEYS } from "../../../core/balance";
import type { DayKey } from "../../../core/types";

describe("core/engine/rareItems — rareItemHits, pickRareItemKey (thuần, ổn định)", () => {
  it("cùng (triggerId, salt) luôn ra cùng kết quả", () => {
    const a = rareItemHits("day_milestone", "2026-09-07");
    const b = rareItemHits("day_milestone", "2026-09-07");
    expect(a).toBe(b);
  });

  it("pickRareItemKey luôn trả về một trong RARE_ITEM_KEYS", () => {
    for (const salt of ["a", "b", "c", "2026-09-07", "2027-01-01"]) {
      expect(RARE_ITEM_KEYS).toContain(pickRareItemKey("day_milestone", salt));
    }
  });

  it("đổi salt (đổi lượt cài đặt) có thể đổi kết quả — không phải hằng số cứng", () => {
    const results = new Set<boolean>();
    for (let i = 0; i < 30; i++) {
      results.add(rareItemHits("day_milestone", `install-${i}`));
    }
    // Ít nhất phải có CẢ true lẫn false xuất hiện trong 30 salt khác nhau — nếu luôn ra một giá
    // trị thì hàm băm/ngưỡng có vấn đề.
    expect(results.size).toBe(2);
  });

  it("tỉ lệ trúng trên nhiều trigger khác nhau xấp xỉ RARE_ITEM_CHANCE (băm ổn định, không flaky)", () => {
    let hits = 0;
    const total = 2000;
    for (let i = 0; i < total; i++) {
      if (rareItemHits(`trigger_${i}`, "fixed-salt")) hits++;
    }
    const rate = hits / total;
    expect(rate).toBeGreaterThan(RARE_ITEM_CHANCE - 0.05);
    expect(rate).toBeLessThan(RARE_ITEM_CHANCE + 0.05);
  });
});

describe("core/engine/rareItems — currentRareItemTriggers, ngày thứ N", () => {
  it("chưa tới ngày mốc → không có day_milestone", () => {
    const triggers = currentRareItemTriggers({
      profileStartedDayKey: "2026-01-01" as DayKey,
      today: "2026-01-05" as DayKey, // mới ngày thứ 5
      dailySeries: [],
    });
    expect(triggers.some((t) => t.triggerId === "day_milestone")).toBe(false);
  });

  it("đúng/qua ngày mốc thứ 100 → có day_milestone", () => {
    const triggers = currentRareItemTriggers({
      profileStartedDayKey: "2026-01-01" as DayKey,
      today: "2026-04-10" as DayKey, // ngày thứ 100 kể từ 2026-01-01
      dailySeries: [],
    });
    expect(triggers.some((t) => t.triggerId === "day_milestone")).toBe(true);
  });
});

describe("core/engine/rareItems — currentRareItemTriggers, đêm giao thừa", () => {
  it("đêm giao thừa đã qua trong lịch sử app → có trigger đúng năm đó", () => {
    const triggers = currentRareItemTriggers({
      profileStartedDayKey: "2026-01-01" as DayKey,
      today: "2026-03-01" as DayKey, // sau đêm giao thừa 2026 (16/2/2026)
      dailySeries: [],
    });
    expect(triggers.some((t) => t.triggerId === "tet_eve_2026")).toBe(true);
    expect(triggers.some((t) => t.triggerId === "tet_eve_2027")).toBe(false); // chưa tới
  });

  it("bắt đầu dùng app SAU đêm giao thừa năm đó → không tính (không thuộc lịch sử app)", () => {
    const triggers = currentRareItemTriggers({
      profileStartedDayKey: "2026-03-01" as DayKey, // sau đêm giao thừa 2026
      today: "2026-04-01" as DayKey,
      dailySeries: [],
    });
    expect(triggers.some((t) => t.triggerId === "tet_eve_2026")).toBe(false);
  });
});

describe("core/engine/rareItems — currentRareItemTriggers, tuần trọn vẹn", () => {
  function series(days: Record<DayKey, boolean>): { dayKey: DayKey; dayAchieved: boolean }[] {
    return Object.entries(days).map(([dayKey, dayAchieved]) => ({ dayKey: dayKey as DayKey, dayAchieved }));
  }

  it("cả 7 ngày một tuần (Thứ 2 → CN) đều đạt, tuần đã hoàn toàn qua → có trigger", () => {
    // 2026-08-24 là Thứ Hai.
    const triggers = currentRareItemTriggers({
      profileStartedDayKey: "2026-08-24" as DayKey,
      today: "2026-09-05" as DayKey, // xa hẳn khỏi tuần đó, chắc chắn đã qua
      dailySeries: series({
        "2026-08-24": true,
        "2026-08-25": true,
        "2026-08-26": true,
        "2026-08-27": true,
        "2026-08-28": true,
        "2026-08-29": true,
        "2026-08-30": true,
      }),
    });
    expect(triggers.some((t) => t.triggerId === "perfect_week_2026-08-24")).toBe(true);
  });

  it("một ngày trong tuần KHÔNG đạt → không có trigger tuần đó", () => {
    const triggers = currentRareItemTriggers({
      profileStartedDayKey: "2026-08-24" as DayKey,
      today: "2026-09-05" as DayKey,
      dailySeries: series({
        "2026-08-24": true,
        "2026-08-25": true,
        "2026-08-26": false,
        "2026-08-27": true,
        "2026-08-28": true,
        "2026-08-29": true,
        "2026-08-30": true,
      }),
    });
    expect(triggers.some((t) => t.triggerId === "perfect_week_2026-08-24")).toBe(false);
  });

  it("tuần ĐANG diễn ra (chứa hôm nay) dù mọi ngày đã qua đều đạt → chưa tính, chờ qua hẳn tuần", () => {
    const triggers = currentRareItemTriggers({
      profileStartedDayKey: "2026-08-24" as DayKey,
      today: "2026-08-27" as DayKey, // Thứ Năm CÙNG tuần — tuần chưa qua hết
      dailySeries: series({
        "2026-08-24": true,
        "2026-08-25": true,
        "2026-08-26": true,
      }),
    });
    expect(triggers.some((t) => t.triggerId === "perfect_week_2026-08-24")).toBe(false);
  });
});
