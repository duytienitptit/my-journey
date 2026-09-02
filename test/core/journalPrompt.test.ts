import { describe, expect, it } from "vitest";
import { promptIndexForDay } from "../../core/journalPrompt";
import type { DayKey } from "../../core/types";

describe("core/journalPrompt — promptIndexForDay", () => {
  it("cùng một ngày luôn ra cùng một chỉ số", () => {
    const a = promptIndexForDay("2026-09-03", 30);
    const b = promptIndexForDay("2026-09-03", 30);
    expect(a).toBe(b);
  });

  it("ngày liên tiếp thường ra chỉ số khác nhau (đổi mỗi ngày)", () => {
    const days: DayKey[] = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"];
    const indices = days.map((d) => promptIndexForDay(d, 30));
    const changes = indices.filter((v, i) => i > 0 && v !== indices[i - 1]);
    expect(changes.length).toBeGreaterThan(0);
  });

  it("luôn nằm trong khoảng [0, promptCount)", () => {
    for (const d of ["2026-01-01", "2026-12-31", "2028-02-29"] as DayKey[]) {
      const idx = promptIndexForDay(d, 7);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(7);
    }
  });

  it("promptCount = 0 không chia cho 0, trả về 0", () => {
    expect(promptIndexForDay("2026-09-03", 0)).toBe(0);
  });

  it("promptCount = 1 luôn trả về 0", () => {
    expect(promptIndexForDay("2026-09-03", 1)).toBe(0);
    expect(promptIndexForDay("2028-02-29", 1)).toBe(0);
  });
});
