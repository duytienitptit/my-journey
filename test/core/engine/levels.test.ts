import { describe, expect, it } from "vitest";
import { levelForXp, stageForTotalXp, xpRequiredForLevel } from "../../../core/engine/levels";

describe("core/engine/levels — xpRequiredForLevel khớp bảng SPEC.md §4.8", () => {
  it.each([
    [1, 300],
    [5, 4500],
    [10, 16500],
    [15, 36000],
    [20, 63000],
    [30, 139500],
  ])("cấp %d cần %d XP", (level, xp) => {
    expect(xpRequiredForLevel(level)).toBe(xp);
  });

  it("cấp 0 cần 0 XP", () => {
    expect(xpRequiredForLevel(0)).toBe(0);
  });
});

describe("core/engine/levels — levelForXp", () => {
  it("0 XP → cấp 0", () => {
    expect(levelForXp(0)).toBe(0);
  });

  it("299 XP (thiếu 1) → vẫn cấp 0", () => {
    expect(levelForXp(299)).toBe(0);
  });

  it("đúng 300 XP → cấp 1", () => {
    expect(levelForXp(300)).toBe(1);
  });

  it("299999 → vẫn dưới cấp tương ứng, không vượt", () => {
    // cấp 44: 150*44*45=297000; cấp 45: 150*45*46=310500
    expect(levelForXp(297000)).toBe(44);
    expect(levelForXp(297000 - 1)).toBe(43);
    expect(levelForXp(310499)).toBe(44);
    expect(levelForXp(310500)).toBe(45);
  });

  it("khớp ngược lại xpRequiredForLevel cho mọi cấp 0-60 (roundtrip)", () => {
    for (let n = 0; n <= 60; n++) {
      const xp = xpRequiredForLevel(n);
      expect(levelForXp(xp)).toBe(n);
      if (n > 0) expect(levelForXp(xp - 1)).toBe(n - 1);
    }
  });

  it("XP rất lớn không rơi vào sai số dấu phẩy động", () => {
    const xp = xpRequiredForLevel(500);
    expect(levelForXp(xp)).toBe(500);
    expect(levelForXp(xp - 1)).toBe(499);
  });
});

describe("core/engine/levels — stageForTotalXp khớp bảng SPEC.md §4.8", () => {
  it.each([
    [0, 1],
    [2999, 1],
    [3000, 2],
    [9999, 2],
    [10000, 3],
    [22999, 3],
    [23000, 4],
    [42999, 4],
    [43000, 5],
    [72999, 5],
    [73000, 6],
    [112999, 6],
    [113000, 7],
    [157999, 7],
    [158000, 8],
    [207999, 8],
    [208000, 9], // "Thanh niên"
    [1_000_000, 9], // không có giai đoạn 10 trong bảng số — mốc "Trưởng thành" xét riêng (chapters, mốc 5)
  ])("tổng XP %d → giai đoạn %d", (totalXp, stage) => {
    expect(stageForTotalXp(totalXp)).toBe(stage);
  });
});
