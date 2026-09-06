import { describe, expect, it } from "vitest";
import {
  heatmapCells,
  hoursByLabelPerWeek,
  hoursOf,
  lastMonthKeys,
  lifetimeTotals,
  monthKeyOf,
  monthlyStatTrend,
  personalRecords,
  weekStartsOf,
  windowDaysOf,
  windowMonthsOf,
  windowStartDayKey,
} from "../../../core/engine/longTermStats";
import type { DailyTimelinePoint, RawCompletedSession } from "../../../core/engine/types";
import type { DayKey, StatKey } from "../../../core/types";

function session(dayKey: DayKey, labelId = 1): RawCompletedSession {
  return { dayKey, labelId, source: "timer" };
}

function point(dayKey: DayKey, dayAchieved: boolean, xp: Partial<Record<StatKey, number>> = {}): DailyTimelinePoint {
  return { dayKey, dayAchieved, xpByStat: { mind: 0, health: 0, spirit: 0, ...xp } };
}

describe("core/engine/longTermStats — khoá tháng và khung 12 tháng", () => {
  it("monthKeyOf cắt đúng YYYY-MM", () => {
    expect(monthKeyOf("2026-09-05" as DayKey)).toBe("2026-09");
  });

  it("lastMonthKeys đi lùi qua ranh giới NĂM mà không lệch", () => {
    expect(lastMonthKeys("2026-02-15" as DayKey, 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("lastMonthKeys(12) trả đúng 12 tháng, tháng cuối là tháng hiện tại", () => {
    const keys = lastMonthKeys("2026-09-06" as DayKey, 12);
    expect(keys).toHaveLength(12);
    expect(keys[0]).toBe("2025-10");
    expect(keys[11]).toBe("2026-09");
  });

  it("windowStartDayKey luôn là MÙNG 1 — để 12 tháng đều trọn vẹn", () => {
    expect(windowStartDayKey("2026-09-06" as DayKey, 12)).toBe("2025-10-01");
  });

  it("windowDaysOf liệt kê liên tục từ mùng 1 tới hôm nay, không sót không lặp", () => {
    const days = windowDaysOf("2026-03-03" as DayKey, 2);
    expect(days[0]).toBe("2026-02-01");
    expect(days[days.length - 1]).toBe("2026-03-03");
    // tháng 2/2026 có 28 ngày + 3 ngày tháng 3
    expect(days).toHaveLength(31);
    expect(new Set(days).size).toBe(days.length);
  });
});

describe("core/engine/longTermStats — khối 1 tổng cộng dồn", () => {
  it("giờ tính theo minutesPerSession truyền vào, KHÔNG phải hằng số 0,5", () => {
    const sessions = [session("2026-09-01" as DayKey), session("2026-09-01" as DayKey)];
    // 25 + 5 = 30 phút → 2 phiên = 1 giờ
    expect(lifetimeTotals(sessions, [], 30).totalHours).toBe(1);
    // Đổi độ dài phiên sang 50 + 5 = 55 phút → cùng 2 phiên nhưng ra giờ khác
    expect(lifetimeTotals(sessions, [], 55).totalHours).toBeCloseTo(55 / 30, 10);
  });

  it("daysAchieved đếm từ dailySeries, không đếm ngày không đạt", () => {
    const series = [
      point("2026-09-01" as DayKey, true),
      point("2026-09-02" as DayKey, false),
      point("2026-09-03" as DayKey, true),
    ];
    expect(lifetimeTotals([], series, 30).daysAchieved).toBe(2);
  });

  it("chưa có phiên nào → toàn số 0, không lỗi", () => {
    expect(lifetimeTotals([], [], 30)).toEqual({ totalSessions: 0, totalHours: 0, daysAchieved: 0 });
  });
});

describe("core/engine/longTermStats — khối 2 bản đồ nhiệt", () => {
  it("mọi ngày trong khung đều có ô, ngày trống là 0", () => {
    const days = ["2026-09-01", "2026-09-02", "2026-09-03"] as DayKey[];
    const cells = heatmapCells([session("2026-09-02" as DayKey)], days);
    expect(cells).toEqual([
      { dayKey: "2026-09-01", sessions: 0 },
      { dayKey: "2026-09-02", sessions: 1 },
      { dayKey: "2026-09-03", sessions: 0 },
    ]);
  });

  it("phiên ngoài khung không lọt vào ô nào", () => {
    const cells = heatmapCells([session("2025-01-01" as DayKey)], ["2026-09-01"] as DayKey[]);
    expect(cells).toEqual([{ dayKey: "2026-09-01", sessions: 0 }]);
  });
});

describe("core/engine/longTermStats — khối 3 xu hướng tháng", () => {
  it("lấy điểm CUỐI CÙNG của mỗi tháng", () => {
    const series = [
      point("2026-08-30" as DayKey, true, { mind: 10 }),
      point("2026-08-31" as DayKey, true, { mind: 40 }),
      point("2026-09-01" as DayKey, true, { mind: 70 }),
    ];
    const trend = monthlyStatTrend(series, ["2026-08", "2026-09"]);
    expect(trend[0].xpByStat.mind).toBe(40);
    expect(trend[1].xpByStat.mind).toBe(70);
  });

  it("tháng không có bản ghi MANG THEO xp tháng trước — XP cộng dồn, không tụt về 0", () => {
    const series = [point("2026-07-31" as DayKey, true, { mind: 500 })];
    const trend = monthlyStatTrend(series, ["2026-07", "2026-08", "2026-09"]);
    expect(trend.map((t) => t.xpByStat.mind)).toEqual([500, 500, 500]);
  });

  it("tháng nằm hoàn toàn TRƯỚC ngày đầu tiên thì đúng là 0", () => {
    const series = [point("2026-09-01" as DayKey, true, { mind: 30 })];
    const trend = monthlyStatTrend(series, ["2026-07", "2026-08", "2026-09"]);
    expect(trend.map((t) => t.xpByStat.mind)).toEqual([0, 0, 30]);
  });
});

describe("core/engine/longTermStats — khối 5 kỷ lục cá nhân", () => {
  it("ngày nhiều phiên nhất và tuần nhiều giờ nhất", () => {
    const sessions = [
      // Thứ Hai 2026-09-07 — 3 phiên
      session("2026-09-07" as DayKey),
      session("2026-09-07" as DayKey),
      session("2026-09-07" as DayKey),
      // tuần sau — 2 phiên rải hai ngày
      session("2026-09-14" as DayKey),
      session("2026-09-15" as DayKey),
    ];
    const r = personalRecords(sessions, 12, 30);
    expect(r.mostSessionsInADay).toEqual({ dayKey: "2026-09-07", sessions: 3 });
    expect(r.mostHoursInAWeek).toEqual({ weekStart: "2026-09-07", hours: 1.5 });
    expect(r.longestDayAchievedStreak).toBe(12);
  });

  it("hoà nhau → giữ ngày SỚM NHẤT (kỷ lục thuộc về lần đầu chạm tới)", () => {
    const sessions = [session("2026-09-10" as DayKey), session("2026-09-02" as DayKey)];
    expect(personalRecords(sessions, 0, 30).mostSessionsInADay?.dayKey).toBe("2026-09-02");
  });

  it("chưa có phiên nào → null chứ không phải số 0 giả", () => {
    const r = personalRecords([], 0, 30);
    expect(r.mostSessionsInADay).toBeNull();
    expect(r.mostHoursInAWeek).toBeNull();
  });
});

describe("core/engine/longTermStats — khối 6 giờ theo nhãn, theo TUẦN", () => {
  it("weekStartsOf gom ngày thành tuần Thứ Hai, không lặp, giữ thứ tự", () => {
    // 2026-09-07 là Thứ Hai; lấy 10 ngày liên tiếp → chạm 2 tuần.
    const days = windowDaysOf("2026-09-16" as DayKey, 12, "2026-09-07" as DayKey);
    expect(weekStartsOf(days)).toEqual(["2026-09-07", "2026-09-14"]);
  });

  it("weekStartsOf: ngày bắt đầu GIỮA tuần vẫn quy về Thứ Hai của tuần đó", () => {
    const days = windowDaysOf("2026-09-05" as DayKey, 12, "2026-09-03" as DayKey);
    expect(weekStartsOf(days)[0]).toBe("2026-08-31");
  });

  it("gom đúng nhãn vào đúng tuần", () => {
    const weeks = ["2026-09-07", "2026-09-14"] as DayKey[];
    const sessions = [
      session("2026-09-07" as DayKey, 1),
      session("2026-09-09" as DayKey, 1),
      session("2026-09-09" as DayKey, 2),
      session("2026-09-15" as DayKey, 2),
    ];
    const rows = hoursByLabelPerWeek(sessions, weeks, 30);
    expect(rows[0].hoursByLabelId.get(1)).toBe(1);
    expect(rows[0].hoursByLabelId.get(2)).toBe(0.5);
    expect(rows[1].hoursByLabelId.get(2)).toBe(0.5);
    expect(rows[1].hoursByLabelId.get(1)).toBeUndefined();
  });

  it("phiên CUỐI TUẦN vẫn thuộc tuần bắt đầu từ Thứ Hai trước đó, không rơi sang tuần sau", () => {
    // 2026-09-13 là Chủ nhật của tuần bắt đầu 2026-09-07.
    const rows = hoursByLabelPerWeek([session("2026-09-13" as DayKey, 1)], ["2026-09-07"] as DayKey[], 30);
    expect(rows[0].hoursByLabelId.get(1)).toBe(0.5);
  });

  it("tuần trống vẫn có dòng, map rỗng", () => {
    const rows = hoursByLabelPerWeek([], ["2026-09-07"] as DayKey[], 30);
    expect(rows).toHaveLength(1);
    expect(rows[0].hoursByLabelId.size).toBe(0);
  });

  it("hoursOf khớp với cách khối 1 tính giờ", () => {
    expect(hoursOf(4, 30)).toBe(2);
  });
});

describe("core/engine/longTermStats — khung CẮT tại ngày bắt đầu (§5.8 [SỬA — 2026-09-06])", () => {
  it("bắt đầu dùng app trong khung → lưới mở đầu đúng NGÀY BẮT ĐẦU, không lùi thêm", () => {
    const days = windowDaysOf("2026-09-20" as DayKey, 12, "2026-09-07" as DayKey);
    expect(days[0]).toBe("2026-09-07");
    expect(days[days.length - 1]).toBe("2026-09-20");
    expect(days).toHaveLength(14);
  });

  it("bắt đầu TRƯỚC khung 12 tháng → khung lăn vẫn là trần trên, không nới rộng ra", () => {
    const days = windowDaysOf("2026-09-06" as DayKey, 12, "2020-01-01" as DayKey);
    expect(days[0]).toBe("2025-10-01");
  });

  it("không truyền ngày bắt đầu → giữ nguyên hành vi cũ (đủ 12 tháng)", () => {
    expect(windowDaysOf("2026-09-06" as DayKey, 12)[0]).toBe("2025-10-01");
  });

  it("windowMonthsOf cắt bỏ những tháng nằm hoàn toàn trước ngày bắt đầu", () => {
    expect(windowMonthsOf("2026-09-06" as DayKey, 12, "2026-09-07" as DayKey)).toEqual(["2026-09"]);
    expect(windowMonthsOf("2026-12-06" as DayKey, 12, "2026-09-07" as DayKey)).toEqual([
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
  });

  it("windowMonthsOf: bắt đầu trước khung → giữ đủ 12 tháng, không trả mảng rỗng", () => {
    expect(windowMonthsOf("2026-09-06" as DayKey, 12, "2020-01-01" as DayKey)).toHaveLength(12);
  });
});
