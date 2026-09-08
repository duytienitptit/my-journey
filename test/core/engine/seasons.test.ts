import { describe, expect, it } from "vitest";
import { knownTetYears, seasonOf, tetEveOf } from "../../../core/engine/seasons";
import type { DayKey } from "../../../core/types";

describe("core/engine/seasons — seasonOf, Tết", () => {
  it("mùng 1 Tết → tet", () => {
    expect(seasonOf("2026-02-17" as DayKey)).toBe("tet");
  });

  it("mùng 7 Tết (cuối cửa sổ, biên đóng) → tet", () => {
    expect(seasonOf("2026-02-23" as DayKey)).toBe("tet");
  });

  it("mùng 8 Tết (ngoài cửa sổ) → không còn là tet", () => {
    expect(seasonOf("2026-02-24" as DayKey)).not.toBe("tet");
  });

  it("một ngày trước mùng 1 (29 Tết) → chưa phải tet", () => {
    expect(seasonOf("2026-02-16" as DayKey)).not.toBe("tet");
  });

  it("năm không có trong bảng TET_FIRST_DAY → không throw, không phải tet", () => {
    expect(() => seasonOf("2099-02-01" as DayKey)).not.toThrow();
    expect(seasonOf("2099-02-01" as DayKey)).not.toBe("tet");
  });
});

describe("core/engine/seasons — seasonOf, Giáng sinh", () => {
  it("20/12 (đầu cửa sổ) → christmas", () => {
    expect(seasonOf("2026-12-20" as DayKey)).toBe("christmas");
  });

  it("25/12 → christmas", () => {
    expect(seasonOf("2026-12-25" as DayKey)).toBe("christmas");
  });

  it("26/12 (cuối cửa sổ) → christmas", () => {
    expect(seasonOf("2026-12-26" as DayKey)).toBe("christmas");
  });

  it("19/12 (trước cửa sổ) → không phải christmas", () => {
    expect(seasonOf("2026-12-19" as DayKey)).not.toBe("christmas");
  });

  it("27/12 (sau cửa sổ) → không phải christmas", () => {
    expect(seasonOf("2026-12-27" as DayKey)).not.toBe("christmas");
  });
});

describe("core/engine/seasons — seasonOf, mùa theo tháng", () => {
  it("tháng 6-8 → summer", () => {
    expect(seasonOf("2026-06-15" as DayKey)).toBe("summer");
    expect(seasonOf("2026-07-01" as DayKey)).toBe("summer");
    expect(seasonOf("2026-08-31" as DayKey)).toBe("summer");
  });

  it("tháng 9-11 → rainy", () => {
    expect(seasonOf("2026-09-15" as DayKey)).toBe("rainy");
    expect(seasonOf("2026-10-01" as DayKey)).toBe("rainy");
    expect(seasonOf("2026-11-30" as DayKey)).toBe("rainy");
  });

  it("tháng còn lại (không Tết/Giáng sinh) → default", () => {
    expect(seasonOf("2026-04-15" as DayKey)).toBe("default");
    expect(seasonOf("2026-12-01" as DayKey)).toBe("default"); // tháng 12 nhưng chưa vào cửa sổ Giáng sinh
  });
});

describe("core/engine/seasons — tetEveOf, knownTetYears", () => {
  it("đêm giao thừa = một ngày trước mùng 1 Tết năm đó", () => {
    expect(tetEveOf(2026)).toBe("2026-02-16");
    expect(tetEveOf(2027)).toBe("2027-02-05");
  });

  it("năm không có trong bảng → null, không throw", () => {
    expect(tetEveOf(2099)).toBeNull();
  });

  it("knownTetYears trả về đúng các năm đã tra cứu, tăng dần", () => {
    const years = knownTetYears();
    expect(years[0]).toBe(2026);
    expect(years[years.length - 1]).toBe(2035);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });
});
