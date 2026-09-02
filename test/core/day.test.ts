import { describe, expect, it } from "vitest";
import {
  addDays,
  dayKeyOf,
  enumerateDayKeys,
  isoWeekdayOf,
  mondayOf,
  parseDayKey,
  startOfDayMs,
  weekOf,
} from "../../core/day";
import type { DayKey } from "../../core/types";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // Asia/Ho_Chi_Minh = UTC+7, không đổi giờ mùa

/**
 * ms epoch cho một thời điểm GIỜ VIỆT NAM tường minh, không phụ thuộc code đang test.
 * Ví dụ vnLocal(2026, 8, 2, 3, 59) = 2026-09-02 03:59 giờ Hà Nội (tháng 0-based như Date.UTC).
 */
function vnLocal(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0,
): number {
  return Date.UTC(year, monthIndex, day, hour, minute, second) - VN_OFFSET_MS;
}

describe("core/day — dayKeyOf, mốc 4 giờ sáng", () => {
  it("giữa ngày (17h) thuộc đúng ngày lịch", () => {
    expect(dayKeyOf(vnLocal(2026, 8, 2, 17, 0, 0))).toBe("2026-09-02");
  });

  it("03:59:59 — trước mốc, vẫn thuộc ngày hôm trước", () => {
    expect(dayKeyOf(vnLocal(2026, 8, 2, 3, 59, 59))).toBe("2026-09-01");
  });

  it("04:00:00 — đúng mốc, đã sang ngày mới", () => {
    expect(dayKeyOf(vnLocal(2026, 8, 2, 4, 0, 0))).toBe("2026-09-02");
  });

  it("03:50 vẫn là hôm qua, 04:15 đã là hôm nay (canh biên quanh mốc)", () => {
    expect(dayKeyOf(vnLocal(2026, 8, 2, 3, 50, 0))).toBe("2026-09-01");
    expect(dayKeyOf(vnLocal(2026, 8, 2, 4, 15, 0))).toBe("2026-09-02");
  });

  it("qua năm mới, 2 giờ sáng mùng 1 vẫn tính là 31/12 năm cũ", () => {
    expect(dayKeyOf(vnLocal(2026, 0, 1, 2, 0, 0))).toBe("2025-12-31");
  });

  it("năm nhuận — 03:00 ngày 29/2 lùi về 28/2; năm thường lùi về 28/2 của tháng 3", () => {
    // 2028 là năm nhuận (chia hết cho 4, không phải năm thế kỷ không chia hết 400).
    expect(dayKeyOf(vnLocal(2028, 1, 29, 3, 0, 0))).toBe("2028-02-28");
    // 03:00 ngày 1/3 lùi về ngày cuối cùng của tháng 2 — 29/2 vì 2028 nhuận.
    expect(dayKeyOf(vnLocal(2028, 2, 1, 3, 0, 0))).toBe("2028-02-29");
    // Cùng phép tính ở năm KHÔNG nhuận (2029) phải lùi về 28/2, không phải 29/2.
    expect(dayKeyOf(vnLocal(2029, 2, 1, 3, 0, 0))).toBe("2029-02-28");
  });

  it("mỗi 24 giờ liên tiếp chỉ đổi dayKey đúng một lần, ngay tại mốc 4h", () => {
    const base = vnLocal(2026, 5, 15, 0, 0, 0); // 2026-06-15 00:00 giờ VN
    const keys = Array.from({ length: 24 }, (_, h) => dayKeyOf(base + h * 60 * 60 * 1000));
    const changes = keys.filter((k, i) => i > 0 && k !== keys[i - 1]);
    expect(changes).toHaveLength(1); // đúng một lần đổi trong 24 giờ
    expect(keys[3]).toBe(keys[0]); // 03:00 vẫn cùng ngày với 00:00 (chưa qua mốc)
    expect(keys[4]).not.toBe(keys[3]); // 04:00 đã đổi ngày
  });
});

