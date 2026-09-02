import { afterEach, describe, expect, it } from "vitest";
import { now, setClockOverride } from "../../core/clock";

describe("core/clock", () => {
  afterEach(() => {
    // Không để trạng thái ghim rò sang test khác — clock.ts là singleton module-level.
    setClockOverride(null);
  });

  it("mặc định trả về giờ thật, sát Date.now()", () => {
    const before = Date.now();
    const value = now();
    const after = Date.now();
    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(after);
  });

  it("ghim đồng hồ thì now() trả đúng giá trị ghim, không đổi theo thời gian thật", () => {
    const pinned = Date.UTC(2026, 0, 1, 0, 0, 0);
    setClockOverride(pinned);
    expect(now()).toBe(pinned);
    expect(now()).toBe(pinned); // gọi lần hai vẫn y hệt — không lặng lẽ tick theo giờ thật
  });

  it("gỡ ghim (null) thì quay lại giờ thật", () => {
    setClockOverride(Date.UTC(2000, 0, 1));
    setClockOverride(null);
    const value = now();
    expect(Math.abs(value - Date.now())).toBeLessThan(1000);
  });
});