describe("core/day — startOfDayMs, vòng qua lại với dayKeyOf", () => {
  const samples: DayKey[] = ["2026-01-01", "2026-09-02", "2028-02-29", "2026-12-31"];

  it.each(samples)("startOfDayMs(%s) fold lại đúng dayKey đó", (key) => {
    expect(dayKeyOf(startOfDayMs(key))).toBe(key);
  });

  it.each(samples)("1ms trước mốc bắt đầu của %s thuộc ngày liền trước", (key) => {
    expect(dayKeyOf(startOfDayMs(key) - 1)).toBe(addDays(key, -1));
  });

  it("mốc bắt đầu ngày là đúng 04:00:00.000 giờ Việt Nam", () => {
    expect(startOfDayMs("2026-09-02")).toBe(vnLocal(2026, 8, 2, 4, 0, 0));
  });
});

describe("core/day — addDays, qua tháng/năm", () => {
  it("cộng xuôi qua cuối năm", () => {
    expect(addDays("2026-12-30", 5)).toBe("2027-01-04");
  });

  it("trừ lùi qua đầu năm", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("cộng 0 ngày trả lại chính nó", () => {
    expect(addDays("2026-09-02", 0)).toBe("2026-09-02");
  });
});

describe("core/day — isoWeekdayOf, mondayOf, weekOf (tuần Thứ Hai → Chủ nhật)", () => {
  // 2026-01-01 là Thứ Năm (kiểm hai lần bằng hai mốc neo khác nhau: 2024-01-01 = Thứ Hai,
  // và 2000-01-01 = Thứ Bảy — cả hai cách tính đều cho cùng một đáp số).
  it("2026-09-02 là Thứ Tư (ISO = 3)", () => {
    expect(isoWeekdayOf("2026-09-02")).toBe(3);
  });

  it("Thứ Hai và Chủ nhật có ISO weekday đúng 1 và 7", () => {
    expect(isoWeekdayOf("2026-08-31")).toBe(1); // Thứ Hai của tuần chứa 2026-09-02
    expect(isoWeekdayOf("2026-09-06")).toBe(7); // Chủ nhật của tuần đó
  });

  it("mondayOf trả về đúng Thứ Hai của tuần, kể cả khi đầu vào đã là Thứ Hai hoặc Chủ nhật", () => {
    expect(mondayOf("2026-09-02")).toBe("2026-08-31");
    expect(mondayOf("2026-08-31")).toBe("2026-08-31"); // đầu vào là Thứ Hai
    expect(mondayOf("2026-09-06")).toBe("2026-08-31"); // đầu vào là Chủ nhật
  });

  it("weekOf trả về đúng 7 ngày liên tiếp Thứ Hai → Chủ nhật", () => {
    expect(weekOf("2026-09-02")).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
  });
});

describe("core/day — parseDayKey", () => {
  it("phân rã đúng năm/tháng/ngày", () => {
    expect(parseDayKey("2026-09-02")).toEqual({ year: 2026, month: 9, day: 2 });
  });

  it("ném lỗi với định dạng sai", () => {
    expect(() => parseDayKey("2026-9-2" as DayKey)).toThrow();
    expect(() => parseDayKey("not-a-date" as DayKey)).toThrow();
  });
});

describe("core/day — enumerateDayKeys", () => {
  it("liệt kê đủ, hai đầu đều gồm", () => {
    expect(enumerateDayKeys("2026-09-01", "2026-09-04")).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
    ]);
  });

  it("fromKey = toKey → mảng một phần tử", () => {
    expect(enumerateDayKeys("2026-09-02", "2026-09-02")).toEqual(["2026-09-02"]);
  });

  it("fromKey sau toKey → mảng rỗng", () => {
    expect(enumerateDayKeys("2026-09-05", "2026-09-01")).toEqual([]);
  });

  it("qua tháng/năm vẫn đúng thứ tự", () => {
    expect(enumerateDayKeys("2026-12-30", "2027-01-02")).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });

  it("so sánh chuỗi YYYY-MM-DD xếp đúng thứ tự thời gian (không cần hàm so sánh riêng)", () => {
    expect("2026-09-02" < "2026-09-10").toBe(true); // không bị lỗi so sánh "9" > "1" kiểu chuỗi tự do — nhờ số 0 đệm trước
    expect("2026-12-31" < "2027-01-01").toBe(true);
  });
});
